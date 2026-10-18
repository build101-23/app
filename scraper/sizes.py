"""Text normalization, EAN checks and package sizes. Taken from the price spike, where it was tested."""
from __future__ import annotations

import re
import unicodedata

# ---------------------------------------------------------------- text normalization


def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c))


def norm_text(s: str | None) -> str:
    s = strip_accents((s or "").lower())
    s = re.sub(r"[^a-z0-9%]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


_CP1252 = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ"  # bytes 0x80-0x9f as Windows-1252 shows them
# A UTF-8 lead byte (Â, Ã, â) and its continuation bytes, as Latin-1 or Windows-1252 shows them.
_MOJIBAKE_RE = re.compile(f"[ÂÃâ][\x80-\xbf{_CP1252}]+")


def _as_byte(c: str) -> int:
    return ord(c) if ord(c) < 256 else c.encode("cp1252")[0]


def _repair(m: re.Match) -> str:
    try:
        return bytes(_as_byte(c) for c in m.group()).decode("utf-8")
    except UnicodeDecodeError:
        return m.group()


def fix_mojibake(s: str | None) -> str | None:
    """UTF-8 text that was decoded as Latin-1 or Windows-1252 somewhere upstream: "VacÃ­o" -> "Vacío".
    Each broken run is repaired on its own, so a name that also has correct accents is repaired too, and
    twice-broken text gets a second pass. Text that isn't broken stays as it is."""
    for _ in range(3):
        if not s:
            return s
        fixed = _MOJIBAKE_RE.sub(_repair, s)
        if fixed == s:
            return s
        s = fixed
    return s


# ---------------------------------------------------------------- EAN / GTIN


def valid_gtin(code: str | None) -> bool:
    """Checks the GS1 check digit (EAN-8/UPC-12/EAN-13/GTIN-14)."""
    if not code or not code.isdigit() or len(code) not in (8, 12, 13, 14):
        return False
    digits = [int(c) for c in code]
    check = digits.pop()
    total = sum(d * (3 if i % 2 == 0 else 1) for i, d in enumerate(reversed(digits)))
    return (10 - total % 10) % 10 == check


def gtin13(code: str | None) -> str | None:
    """Normalizes a valid GTIN to 13 digits (drops leading zeros from GTIN-14)."""
    if not valid_gtin(code):
        return None
    return code.lstrip("0").zfill(13) if len(code) == 14 else code.zfill(13)


# ---------------------------------------------------------------- package sizes

_UNIT_MAP = {
    "g": ("g", 1), "gr": ("g", 1), "grs": ("g", 1), "gramos": ("g", 1),
    "kg": ("g", 1000), "kgs": ("g", 1000), "kilo": ("g", 1000), "k": ("g", 1000),
    "ml": ("ml", 1), "cc": ("ml", 1), "cm3": ("ml", 1),
    "l": ("ml", 1000), "lt": ("ml", 1000), "lts": ("ml", 1000), "litro": ("ml", 1000), "litros": ("ml", 1000),
    "un": ("un", 1), "u": ("un", 1), "unid": ("un", 1), "unidades": ("un", 1), "unidad": ("un", 1),
}
_NUM = r"(\d+(?:[.,]\d+)?)"
_UNIT = r"(kgs?|kilo|k|grs?|gramos|g|ml|cc|cm3|lts?|litros?|l|unidades|unidad|unid|un|u)"
_SIZE_RE = re.compile(rf"(?<![\w.,]){_NUM}\s*{_UNIT}(?![a-z])", re.I)
_PACK_RE = re.compile(rf"(\d+)\s*x\s*{_NUM}\s*{_UNIT}(?![a-z])", re.I)          # 3x80 g
_PACK_SUFFIX_RE = re.compile(r"\bx\s*(\d+)\s*(?:un|u|unid|unidades)\b", re.I)    # 1 L x 12 un
_PACK_PREFIX_RE = re.compile(rf"\b(\d+)\s*(?:un|u|unid|unidades)\s*(?:x\s*)?{_NUM}\s*{_UNIT}(?![a-z])", re.I)  # 4 U 100 ml

EMPTY_SIZE = {"size_qty": None, "size_unit": None, "pack_count": None, "base_qty": None, "base_unit": None}


def _num(s: str) -> float:
    return float(s.replace(",", "."))


def parse_size(text: str | None) -> dict | None:
    """Extracts the package size from a text. Returns None if there is no unambiguous reading.

    Result: {size_qty, size_unit, pack_count, base_qty, base_unit} with base_unit in g, ml or un,
    where base_qty is the TOTAL content of the package (pack included).
    """
    if not text:
        return None
    t = strip_accents(text.lower()).replace("\xa0", " ")

    m = _PACK_RE.search(t) or _PACK_PREFIX_RE.search(t)
    if m:
        count, qty, unit = int(m.group(1)), _num(m.group(2)), m.group(3)
        base_unit, factor = _UNIT_MAP[unit]
        return _size(qty, unit, count, base_unit, qty * factor * count)

    found = [(m, _UNIT_MAP[m.group(2).lower()]) for m in _SIZE_RE.finditer(t)]
    measures = [(m, u) for m, u in found if u[0] != "un"]
    if len({(u[0], _num(m.group(1)) * u[1]) for m, u in measures}) > 1:
        return None  # two different measures in the name: ambiguous, don't guess
    if measures:
        m, (base_unit, factor) = measures[0]
        qty = _num(m.group(1))
        pack = _PACK_SUFFIX_RE.search(t)
        count = int(pack.group(1)) if pack else 1
        return _size(qty, m.group(2), count, base_unit, qty * factor * count)
    units = [m for m, u in found if u[0] == "un"]
    if len(units) == 1:
        qty = _num(units[0].group(1))
        return _size(qty, "un", 1, "un", qty)
    if not found and re.search(r"\b(x|por)\s*(kg|kilo)\b", t):  # "Limon Malla x kg": the price is per kg
        return _size(1.0, "kg", 1, "g", 1000.0)
    m = re.search(r"\bx\s*(\d+)\b", t)  # "Huevos x 12"
    if m and len(units) == 0:
        return _size(float(m.group(1)), "un", 1, "un", float(m.group(1)))
    return None


_VTEX_UNITS = {"kg": ("g", 1000), "g": ("g", 1), "l": ("ml", 1000), "lt": ("ml", 1000), "ml": ("ml", 1)}


def size_from_unit(measurement_unit: str | None, multiplier: float | None) -> dict | None:
    """Size of a product sold by weight or volume, from VTEX's measurementUnit and unitMultiplier.

    One unit of the SKU, what goes in the cart, is `multiplier` × `measurement_unit`. Its price is for
    that amount, except in kg over 1 kg: then the price is per kg (Ta-Ta's 1.4 kg pork loin at $199).
    Units ("un") say nothing about the content, so they give no size.
    """
    unit = (measurement_unit or "").strip().lower()
    if unit not in _VTEX_UNITS or not multiplier or multiplier <= 0:
        return None
    if unit == "kg" and multiplier > 1:
        return priced_per_kg(multiplier * 1000)
    base_unit, factor = _VTEX_UNITS[unit]
    return _size(float(multiplier), unit, 1, base_unit, multiplier * factor)


def priced_per_kg(sale_g: float) -> dict:
    """Size of an item whose price is per kg, and whose unit of sale (what goes in the cart) weighs
    `sale_g` grams: base 1000 g, unit of sale in kg from 1 kg up, else in g."""
    qty, unit = (round(sale_g / 1000, 3), "kg") if sale_g >= 1000 else (round(sale_g, 3), "g")
    return _size(qty, unit, 1, "g", 1000.0)


def _size(qty, unit, pack_count, base_unit, base_qty) -> dict:
    return {
        "size_qty": qty, "size_unit": unit.lower(), "pack_count": pack_count,
        "base_qty": round(base_qty, 3), "base_unit": base_unit,
    }


def size_fields(size: dict | None, source: str | None, text: str | None = None) -> dict:
    """The size columns of a row. Without a size, all of them stay empty."""
    if not size:
        return {"size_text": None, "size_source": None, **EMPTY_SIZE}
    return {"size_text": text, "size_source": source, **size}
