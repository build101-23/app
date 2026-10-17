"""Devoto, Géant and Disco (Grupo Disco Uruguay): one platform behind three sites.

What this relies on (probed 2026-10-17, see docs/notes/price-sources-research.md):
- The sitemap lists the group's whole catalog, the same at the three sites: about 68,000 products
  (`/product/<slug>/<id>`, the slug starts with the product's name) and the category pages
  (`/products/category/<slug>/<id>`). Category ids grow two digits per level: department 10,
  category 1010, leaf 101013.
- A category page prerenders its top 12 products by relevance, with name, brand and price, in one
  request. There's no paging by URL. A brand page (`/products/brand/<id>`) does the same for one
  brand, so small brands come whole. Each card links to its brand's page.
- A product page has schema.org/Product JSON-LD (GTIN, price, availability), a "Contenido" spec and
  the category breadcrumb. It's one request per product, and many requests for products a chain
  doesn't carry came right before Devoto blocked us. So product pages are read only for foods the
  listings miss, a few per food, slowly.
- Prices are for the branch the site gives anonymous visitors, shown in every page's header.
"""
from __future__ import annotations

import html
import json
import re
import time
from pathlib import Path

from .fetch import PoliteSession
from .rows import add_note, make_row, previous_if_higher, to_float
from .sizes import gtin13, parse_size, size_fields

STORES = {
    "devoto": "https://www.devoto.com.uy",
    "geant": "https://www.geant.com.uy",
    "disco": "https://www.disco.com.uy",
}
SITEMAP_STORE = "devoto"  # the three sitemaps list the same catalog
SITEMAP_TTL_S = 24 * 3600
# Supermarket departments: almacén, bebidas, perfumería y limpieza, frescos, mascotas. The others
# (TV, furniture, clothing...) never end up on a shopping list.
SUPERMARKET_DEPARTMENTS = ("10", "11", "12", "14", "15")
SKIP_CATEGORY_SLUGS = ("no-usar",)
CURRENCIES = {"$": "UYU", "U$S": "USD", "US$": "USD"}
# Foods a menu needs (supabase/functions/_shared/catalog.ts) and the listings' top 12s miss, as the
# first words of a product slug. Each one gets a few product pages.
FOOD_TERMS = (
    "banana", "manzana", "naranja", "mandarina", "limon", "pera", "frutilla", "uva", "kiwi", "palta", "durazno",
    "zapallo", "zapallito", "calabacin", "brocoli", "acelga", "espinaca", "morron", "lechuga", "zanahoria",
    "boniato", "papa", "cebolla", "tomate", "ajo", "berenjena", "pepino", "choclo", "arvejas",
    "nalga", "carne-picada", "picada", "pulpa", "bife", "milanesa", "filet-de-merluza", "pechuga", "muslo",
    "pollo", "suprema", "huevos", "huevo", "avena", "polenta", "queso-ricota", "queso-ricotta", "requeson",
    "tapas", "pan-de-molde", "lentejas",
    "garbanzos", "porotos", "arroz", "leche", "yogur",
)
FOOD_PAGES_PER_TERM = 10


# ------------------------------------------------------------------ sitemap


class Sitemap:
    def __init__(self, products: dict[str, str], categories: dict[str, str]):
        self.products = products  # product id -> slug
        self.categories = categories  # category id -> slug

    @classmethod
    def parse(cls, bodies: list[str]) -> Sitemap:
        products: dict[str, str] = {}
        categories: dict[str, str] = {}
        for body in bodies:
            for slug, pid in re.findall(r"<loc>https?://[^/<]+/product/([^<]+)/(\d+)</loc>", body):
                products[pid] = slug
            for slug, cid in re.findall(r"<loc>https?://[^/<]+/products/category/([^/<]+)/(\d+)</loc>", body):
                categories[cid] = slug
        return cls(products, categories)

    def leaves(self, departments: tuple[str, ...]) -> list[str]:
        """Leaf category ids under the given departments, in id order."""
        ids = [c for c in self.categories if c.startswith(departments)
               and self.categories[c] not in SKIP_CATEGORY_SLUGS]
        return sorted(c for c in ids if not any(o != c and o.startswith(c) for o in self.categories))

    def path(self, category_id: str | None) -> str | None:
        """Slug path of a category, from its department down: almacen/canasta-familiar/arroz."""
        if not category_id or category_id not in self.categories:
            return None
        prefixes = (category_id[:n] for n in range(2, len(category_id) + 1, 2))
        return "/".join(self.categories[p] for p in prefixes if p in self.categories)


