"""Cross-chain matching: same product first, the most similar one when a chain doesn't have it.

Levels, from most to least confident:
- exact_gtin: same EAN.
- exact_sku: same SKU id at Devoto, Géant or Disco, which share ids (some products have no EAN).
- exact: same normalized brand + same base size (pack included) + same type tokens.
- review: same brand and size with only partial token overlap, or fits several groups.
  Never joined automatically.
- substitute: no exact match at that chain. Same basket item, same critical tokens and at least
  half the name words in common; brand and/or size may differ. Compared by unit price only.
  PROVISIONAL rule: what counts as "most similar" is still an open decision.
"""
from __future__ import annotations

from common import norm_text

STORE_ORDER = ("devoto", "geant", "disco", "tata")
GDU_STORES = ("devoto", "geant", "disco")

# Words that don't describe the product type (packaging, connectors, units).
STOPWORDS = {
    "de", "del", "la", "el", "los", "las", "con", "x", "y", "bolsa", "paquete", "pack", "botella",
    "sachet", "caja", "lata", "frasco", "pet", "tetra", "envase", "un", "u", "unid", "unidad",
    "unidades", "g", "gr", "grs", "gramos", "kg", "kgs", "kilo", "ml", "cc", "l", "lt", "lts",
    "litro", "litros", "pote", "doypack", "pouch", "bot", "bt", "pq", "paq", "al", "en", "a",
    "tipo", "mate",
}

# A substitute may never differ in these: fat content, lactose, wholegrain, light, salt,
# organic, packing medium, rice type, flavor.
CRITICAL = {
    "entera", "descremada", "semidescremada", "deslactosada", "integral", "light", "zero",
    "organico", "organica", "aceite", "natural", "agua", "parboiled", "parboil", "blanco",
    "patna", "carolina", "yamani", "basmati", "vainilla", "frutilla", "durazno", "banana",
    "chocolate", "dulce", "griego", "bebible", "cremoso", "girasol", "soja", "oliva", "canola",
    "maiz", "mezcla", "colorado", "negro", "manteca", "salada", "compuesta", "tradicional",
    "barbacua", "suave", "molida", "cafe", "chia", "instantanea", "rapida", "trigo", "0000",
    "000", "leudante", "rubia", "impalpable", "lomito", "desmenuzado", "trozos", "rallado",
    "con-sal", "mascabo", "terrones", "stevia", "perros", "multisemilla", "multisemillas",
    "chocolatada", "saborizado", "virgen",
}
CRITICAL_BIGRAMS = {"sin sal", "sin tacc", "sin gluten", "sin azucar", "larga vida"}

REVIEW_JACCARD = 0.5
SUBSTITUTE_JACCARD = 0.5

# Different words for the same thing across chains.
SYNONYMS = {
    "uht": "ultra", "ultrapasteurizada": "ultra", "lomitos": "lomito", "tripac": "tripack",
    "lactosa": "deslactosada", "salada": "con-sal", "parboil": "parboiled", "organica": "organico",
}


def _brand(o: dict) -> str | None:
    b = norm_text(o.get("brand"))
    return None if b in ("", "otras marcas", "generico", "sin marca") else b


def _words(o: dict) -> list[str]:
    text = norm_text(o.get("product_name")).replace("con sal", "con-sal")
    return [SYNONYMS.get(w, w) for w in text.split()]


def name_tokens(o: dict) -> set[str]:
    brand_words = set((_brand(o) or "").split())
    return {t for t in _words(o)
            if t not in STOPWORDS and t not in brand_words and not t.replace("%", "").isdigit()
            and not any(c.isdigit() for c in t)}


def critical_tokens(o: dict) -> frozenset[str]:
    words = _words(o)
    found = {w for w in words if w in CRITICAL}
    found |= {f"{a} {b}" for a, b in zip(words, words[1:]) if f"{a} {b}" in CRITICAL_BIGRAMS}
    return frozenset(found)


def size_key(o: dict) -> tuple | None:
    if o.get("base_qty") is None:
        return None
    return (round(float(o["base_qty"]), 1), o["base_unit"])


def unit_price_of(o: dict) -> float | None:
    return o.get("price_per_kg") or o.get("price_per_l") or o.get("price_per_unit")


def _jaccard(a: set, b: set) -> float:
    return len(a & b) / len(a | b) if a | b else 1.0


