"""Disco, Devoto and Géant cart spike (same GDU Blazor platform).

Findings behind the design:
- Blazor Server drives the cart over a websocket, so plain HTTP can't add items: a browser
  opens each product page and clicks "Agregar".
- An anonymous "Agregar" opens a sign-in dialog ("Identificación"): these chains only keep
  carts for logged-in users, so the cart has to be filled inside the user's own session.
- Google sign-in refuses the test browser Playwright launches. So this script starts the
  user's real Google Chrome with its own profile (`data/chrome-profile/`, kept between runs)
  and Playwright attaches to it over the DevTools protocol. The human logs in there like in
  any Chrome, once per chain; later runs reuse the session and fill the cart unattended.

The script never types credentials, never opens the payment step and never places an
order. The three chains share product ids and paths, so the Disco URLs in products.json
work on the other two by swapping the host.

  python disco_cart.py [disco|devoto|geant]
"""
from __future__ import annotations

import json
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

HOSTS = {"disco": "www.disco.com.uy", "devoto": "www.devoto.com.uy", "geant": "www.geant.com.uy"}
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
CDP_PORT = 9222
PROFILE = Path(__file__).parent / "data" / "chrome-profile"
DELAY_S = 1.0
PREFS = json.loads((Path(__file__).parent / "preferences.json").read_text())


def cdp_up() -> bool:
    try:
        urllib.request.urlopen(f"http://127.0.0.1:{CDP_PORT}/json/version", timeout=1)
        return True
    except OSError:
        return False