def read_sitemap(sess: PoliteSession, cache: Path, refresh: bool = False) -> Sitemap:
    """Reads the sitemap (about 10 MB) once a day; in between, from the cache file."""
    if not refresh and cache.exists() and time.time() - cache.stat().st_mtime < SITEMAP_TTL_S:
        data = json.loads(cache.read_text())
        return Sitemap(data["products"], data["categories"])
    base = STORES[SITEMAP_STORE]
    index = sess.get(f"{base}/sitemap.xml").text
    bodies = [sess.get(loc.strip()).text for loc in re.findall(r"<loc>([^<]+)</loc>", index)]
    sitemap = Sitemap.parse(bodies)
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(json.dumps({"products": sitemap.products, "categories": sitemap.categories}))
    return sitemap


# ------------------------------------------------------------------ pages


def _first(rx: str, text: str, flags=re.S) -> str | None:
    m = re.search(rx, text, flags)
    return html.unescape(m.group(1)).strip() if m else None


def _num_es(s: str | None) -> float | None:
    """'1.234,50' -> 1234.5 ; '95' -> 95.0"""
    if not s:
        return None
    try:
        return float(s.strip().replace(".", "").replace(",", "."))
    except ValueError:
        return None


def _texts(fragment: str) -> list[str]:
    texts = re.findall(r">([^<>]+)<", fragment) + re.findall(r'alt="([^"]+)"', fragment)
    return [t for t in (html.unescape(x).strip() for x in texts) if t]


def page_branch(page: str) -> str | None:
    return _first(r'<span class="text"><strong class="val">([^<]+)</strong>', page)


def price_context(branch: str | None) -> str | None:
    return f"Default branch for anonymous visitors: {branch}" if branch else None


def parse_listing_page(page: str) -> tuple[int | None, list[dict]]:
    """A category or brand page: (products it lists, cards). Only the first 12 cards are prerendered."""
    total = _first(r'<h6 class="total-prods[^"]*">\s*<strong>(\d+)</strong>', page)
    cards = []
    for chunk in page.split('<div class="product-item">')[1:]:
        link = re.search(r'<h3[^>]*>\s*<a href="/product/([^"]+)/(\d+)"[^>]*>([^<]+)</a>', chunk)
        if not link:
            continue
        prices = _first(r'<div class="desc-prices">(.*?)<div class="prod-labels">', chunk) or ""
        current = re.search(
            r'<div class="text"[^>]*>\s*<span class="mon"[^>]*>([^<]*)</span>\s*<span class="val"[^>]*>([^<]+)</span>',
            prices)
        labels = _first(r'<div class="prod-labels">(.*?)</div>\s*</div>\s*<div class="prod-add">', chunk) or ""
        button = re.search(r'<div class="prod-add">(.*?)</div>\s*</div>', chunk, re.S)
        cards.append({
            "id": link.group(2),
            "slug": link.group(1),
            "name": html.unescape(link.group(3)).strip(),
            "brand": _first(r'<div class="prod-cats">\s*<a href="/products/brand/\d+"[^>]*>([^<]+)</a>', chunk),
            "brand_id": _first(r'<div class="prod-cats">\s*<a href="/products/brand/(\d+)"', chunk),
            "currency_symbol": html.unescape(current.group(1)).strip() if current else None,
            "price": _num_es(current.group(2)) if current else None,
            "previous_price": _num_es(_first(r'<div class="before"[^>]*>.*?<span class="val"[^>]*>([^<]+)</span>', prices)),
            "labels": _texts(labels),
            "button": " ".join(_texts(button.group(1))) if button else None,
        })
    return int(total) if total else None, cards


