"""Scraper for Devoto, Géant and Disco (Grupo Disco Uruguay / Grupo Éxito).

Findings behind the design:
- All three sites are a Blazor Server app with prerendered HTML: product pages carry
  schema.org/Product JSON-LD (price, GTIN/EAN, brand, availability) without running JavaScript.
- The subcategory listing is NOT in the HTML (it loads over the interactive connection), so
  discovery uses the public sitemap declared in robots.txt.
- The three chains share SKU ids: we discover in Devoto's sitemap and request the same id on
  every site.
- Prices belong to the default branch the site gives an anonymous visitor (recorded in every
  offer, field `price_context`).
"""
from __future__ import annotations

import html
import json
import re
import time
from pathlib import Path

from basket import BASKET, GDU_MAX_PER_ITEM
from common import (EMPTY_SIZE, BlockedError, drop_placeholder_price, PoliteSession, gtin13, now_iso, parse_size,
                    unit_price, valid_gtin)

STORES = {
    "devoto": {"name": "Devoto", "base": "https://www.devoto.com.uy"},
    "geant": {"name": "Géant", "base": "https://www.geant.com.uy"},
    "disco": {"name": "Disco", "base": "https://www.disco.com.uy"},
}
DISCOVERY_STORE = "devoto"
CACHE_DIR = Path(__file__).parent / "data" / "cache"
SITEMAP_CACHE_TTL_S = 24 * 3600


# ------------------------------------------------------------------ discovery

