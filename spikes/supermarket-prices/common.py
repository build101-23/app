"""Shared spike utilities: polite HTTP, size parsing and normalization.

Principles:
- Few requests, with a fixed pause between them.
- A User-Agent that names the experiment (no browser impersonation).
- Never retry on 401/403/429 or on anti-bot challenge pages: log it and stop.
"""
from __future__ import annotations

import re
import time
import unicodedata
from datetime import datetime
from zoneinfo import ZoneInfo

import requests

USER_AGENT = "supermarket-prices-spike/0.1 (feasibility proof of concept; low volume)"
TZ = ZoneInfo("America/Montevideo")
DEFAULT_DELAY_S = 1.0


class BlockedError(RuntimeError):
    """The source answered with a block or an anti-bot challenge. We don't try to get around it."""


class PoliteSession:
    """HTTP session with a minimum pause between requests and a log of every call."""

    def __init__(self, delay_s: float = DEFAULT_DELAY_S):
        self.s = requests.Session()
        self.s.headers.update({"User-Agent": USER_AGENT, "Accept-Language": "es-UY,es;q=0.9"})
        self.delay_s = delay_s
        self._last = 0.0
        self.log: list[dict] = []

    def get(self, url: str, **kw) -> requests.Response:
        wait = self.delay_s - (time.monotonic() - self._last)
        if wait > 0:
            time.sleep(wait)
        self._last = time.monotonic()
        r = self.s.get(url, timeout=30, **kw)
        self.log.append({"url": url, "status": r.status_code, "bytes": len(r.content), "at": now_iso()})
        if r.status_code in (401, 403, 429) or is_challenge_page(r.text):
            raise BlockedError(f"{r.status_code} on {url} (block or anti-bot challenge; not bypassed)")
        return r


def is_challenge_page(text: str) -> bool:
    head = text[:3000]
    return "challenges.cloudflare.com" in head and "Just a moment" in head


def now_iso() -> str:
    return datetime.now(TZ).isoformat(timespec="seconds")


# ---------------------------------------------------------------- text normalization

def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c))


def norm_text(s: str | None) -> str:
    s = strip_accents((s or "").lower())
    s = re.sub(r"[^a-z0-9%]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


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


def _num(s: str) -> float:
    return float(s.replace(",", "."))


def parse_size(text: str | None) -> dict | None:
    """Extracts the package size from a text. Returns None if there is no unambiguous reading.

    Result: {size_qty, size_unit, pack_count, base_qty, base_unit} with base_unit in g, ml or un,
    where base_qty is the TOTAL content of the package (pack included).
    """
    if not text:
        return None
    t = strip_accents(text.lower()).replace(" ", " ")

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
    m = re.search(r"\bx\s*(\d+)\b", t)  # "Huevos x 12"
    if m and len(units) == 0:
        return _size(float(m.group(1)), "un", 1, "un", float(m.group(1)))
    return None


def _size(qty, unit, pack_count, base_unit, base_qty) -> dict:
    return {
        "size_qty": qty, "size_unit": unit.lower(), "pack_count": pack_count,
        "base_qty": round(base_qty, 3), "base_unit": base_unit,
    }


MIN_PLAUSIBLE_PRICE = 1.0  # sites publish 0 or 1 as a placeholder when there is no real price


def drop_placeholder_price(offer: dict) -> dict:
    """Clears a placeholder price (0 or 1) so it is never shown; the raw value goes to notes."""
    if offer.get("price") is not None and offer["price"] <= MIN_PLAUSIBLE_PRICE:
        note = f"placeholder price {offer['price']} in source"
        offer["notes"] = "; ".join(x for x in (offer.get("notes"), note) if x)
        offer.update(price=None, price_per_kg=None, price_per_l=None, price_per_unit=None)
    return offer


EMPTY_SIZE = {"size_qty": None, "size_unit": None, "pack_count": None, "base_qty": None, "base_unit": None}


def unit_price(price: float | None, size: dict | None) -> dict:
    """Price per kg, per liter or per unit, only when the size is known."""
    out = {"price_per_kg": None, "price_per_l": None, "price_per_unit": None}
    if price is None or not size or not size.get("base_qty"):
        return out
    q, u = size["base_qty"], size["base_unit"]
    if u == "g":
        out["price_per_kg"] = round(price / q * 1000, 2)
    elif u == "ml":
        out["price_per_l"] = round(price / q * 1000, 2)
    elif u == "un":
        out["price_per_unit"] = round(price / q, 2)
    return out