def parse_product_page(page: str) -> dict | None:
    """Reads a product page. None when it has no schema.org/Product (not a product, or gone)."""
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
    labels_html = _first(r'<div class="vin-r det-labels">(.*?)</div>\s*</div>', page) or ""
    specs = dict((html.unescape(k).strip(), html.unescape(v).strip()) for k, v in
                 re.findall(r"<tr><th>(.*?)</th>\s*<td>(.*?)</td></tr>", page, re.S))
    crumbs = re.findall(r'<li class="breadcrumb-item"><a href="/products/category/[^"/]+/(\d+)"', page)
    brand = ld.get("brand")
    gtin = ld.get("gtin")
    return {
        "name": ld.get("name") or _first(r'<h1 class="det-nom">([^<]+)</h1>', page),
        "brand": brand if isinstance(brand, str) else (brand or {}).get("name"),
        "sku": str(ld.get("sku")) if ld.get("sku") is not None else None,
        "gtin_raw": str(gtin) if gtin is not None else None,
        "price": to_float(offer.get("price")),
        "currency": offer.get("priceCurrency"),
        "availability": (offer.get("availability") or "").rsplit("/", 1)[-1] or None,
        "html_price": _num_es(_first(r'<div class="text"[^>]*>.*?<span class="val">([^<]+)</span>', prices_block)),
        "previous_price": _num_es(_first(r'<div class="before"[^>]*>.*?<span class="val">([^<]+)</span>', prices_block)),
        "promo_labels": _texts(labels_html),
        "content_spec": specs.get("Contenido"),
        "category_id": crumbs[-1] if crumbs else None,
        "branch": page_branch(page),
    }


def food_candidates(sitemap: Sitemap, saved: set[str], terms: tuple[str, ...] = FOOD_TERMS,
                    per_term: int = FOOD_PAGES_PER_TERM) -> list[str]:
    """Product ids for the food pages phase: up to `per_term` per food, newest first (more likely
    still for sale), leaving out what's already saved. Foods take turns, so a run cut short by its
    budget still gets some of each."""
    queues = []
    for term in terms:
        ids = [pid for pid, slug in sitemap.products.items()
               if (slug == term or slug.startswith(term + "-")) and pid not in saved]
        queues.append(sorted(ids, key=int, reverse=True)[:per_term])
    seen: set[str] = set()
    out = []
    for i in range(per_term):
        for q in queues:
            if i < len(q) and q[i] not in seen:
                seen.add(q[i])
                out.append(q[i])
    return out


# ------------------------------------------------------------------ rows


def card_row(store: str, card: dict, category: str | None, run_id: int, checked_at: str) -> dict:
    size = parse_size(card["name"])
    currency = CURRENCIES.get(card["currency_symbol"] or "")
    row = make_row(
        store_key=store, store_sku=card["id"], name=card["name"], brand=card["brand"], category=category,
        url_path=f"/product/{card['slug']}/{card['id']}",
        **size_fields(size, "name"),
        price=card["price"], previous_price=previous_if_higher(card["previous_price"], card["price"]),
        currency=currency, promo_labels="; ".join(card["labels"]) or None,
        # The card offers "Agregar" only when the default branch can sell it.
        availability="InStock" if card["button"] == "Agregar" else None,
        # Category and brand pages are both listings: no GTIN, size from the name.
        read_from="category_page", run_id=run_id, checked_at=checked_at,
    )
    if card["currency_symbol"] and not currency:
        add_note(row, f"unknown currency symbol {card['currency_symbol']!r}")
    return row


def product_row(store: str, p: dict, url_path: str, category: str | None, run_id: int, checked_at: str) -> dict:
    size = parse_size(p["content_spec"]) if p.get("content_spec") else None
    source, text = ("spec", p["content_spec"]) if size else (None, None)
    name_size = parse_size(p["name"])
    notes = []
    if size and name_size and (size["base_qty"], size["base_unit"]) != (name_size["base_qty"], name_size["base_unit"]):
        notes.append(f"spec size ({p['content_spec']}) != size in name")
    if size is None and name_size:
        size, source = name_size, "name"
    price = p.get("price")
    if price is not None and p.get("html_price") is not None and abs(price - p["html_price"]) > 0.01:
        notes.append(f"JSON-LD price {price:g} != visible price {p['html_price']:g}")
    row = make_row(
        store_key=store, store_sku=p["sku"], gtin=gtin13(p.get("gtin_raw")), name=p["name"], brand=p["brand"],
        category=category, url_path=url_path, **size_fields(size, source, text),
        price=price, previous_price=previous_if_higher(p.get("previous_price"), price), currency=p.get("currency"),
        promo_labels="; ".join(p.get("promo_labels") or []) or None, availability=p.get("availability"),
        read_from="product_page", run_id=run_id, checked_at=checked_at,
    )
    for note in notes:
        add_note(row, note)
    return row