def start_chrome(url: str) -> None:
    """Starts a real Chrome with our profile and the DevTools port, unless one is already up."""
    if cdp_up():
        # On macOS Chrome keeps running after its last window closes; Playwright needs one.
        targets = json.load(urllib.request.urlopen(f"http://127.0.0.1:{CDP_PORT}/json", timeout=2))
        if not any(t["type"] == "page" for t in targets):
            req = urllib.request.Request(f"http://127.0.0.1:{CDP_PORT}/json/new?{url}", method="PUT")
            urllib.request.urlopen(req, timeout=5)
        return
    PROFILE.mkdir(parents=True, exist_ok=True)
    subprocess.Popen([CHROME, f"--remote-debugging-port={CDP_PORT}", f"--user-data-dir={PROFILE}",
                      "--no-first-run", "--no-default-browser-check", url],
                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(30):
        time.sleep(0.5)
        if cdp_up():
            return
    sys.exit("Chrome didn't open its DevTools port.")


def sign_in_dialog(page: Page) -> bool:
    dialog = page.locator(".rz-dialog-wrapper")
    return dialog.count() > 0 and "Identificaci" in dialog.first.inner_text()


def wait_for_login(page: Page, timeout_s: int = 300) -> None:
    """A logged-in header shows "Mi Cuenta" instead of "Iniciar sesión"."""
    deadline = time.monotonic() + timeout_s
    while time.monotonic() < deadline:
        if any("Mi Cuenta" in (pg.locator("header").first.inner_text() if pg.locator("header").count() else "")
               for pg in page.context.pages if pg.url.split("/")[2:3] == page.url.split("/")[2:3]):
            return
        time.sleep(2)
    sys.exit("No login after 5 minutes.")


def wait_for_dialogs(page: Page, timeout_s: int = 300) -> None:
    """Other dialogs (delivery method, address, branch) are the user's choice: wait until they close."""
    dialog = page.locator(".rz-dialog-wrapper")
    deadline = time.monotonic() + timeout_s
    while dialog.count() and time.monotonic() < deadline:
        time.sleep(2)
    if dialog.count():
        sys.exit("A dialog stayed open for 5 minutes.")


def answer_setup(page: Page, prefs: dict) -> None:
    """Answers the delivery questions from preferences.json, step by step, until the dialog closes.

    Flow mapped on Disco: mode (normal / ya) → delivery (home / pickup) → for pickup a zone and
    then a branch from a dropdown; for home, one of the addresses saved in the account. Anything
    unexpected is left to the human in the Chrome window.
    """
    for _ in range(8):
        dialog = page.locator(".rz-dialog-wrapper").last
        if not page.locator(".rz-dialog-wrapper").count():
            return
        if dialog.locator("a.modo-normal").count():
            step, target = "mode", dialog.locator("a.modo-normal" if prefs["mode"] == "normal" else "a.modo-ya")
        elif dialog.locator("a.modo-domicilio").count():
            step, target = "delivery", dialog.locator("a.modo-retiro" if prefs["delivery"] == "pickup" else "a.modo-domicilio")
        elif dialog.locator(".rz-dropdown").count():
            dialog.locator(".rz-dropdown").first.click()
            time.sleep(DELAY_S)
            step, target = "branch", page.locator("li[role=option]").filter(has_text=prefs["pickup_branch"])
        elif dialog.locator(".zonas-options-list button").count():
            step, target = "zone", dialog.locator(".zonas-options-list button").filter(has_text=prefs["pickup_zone"])
        elif dialog.get_by_text("Agregar nueva dirección").count():
            # Saved addresses are the text blocks that end in ", Uruguay"; never Editar/Eliminar.
            step, target = "address", dialog.get_by_text(", Uruguay").nth(prefs["home_address_index"])
        else:
            step, target = "unknown", None
        if target is None or not target.count():
            first_line = dialog.inner_text().strip().split("\n")[0]
            print(f"  no preset for \"{first_line}\" ({step}): choose in the Chrome window; the script goes on by itself.")
            wait_for_dialogs(page)
            return
        print(f"  {step}: {target.first.inner_text().strip()[:60]}")
        # On Devoto an empty <label> covers each saved address; force clicks through to it.
        target.first.click(force=step == "address")
        time.sleep(2 * DELAY_S)
    wait_for_dialogs(page)


def add_item(page: Page, item: dict, host: str) -> None:
    page.goto(item["product_url"].replace(HOSTS["disco"], host), wait_until="networkidle", timeout=60000)
    widget = page.locator(".widget-add-to-cart").first
    if "No Disponible" in widget.inner_text():
        print(f"  SKIPPED (not available for this delivery setting): {item['name']}")
        return
    # Clicking "Agregar" may open one dialog after another (login, delivery method, address).
    # Answers come from preferences.json; once given, the site remembers them.
    for _ in range(5):
        if "un." in widget.inner_text():  # the -/qty/+ stepper is showing: the item is in the cart
            break
        if "Agregar" in widget.inner_text() and widget.locator("button.atc-button").is_enabled():
            widget.locator("button.atc-button").click()
        time.sleep(2 * DELAY_S)
        if sign_in_dialog(page):
            print(f"\n{host} asks you to log in. Log in in the Chrome window; the script goes on by itself.")
            wait_for_login(page)
            return add_item(page, item, host)
        if page.locator(".rz-dialog-wrapper").count():
            print(f"{host} asks for delivery details; answering from preferences.json:")
            answer_setup(page, PREFS)
            time.sleep(DELAY_S)
    else:
        sys.exit(f"Couldn't add {item['name']}.")
    # The stepper reads "remove <n> un. add" (n may be "1,00"): "add" raises the quantity by one.
    while float(widget.inner_text().split("un.")[0].split()[-1].replace(",", ".")) < item["quantity"]:
        widget.locator("button").filter(has_text="add").click()
        time.sleep(2 * DELAY_S)
    print(f"  added {item['quantity']} x {item['name']}")


def main() -> int:
    store = sys.argv[1] if len(sys.argv) > 1 else "disco"
    host = HOSTS[store]
    items = json.loads(Path(__file__).with_name("products.json").read_text())["disco"]
    start_chrome(f"https://{host}")
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp(f"http://127.0.0.1:{CDP_PORT}")
        page = browser.contexts[0].new_page()
        print(f"Filling the {store} cart:")
        for item in items:
            add_item(page, item, host)
        page.goto(f"https://{host}/cart", wait_until="networkidle", timeout=60000)
        print("\nDone. The cart is open in Chrome: check it, go to payment and stop before paying.")
        # Chrome stays open for the human; leaving this block only drops our DevTools connection.
    return 0


if __name__ == "__main__":
    sys.exit(main())
