"""Ta-Ta (VTEX FastStore).

What this relies on (probed 2026-10-17, see docs/notes/price-sources-research.md):
- Listings come from the public GraphQL `ProductsQuery`, the same one the site makes: pages of up
  to 100 products, with a `totalCount`. Asking past about 2,500 results fails, so the catalog is
  read one category at a time (facets `category-1`, `category-2`, `category-3`).
- The category tree is public on the site's checkout host.
- `sku` is the VTEX item id (what the add-to-cart link takes). `gtin` is an internal code, not an EAN.
- `salesChannel` 4 is the default for anonymous visitors.
- The site's terms forbid reproducing images: none are stored.
"""
from __future__ import annotations

import json
from collections.abc import Callable, Iterator
from dataclasses import dataclass, field
from urllib.parse import urlparse

from .rows import add_note, make_row, previous_if_higher, to_float
from .sizes import fix_mojibake, parse_size, size_fields, size_from_unit

BASE = "https://www.tata.com.uy"
GRAPHQL_URL = f"{BASE}/api/graphql"
TREE_URL = "https://secure.tata.com.uy/api/catalog_system/pub/category/tree/3"
SALES_CHANNEL = "4"
PRICE_CONTEXT = f"Default sales channel for anonymous visitors: {SALES_CHANNEL}"
PAGE_SIZE = 100
MAX_RESULTS = 2500  # the search fails when asked for results past this
# Departments nobody shops for from a diet: clothing.
SKIPPED_DEPARTMENTS = ("textil", "ropa-calzados-y-accesorios")

Facets = list[tuple[str, str]]


@dataclass
class Category:
    id: str
    path: list[str]  # slugs from the department down
    children: list[Category] = field(default_factory=list)


def parse_tree(nodes: list[dict]) -> list[Category]:
    return [
        Category(str(n["id"]), urlparse(n.get("url") or "").path.strip("/").split("/"), parse_tree(n.get("children") or []))
        for n in nodes
    ]


def category_paths(tree: list[Category]) -> dict[str, str]:
    """Category id -> slug path, e.g. "almacen/desayuno/cafe"."""
    out = {}
    for c in tree:
        out[c.id] = "/".join(c.path)
        out.update(category_paths(c.children))
    return out


def query_params(facets: Facets, after: int, first: int = PAGE_SIZE) -> dict:
    channel = json.dumps({"salesChannel": SALES_CHANNEL, "regionId": ""}, separators=(",", ":"))
    variables = {
        "first": first, "after": str(after), "sort": "name_asc", "term": "",
        "selectedFacets": [{"key": "channel", "value": channel}, {"key": "locale", "value": "es-uy"},
                           *({"key": k, "value": v} for k, v in facets)],
    }
    return {"operationName": "ProductsQuery", "variables": json.dumps(variables, separators=(",", ":"))}


def parse_page(payload: dict) -> tuple[int, list[dict]]:
    """(totalCount, product nodes) of one GraphQL response. Raises on a GraphQL error."""
    if payload.get("errors"):
        raise ValueError(f"GraphQL errors: {str(payload['errors'])[:200]}")
    products = ((payload.get("data") or {}).get("search") or {}).get("products") or {}
    total = (products.get("pageInfo") or {}).get("totalCount") or 0
    return total, [e["node"] for e in products.get("edges") or [] if e.get("node")]


def iter_pages(fetch: Callable[[Facets, int], tuple[int, list[dict]]], tree: list[Category],
               max_results: int = MAX_RESULTS) -> Iterator[list[dict]]:
    """Every page of the catalog. A category with more results than the search can page through is
    read through its subcategories instead. `fetch(facets, after)` returns (totalCount, nodes)."""

    def walk(category: Category, parent_facets: Facets) -> Iterator[list[dict]]:
        facets = [*parent_facets, (f"category-{len(parent_facets) + 1}", category.path[-1])]
        total, nodes = fetch(facets, 0)
        if total > max_results and category.children:
            for child in category.children:
                yield from walk(child, facets)
            return
        yield nodes
        after = PAGE_SIZE
        while nodes and after < min(total, max_results):
            _, nodes = fetch(facets, after)
            yield nodes
            after += PAGE_SIZE

    for department in tree:
        if department.path[0] not in SKIPPED_DEPARTMENTS:
            yield from walk(department, [])


def node_row(node: dict, paths: dict[str, str], run_id: int, checked_at: str) -> dict:
    offers = (node.get("offers") or {}).get("offers") or []
    offer = offers[0] if offers else {}
    name = fix_mojibake(node.get("name"))
    # Sold by weight or volume, the price is for unitMultiplier × measurementUnit, which can differ
    # from the weight in the name ("... 780 G" priced for 0.827 kg). Over 1 kg, it's per kg.
    name_size = parse_size(name)
    size, source = size_from_unit(node.get("measurementUnit"), to_float(node.get("unitMultiplier"))), "unit"
    if size is None:
        size, source = name_size, "name"
    per_kg = source == "unit" and size["size_unit"] == "kg" and size["size_qty"] > 1
    mismatch = source == "unit" and not per_kg and name_size and (name_size["base_qty"], name_size["base_unit"]) != (
        size["base_qty"], size["base_unit"])
    category_ids = [str(c) for c in node.get("categoriesIds") or [] if str(c) in paths]
    price = to_float(offer.get("price"))
    multicurrency = bool(node.get("hasMulticurrencyPrice"))
    row = make_row(
        store_key="tata", store_sku=str(node["sku"]), store_code=node.get("gtin"), name=name,
        brand=fix_mojibake((node.get("brand") or {}).get("name")),
        category=max((paths[c] for c in category_ids), key=lambda p: p.count("/"), default=None),
        url_path=f"/{node['slug']}/p", **size_fields(size, source),
        price=price, previous_price=previous_if_higher(to_float(offer.get("listPrice")), price),
        # Ta-Ta shows prices in pesos; a product flagged as multicurrency may not be.
        currency=None if multicurrency else "UYU",
        availability=(offer.get("availability") or "").rsplit("/", 1)[-1] or None,
        read_from="search_api", run_id=run_id, checked_at=checked_at,
    )
    if mismatch:
        add_note(row, f"priced for {size['size_qty']:g} {size['size_unit']}; the name says otherwise")
    if multicurrency:
        add_note(row, "multicurrency price in source; currency unknown")
    return row