def load_sitemap_slugs(sess: PoliteSession, store: str = DISCOVERY_STORE, refresh: bool = False,
                       timings: dict | None = None) -> list[str]:
    """Returns 'slug/id' for every product in the sitemap (cached 24 h: about 15 MB)."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache = CACHE_DIR / f"{store}_sitemap_slugs.txt"
    if cache.exists() and not refresh and time.time() - cache.stat().st_mtime < SITEMAP_CACHE_TTL_S:
        if timings is not None:
            timings["sitemap_from_cache"] = True
        return cache.read_text().splitlines()
    base = STORES[store]["base"]
    index = sess.get(f"{base}/sitemap.xml").text
    slugs: list[str] = []
    parse_cpu = 0.0
    size = 0
    for sm in re.findall(r"<loc>([^<]+)</loc>", index):
        body = sess.get(sm.strip()).text
        size += len(body)
        t0 = time.process_time()
        slugs += re.findall(r"<loc>https?://[^/]+/product/([^<]+)</loc>", body)
        parse_cpu += time.process_time() - t0
    if timings is not None:
        timings.update({"sitemap_from_cache": False, "sitemap_bytes": size,
                        "sitemap_parse_cpu_s": round(parse_cpu, 3)})
    cache.write_text("\n".join(slugs))
    return slugs


def select_candidates(slugs: list[str]) -> list[dict]:
    """Applies the basket filters. Repeated slugs are deduplicated, keeping the highest id."""
    by_slug: dict[str, int] = {}
    for s in slugs:
        if "/" not in s:
            continue
        slug, _, pid = s.rpartition("/")
        if pid.isdigit():
            by_slug[slug] = max(by_slug.get(slug, 0), int(pid))
    out, seen = [], set()
    for item in BASKET:
        if not item.get("slug"):
            continue
        rx = re.compile(item["slug"])
        brand_rx = re.compile(item["brands"]) if item.get("brands") else None
        hits = [(slug, pid) for slug, pid in by_slug.items()
                if rx.search(slug) and (brand_rx is None or brand_rx.search(slug))]
        hits.sort(key=lambda x: -x[1])  # newest ids first (more likely still active)
        for slug, pid in hits[:GDU_MAX_PER_ITEM]:
            if pid not in seen:
                seen.add(pid)
                out.append({"basket_key": item["key"], "slug": slug, "id": pid})
    return out


# ------------------------------------------------------------------ product page parsing

def _first(rx: str, text: str, flags=re.S) -> str | None:
    m = re.search(rx, text, flags)
    return html.unescape(m.group(1)).strip() if m else None


def _num_es(s: str | None) -> float | None:
    """'1.234,50' -> 1234.5 ; '95' -> 95.0"""
    if not s:
        return None
    s = s.strip().replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def parse_product_page(page: str) -> dict | None:
    page = re.sub(r"<!--.*?-->", "", page, flags=re.S)
    ld = None
    for raw in re.findall(r'<script type="application/ld(?:&#x2B;|\+)json">(.*?)</script>', page, re.S):
        try:
            obj = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if isinstance(obj, dict) and obj.get("@type") == "Product":
            ld = obj
    if not ld:
        return None
    offer = ld.get("offers") or {}
    prices_block = _first(r'<div class="det-precios"[^>]*>(.*?)<div class="det-add"', page) or ""
    before = _num_es(_first(r'<div class="before"[^>]*>.*?<span class="val">([^<]+)</span>', prices_block))
    html_price = _num_es(_first(r'<div class="text"[^>]*>.*?<span class="val">([^<]+)</span>', prices_block))
    labels_html = _first(r'<div class="vin-r det-labels">(.*?)</div>\s*</div>', page) or ""
    labels = [html.unescape(x).strip() for x in re.findall(r">([^<>]+)<", labels_html) if x.strip()]
    specs = dict((html.unescape(k).strip(), html.unescape(v).strip()) for k, v in
                 re.findall(r"<tr><th>(.*?)</th>\s*<td>(.*?)</td></tr>", page, re.S))
    crumbs = [html.unescape(x) for x in re.findall(r'<li class="breadcrumb-item"><a [^>]*>([^<]+)</a>', page)]
    return {
        "name": ld.get("name") or _first(r'<h1 class="det-nom">([^<]+)</h1>', page),
        "brand": ld.get("brand") if isinstance(ld.get("brand"), str) else (ld.get("brand") or {}).get("name"),
        "sku": ld.get("sku"),
        "gtin_raw": ld.get("gtin"),
        "price": offer.get("price"),
        "currency": offer.get("priceCurrency"),
        "availability": (offer.get("availability") or "").rsplit("/", 1)[-1] or None,
        "html_price": html_price,
        "previous_price": before,
        "promo_labels": labels,
        "content_spec": specs.get("Contenido"),
        "category": " > ".join(c for c in crumbs if c != "Home") or None,
        "branch": _first(r'<span class="text"><strong class="val">([^<]+)</strong>', page),
    }


def build_offer(store: str, cand: dict, url: str, final_url: str, p: dict) -> dict:
    size = parse_size(p["content_spec"]) if p.get("content_spec") else None
    size_source = "spec" if size else None
    name_size = parse_size(p["name"])
    if size is None and name_size:
        size, size_source = name_size, "name"
    notes = []
    if size and name_size and (size["base_qty"], size["base_unit"]) != (name_size["base_qty"], name_size["base_unit"]):
        notes.append(f"spec size ({p['content_spec']}) != size in name")
    price = float(p["price"]) if p.get("price") is not None else None
    if price is not None and p.get("html_price") is not None and abs(price - p["html_price"]) > 0.01:
        notes.append(f"JSON-LD price {price} != visible price {p['html_price']}")
    prev = p.get("previous_price")
    if prev is not None and price is not None and prev <= price:
        prev = None
    gt = p.get("gtin_raw")
    return {
        "store": STORES[store]["name"],
        "store_key": store,
        "store_url": STORES[store]["base"] + "/",
        "product_name": p["name"],
        "brand": p["brand"],
        "store_sku": p.get("sku") or str(cand["id"]),
        "store_code": None,
        "gtin": gtin13(gt),
        "gtin_raw": gt,
        "gtin_is_valid_ean": valid_gtin(gt),
        "price": price,
        "visible_price": p.get("html_price"),
        "currency": p.get("currency"),
        "previous_price": prev,
        "promo_labels": "; ".join(p.get("promo_labels") or []) or None,
        "size_text": p.get("content_spec"),
        "size_source": size_source,
        **(size or EMPTY_SIZE),
        **unit_price(price, size),
        "availability": p.get("availability"),
        "category": p.get("category"),
        "price_context": f"Default branch for anonymous visitors: {p.get('branch') or 'not given'}",
        "product_url": final_url,
        "source_url": url,
        "source_method": "Prerendered HTML + schema.org/Product JSON-LD",
        "basket_key": cand["basket_key"],
        "extracted_at": now_iso(),
        "notes": "; ".join(notes) or None,
    }


# ------------------------------------------------------------------ run

def run(sess: PoliteSession, stores=("devoto", "geant", "disco"), refresh_sitemap: bool = False,
        limit: int | None = None, timings: dict | None = None):
    """Returns (offers, report_per_store)."""
    report = {s: {"attempted": 0, "ok": 0, "not_found": 0, "no_price": 0, "errors": [], "blocked": None} for s in stores}
    try:
        slugs = load_sitemap_slugs(sess, refresh=refresh_sitemap, timings=timings)
    except BlockedError as e:
        for s in stores:
            report[s]["blocked"] = str(e)
        return [], report
    cands = select_candidates(slugs)
    if limit:
        cands = cands[:limit]
    for s in stores:
        report[s]["sitemap_products"] = len(slugs)
        report[s]["candidates"] = len(cands)

    offers = []
    parse_cpu = []
    for store in stores:
        base = STORES[store]["base"]
        for c in cands:
            url = f"{base}/product/{c['slug']}/{c['id']}"
            report[store]["attempted"] += 1
            try:
                r = sess.get(url, allow_redirects=True)
            except BlockedError as e:
                report[store]["blocked"] = str(e)
                break
            except Exception as e:  # network/timeout: log it and move on
                report[store]["errors"].append(f"{url}: {e}")
                continue
            t0 = time.process_time()
            p = parse_product_page(r.text) if r.status_code == 200 else None
            parse_cpu.append(time.process_time() - t0)
            if not p or str(p.get("sku")) != str(c["id"]):
                report[store]["not_found"] += 1
                continue
            o = drop_placeholder_price(build_offer(store, c, url, r.url, p))
            if o["price"] is None:
                report[store]["no_price"] += 1
                continue
            offers.append(o)
            report[store]["ok"] += 1
            print(f"  [{store}] {o['product_name']} -> ${o['price']}", flush=True)
    if timings is not None and parse_cpu:
        timings["gdu_page_parse_cpu_ms_avg"] = round(sum(parse_cpu) / len(parse_cpu) * 1000, 2)
    return offers, report
