"""Ta-Ta cart handoff spike.

Fills an anonymous VTEX cart (orderForm) with the items in products.json through the same
public checkout API the site uses, reads it back, and prints a link that opens that cart in
any browser. The user logs in and pays there. This script never logs in, never opens the
payment step and never places an order.
"""
from __future__ import annotations

import json
import sys
import time
import webbrowser
from pathlib import Path

import requests

# The storefront (www) is FastStore and has no cart API; VTEX checkout lives on `secure`.
BASE = "https://secure.tata.com.uy"
SALES_CHANNEL = "4"
USER_AGENT = "cart-handoff-spike/0.1 (feasibility proof of concept; low volume)"
DELAY_S = 1.0

_last = 0.0


def call(s: requests.Session, method: str, path: str, **kw) -> dict:
    """One request at most every DELAY_S seconds. No retries: a 4xx stops the run."""
    global _last
    wait = DELAY_S - (time.monotonic() - _last)
    if wait > 0:
        time.sleep(wait)
    _last = time.monotonic()
    r = s.request(method, BASE + path, params={"sc": SALES_CHANNEL}, timeout=20, **kw)
    print(f"{method} {path} -> {r.status_code}")
    r.raise_for_status()
    return r.json()


def main() -> int:
    items = json.loads(Path(__file__).with_name("products.json").read_text())["tata"]
    s = requests.Session()
    s.headers.update({"User-Agent": USER_AGENT, "Accept": "application/json", "Content-Type": "application/json"})

    form = call(s, "POST", "/api/checkout/pub/orderForm", json={"expectedOrderFormSections": ["items"]})
    form_id = form["orderFormId"]

    order_items = [{"id": i["sku"], "quantity": i["quantity"], "seller": i["seller"]} for i in items]
    form = call(s, "POST", f"/api/checkout/pub/orderForm/{form_id}/items", json={"orderItems": order_items})

    print(f"\norderFormId: {form_id}")
    in_cart = {it["id"]: it for it in form.get("items", [])}
    for i in items:
        it = in_cart.get(i["sku"])
        if it is None:
            print(f"  MISSING  {i['name']} (sku {i['sku']})")
            continue
        flag = "" if it["quantity"] == i["quantity"] else f"  (asked {i['quantity']})"
        print(f"  {it['quantity']} x {it['name']}  UYU {it['sellingPrice'] / 100:.2f}{flag}  [{it.get('availability')}]")
    for m in form.get("messages", []):
        print(f"  message: {m.get('text')}")
    print(f"  total: UYU {form.get('value', 0) / 100:.2f}")

    print("\nOpen this link in any browser, log in, and stop at the payment step:")
    link = f"{BASE}/checkout/?orderFormId={form_id}#/cart"
    print(f"  {link}")
    # Second handoff: a VTEX add-to-cart link. It adds the items to the cart of whichever
    # browser opens it, so a user already logged in gets them in their own account's cart.
    add = "&".join(f"sku={i['sku']}&qty={i['quantity']}&seller={i['seller']}" for i in items)
    print("\nOr, in a browser where the user is already logged in, this adds the items to their cart:")
    print(f"  {BASE}/checkout/cart/add?{add}&sc={SALES_CHANNEL}")
    webbrowser.open(link)
    return 0


if __name__ == "__main__":
    sys.exit(main())
