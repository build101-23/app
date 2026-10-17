"""Scraper for Ta-Ta (VTEX FastStore, account `tatauy`).

Findings behind the design:
- Listings load client-side through a persisted GraphQL query (unauthenticated GET), the same
  one the browser makes. We use the site's search with each basket `term`.
- `salesChannel` 4 is the default for anonymous visitors (confirmed in the site's code).
- `gtin` is an internal code, not an EAN: it is stored as `store_code` and matching with the
  other chains goes by brand, name and size.
- `quantity: 10000` is a VTEX cap, not real stock: only availability is kept.
- The site's terms forbid reproducing images: none are stored.
"""
from __future__ import annotations

import json

from basket import BASKET, TATA_MAX_PER_ITEM
from common import EMPTY_SIZE, BlockedError, drop_placeholder_price, PoliteSession, norm_text, now_iso, parse_size, unit_price

BASE = "https://www.tata.com.uy"
GRAPHQL_URL = f"{BASE}/api/graphql"
SALES_CHANNEL = "4"


def search_params(term: str, first: int = TATA_MAX_PER_ITEM) -> dict:
    channel = json.dumps({"salesChannel": SALES_CHANNEL, "regionId": ""}, separators=(",", ":"))
    variables = {
        "first": first, "after": "0", "sort": "score_desc", "term": term,
        "selectedFacets": [{"key": "channel", "value": channel}, {"key": "locale", "value": "es-uy"}],
    }
    return {"operationName": "ProductsQuery", "variables": json.dumps(variables, separators=(",", ":"))}


def parse_search(payload: dict) -> list[dict]:
    """Flattens the GraphQL response into one dict per product node."""
    edges = (((payload.get("data") or {}).get("search") or {}).get("products") or {}).get("edges") or []
    out = []
    for e in edges:
        n = e.get("node") or {}
        offers = (n.get("offers") or {}).get("offers") or []
        o = offers[0] if offers else {}
        out.append({
            "name": n.get("name"),
            "brand": (n.get("brand") or {}).get("name"),
            "sku": n.get("sku"),
            "slug": n.get("slug"),
            "code": n.get("gtin"),
            "price": o.get("price"),
            "list_price": o.get("listPrice"),
            "availability": (o.get("availability") or "").rsplit("/", 1)[-1] or None,
        })
    return out


def keep(p: dict, item: dict) -> bool:
    """The product type must open the name: "azucar" must not keep "Coca-Cola Zero Azucar"."""
    return norm_text(p.get("name")).startswith(item["name_must"])


def build_offer(item: dict, p: dict, source_url: str) -> dict:
    size = parse_size(p["name"])
    price = float(p["price"]) if p.get("price") is not None else None
    prev = float(p["list_price"]) if p.get("list_price") is not None else None
    if prev is not None and (price is None or prev <= price):
        prev = None
    return {
        "store": "Ta-Ta",
        "store_key": "tata",
        "store_url": BASE + "/",
        "product_name": p["name"],
        "brand": p["brand"],
        "store_sku": p.get("sku"),
        "store_code": p.get("code"),
        "gtin": None,
        "gtin_raw": None,
        "gtin_is_valid_ean": False,
        "price": price,
        "visible_price": None,
        "currency": "UYU",
        "previous_price": prev,
        "promo_labels": None,
        "size_text": None,
        "size_source": "name" if size else None,
        **(size or EMPTY_SIZE),
        **unit_price(price, size),
        "availability": p.get("availability"),
        "category": None,
        "price_context": f"Default sales channel for anonymous visitors: {SALES_CHANNEL}",
        "product_url": f"{BASE}/{p['slug']}/p" if p.get("slug") else None,
        "source_url": source_url,
        "source_method": "VTEX FastStore GraphQL ProductsQuery (public, unauthenticated GET)",
        "basket_key": item["key"],
        "extracted_at": now_iso(),
        "notes": None,
    }


def run(sess: PoliteSession, limit: int | None = None):
    """Returns (offers, report). `limit` caps products kept per basket item."""
    report = {"attempted": 0, "ok": 0, "filtered_out": 0, "no_price": 0, "errors": [], "blocked": None}
    offers, seen = [], set()
    for item in BASKET:
        params = search_params(item["term"])
        report["attempted"] += 1
        try:
            r = sess.get(GRAPHQL_URL, params=params)
            payload = r.json()
        except BlockedError as e:
            report["blocked"] = str(e)
            break
        except Exception as e:  # network/timeout/bad JSON: log it and move on
            report["errors"].append(f"{item['term']}: {e}")
            continue
        if payload.get("errors"):
            report["errors"].append(f"{item['term']}: {payload['errors']}")
        kept = 0
        for p in parse_search(payload):
            if not keep(p, item):
                report["filtered_out"] += 1
                continue
            if p["sku"] in seen or (limit and kept >= limit):
                continue
            o = drop_placeholder_price(build_offer(item, p, r.url))
            if o["price"] is None:
                report["no_price"] += 1
                continue
            seen.add(p["sku"])
            kept += 1
            offers.append(o)
            report["ok"] += 1
            print(f"  [tata] {o['product_name']} -> ${o['price']}", flush=True)
    return offers, report
