"""The row that `upsert_store_products` takes (supabase/migrations/*_price_catalog.sql), and the data
rules every source follows."""
from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

ROW_FIELDS = (
    "store_key", "store_sku", "store_code", "gtin", "name", "brand", "category", "url_path",
    "size_text", "size_source", "size_qty", "size_unit", "pack_count", "base_qty", "base_unit",
    "price", "previous_price", "currency", "promo_labels", "availability", "read_from", "notes",
    "run_id", "checked_at",
)
MIN_PLAUSIBLE_PRICE = 1.0  # sites publish 0 or 1 as a placeholder when there is no real price
TZ = ZoneInfo("America/Montevideo")


def now_iso() -> str:
    return datetime.now(TZ).isoformat(timespec="seconds")


def make_row(**fields) -> dict:
    """A row with every field. Fields the source doesn't give stay None: we never invent data."""
    unknown = set(fields) - set(ROW_FIELDS)
    if unknown:
        raise ValueError(f"unknown row fields: {sorted(unknown)}")
    row = dict.fromkeys(ROW_FIELDS)
    row.update(fields)
    return drop_placeholder_price(row)


def add_note(row: dict, note: str) -> None:
    row["notes"] = "; ".join(x for x in (row.get("notes"), note) if x)


def drop_placeholder_price(row: dict) -> dict:
    """Clears a placeholder price ($1 or less) so it's never shown; the raw value goes to notes."""
    if row.get("price") is not None and row["price"] <= MIN_PLAUSIBLE_PRICE:
        add_note(row, f"placeholder price {row['price']:g} in source")
        row["price"] = None
        row["previous_price"] = None
    return row


def previous_if_higher(previous: float | None, price: float | None) -> float | None:
    """A "before" price only counts when it's higher than the current one."""
    return previous if previous is not None and price is not None and previous > price else None


def to_float(value) -> float | None:
    try:
        return float(value) if value is not None else None
    except (TypeError, ValueError):
        return None