def match(offers: list[dict]) -> tuple[list[dict], list[dict]]:
    """Returns (groups, review_rows).

    Each group: {group_id, basket_key, brand, size, tokens, members: {store_key: (level, offer)},
    substitutes: {store_key: (offer, reason)}}.
    """
    groups: list[dict] = []
    by_gtin: dict[str, dict] = {}
    pending: list[dict] = []

    # 1) exact_gtin, then exact_sku for GDU products without an EAN
    for o in offers:
        if o.get("gtin"):
            key, level = o["gtin"], "exact_gtin"
        elif o["store_key"] in GDU_STORES and o.get("store_sku"):
            key, level = f"gdu-sku:{o['store_sku']}", "exact_sku"
        else:
            pending.append(o)
            continue
        g = by_gtin.get(key)
        if g is None:
            by_gtin[key] = _new_group(groups, o, level)
        elif o["store_key"] not in g["members"]:
            g["members"][o["store_key"]] = (level, o)

    # 2) exact / review for offers without an EAN (Ta-Ta)
    review: list[dict] = []
    for o in pending:
        brand, size, toks = _brand(o), size_key(o), name_tokens(o)
        exact, partial = [], []
        if brand and size:
            for g in groups:
                if g["basket_key"] != o["basket_key"] or g["brand"] != brand or g["size"] != size:
                    continue
                if o["store_key"] in g["members"]:
                    continue
                if g["tokens"] == toks:
                    exact.append(g)
                elif _jaccard(g["tokens"], toks) >= REVIEW_JACCARD:
                    partial.append(g)
        if len(exact) == 1:
            exact[0]["members"][o["store_key"]] = ("exact", o)
            continue
        candidates = exact if len(exact) > 1 else partial
        for g in candidates:
            review.append({
                "reason": "fits several groups" if len(exact) > 1 else "same brand and size, partial name match",
                "group_id": g["group_id"], "group_name": g["name"],
                "store_key": o["store_key"], "product_name": o["product_name"], "price": o["price"],
                "jaccard": round(_jaccard(g["tokens"], toks), 2), "product_url": o["product_url"],
            })
        _new_group(groups, o, "exact")  # stays on its own until someone reviews it

    # 3) substitutes for stores without an exact match
    all_stores = sorted({o["store_key"] for o in offers}, key=STORE_ORDER.index)
    for g in groups:
        ref = next(iter(g["members"].values()))[1]
        ref_crit, ref_unit, ref_toks = critical_tokens(ref), ref.get("base_unit"), name_tokens(ref)
        for store in all_stores:
            if store in g["members"]:
                continue
            best = None
            for o in offers:
                if (o["store_key"] != store or o["basket_key"] != g["basket_key"]
                        or o.get("base_unit") != ref_unit or unit_price_of(o) is None
                        or critical_tokens(o) != ref_crit
                        or _jaccard(name_tokens(o), ref_toks) < SUBSTITUTE_JACCARD):
                    continue
                if best is None or unit_price_of(o) < unit_price_of(best):
                    best = o
            if best is not None:
                g["substitutes"][store] = (best, _substitute_reason(ref, best))
    return groups, review


def _new_group(groups: list[dict], o: dict, level: str) -> dict:
    g = {
        "group_id": len(groups) + 1, "basket_key": o["basket_key"], "name": o["product_name"],
        "brand": _brand(o), "size": size_key(o), "tokens": name_tokens(o),
        "members": {o["store_key"]: (level, o)}, "substitutes": {},
    }
    groups.append(g)
    return g


def _substitute_reason(ref: dict, sub: dict) -> str:
    parts = []
    if _brand(ref) != _brand(sub):
        parts.append(f"brand {sub.get('brand') or 'unknown'} instead of {ref.get('brand') or 'unknown'}")
    if size_key(ref) != size_key(sub):
        parts.append(f"size {sub.get('base_qty')} {sub.get('base_unit')} instead of {ref.get('base_qty')} {ref.get('base_unit')}")
    if not parts:
        parts.append("same brand and size, different name")
    return "; ".join(parts) + "; compared by unit price"


def cheapest(entries: dict[str, float]) -> tuple[list[str], float | None]:
    """Stores with the lowest value (ties included)."""
    if not entries:
        return [], None
    low = min(entries.values())
    return [s for s, v in entries.items() if abs(v - low) < 0.005], low


def comparison_rows(groups: list[dict], stores: list[str]) -> list[dict]:
    rows = []
    for g in groups:
        row = {
            "group_id": g["group_id"], "basket_key": g["basket_key"], "group_name": g["name"],
            "brand": g["brand"], "base_qty": g["size"][0] if g["size"] else None,
            "base_unit": g["size"][1] if g["size"] else None,
            "stores_exact": len(g["members"]),
        }
        exact_prices, sub_units = {}, {}
        for s in stores:
            if s in g["members"]:
                level, o = g["members"][s]
                exact_prices[s] = o["price"]
                row.update({f"{s}_level": level, f"{s}_price": o["price"], f"{s}_unit_price": unit_price_of(o),
                            f"{s}_name": o["product_name"], f"{s}_reason": None})
            elif s in g["substitutes"]:
                o, reason = g["substitutes"][s]
                sub_units[s] = unit_price_of(o)
                row.update({f"{s}_level": "substitute", f"{s}_price": o["price"], f"{s}_unit_price": unit_price_of(o),
                            f"{s}_name": o["product_name"], f"{s}_reason": reason})
            else:
                row.update({f"{s}_level": None, f"{s}_price": None, f"{s}_unit_price": None,
                            f"{s}_name": None, f"{s}_reason": None})
        ce, ce_price = cheapest(exact_prices)
        cs, cs_unit = cheapest(sub_units)
        row.update({
            "cheapest_exact": "|".join(ce) or None, "cheapest_exact_price": ce_price,
            "cheapest_substitute": "|".join(cs) or None, "cheapest_substitute_unit_price": cs_unit,
        })
        rows.append(row)
    return rows


def gdu_price_spread(groups: list[dict]) -> dict:
    """How often Devoto, Géant and Disco differ for the same EAN or SKU."""
    multi = differ = 0
    for g in groups:
        prices = [o["price"] for s, (lvl, o) in g["members"].items()
                  if lvl in ("exact_gtin", "exact_sku") and s in GDU_STORES]
        if len(prices) >= 2:
            multi += 1
            if max(prices) - min(prices) > 0.005:
                differ += 1
    return {"groups_in_2plus_gdu_stores": multi, "with_different_prices": differ,
            "share_different": round(differ / multi, 3) if multi else None}
