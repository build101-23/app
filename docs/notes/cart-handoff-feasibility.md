# Cart handoff feasibility

Results of the cart handoff spike ([plan](../plans/2026-10-17-cart-handoff-spike.md)), run on 2026-10-17. Question: can an agent fill a supermarket cart with the products the app suggests, so the user only logs in and pays? Code lives in `spikes/cart-handoff/`; how to run it is [below](#running-the-spike).

## Summary

| Chain | Agent can fill an anonymous cart | Handoff | Status |
| --- | --- | --- | --- |
| Ta-Ta | Yes, plain HTTP | Link to the cart, or an add-to-cart link that fills the user's own (logged-in) cart | Add-to-cart link verified with 23 real catalog products, food sold by weight included ([below](#the-add-to-cart-link-with-catalog-products)); logged-in use, login and payment not yet tested by a human |
| Disco, Devoto, Géant | No: adding requires login (checked on all three) | Agent drives the user's real Chrome, logged in once; later runs are unattended | Works on all three: 3 products added automatically to the logged-in cart, ending on "Proceder al pago" |

## Ta-Ta (VTEX)

- The storefront `www.tata.com.uy` is FastStore and has no cart API (`/api/checkout/pub/orderForm` answers 404). The VTEX checkout lives on `secure.tata.com.uy`.
- Two unauthenticated requests build the cart:
  1. `POST https://secure.tata.com.uy/api/checkout/pub/orderForm?sc=4` → `orderFormId`
  2. `POST .../orderForm/{orderFormId}/items?sc=4` with `{"orderItems": [{"id": "<sku>", "quantity": n, "seller": "1"}]}`
- The `sku` returned by the price spike's GraphQL search is the VTEX item id, and seller `1` worked for all 4 items.
- The response already holds the cart: names, quantities, prices (in cents) and availability. All 4 items went in (UYU 462, one item with a list-price discount applied).
- Handoff link: `https://secure.tata.com.uy/checkout/?orderFormId=<id>#/cart`. Opened in a separate browser with no shared cookies, it showed Ta-Ta's own "Mi carrito" page with the 4 items and the "Finalizar compra" button.
- Second handoff, for a user who is already logged in: the VTEX add-to-cart link `https://secure.tata.com.uy/checkout/cart/add?sku=<sku>&qty=<n>&seller=1&...&sc=4`. The browser that opens it gets a 302, a cart cookie and the items in its own cart; tested from a clean session, all 3 items went in. No agent, no API call from our side: the link alone fills the cart in the user's browser, in their account if they're logged in.
- **Not tested yet:** logging in from the anonymous cart page. VTEX may keep the cart, merge it with the account's saved cart, or replace it. Changing the delivery address may also change prices or availability.

### The add-to-cart link with catalog products

Run on 2026-10-18 for the [fill-cart plan](../plans/2026-10-18-fill-cart.md), step 2, in Claude's built-in browser (its own profile, not logged in to Ta-Ta), with skus taken from `store_products`. The cart was read back from `/api/checkout/pub/orderForm` after each link and emptied at the end.
- The browser still held the spike's 4-item orderForm cart (UYU 462): 2 × milk sachet, rice, oats and yerba. That's the 4-item run above; its input isn't in `products.json`, which has 3 Ta-Ta items.
- **An existing cart is kept, and each sku ends at the larger of what it had and what the link asks.**
  - Rice at 1, link `qty=2`: rice went to 2, not 3.
  - The same link opened again changed nothing.
  - Rice at 2, link `qty=1`: rice stayed at 2.
  - Items not in the link stayed, and new ones were added.
  - So a second tap never doubles anything, and the link never lowers or removes what the user had.
- **A sku repeated in one link** (`qty=1`, then `qty=2`) ended at 2, not 3. Whoever builds the link must add duplicates up first.
- **An unknown sku** (`99999999`) doesn't break the link. Ta-Ta's cart page shows "Ítem 99999999 no encontrado o no disponible", and the other items go in.
- **The catalog's `OutOfStock` isn't the checkout's.** TaTa Cola 2 L (`12028`), `OutOfStock` with no price in `store_products`, went in as available at UYU 95.
- **Food sold by weight works.** `qty=1` adds one unit of sale (VTEX `unitMultiplier`, `measurementUnit` kg), and the price matches `unitOfSale()` to the cent:
  - pork loin 1.4 kg (`13220`): UYU 278.60;
  - ground beef 400 g (`118945`): UYU 179.60, and `qty=2` gave 0.8 kg;
  - carrot 1 kg (`3796`): UYU 69;
  - tomato 500 g (`3812`): UYU 139.50.
- **23 products in one link** (about 650 characters), with quantities 1 to 3: all 23 went in with the exact quantities.
  - Cart total UYU 3,504.80, against UYU 3,518.80 from our prices (−0.4%).
  - 8 of the 23 unit prices had moved by UYU 1 to 11 since the scrape the day before (flour 56 → 45), so the total we show stays an estimate.
- **Still not tested:** opening the link while logged in to Ta-Ta, and logging in afterwards from the cart.

## Disco, Devoto, Géant (GDU, Blazor Server)

- The cart is driven over the Blazor websocket (`wss://www.disco.com.uy/_blazor`), not a REST API, so a real browser (Playwright) has to click "Agregar".
- The visitor's order is the `OrderId` cookie (a GUID). There is no cart id in any URL and no "share cart" feature.
- **An anonymous "Agregar" opens a sign-in dialog ("Identificación")**: email code, password, Google, Facebook or Apple. Checked on Disco, Devoto and Géant: the three only keep carts for logged-in users.
- The user couldn't log in inside the window Playwright controls (sign-in failed there on all three chains). So in practice the agent has to run inside the user's real browser, for example as an extension.
- So an anonymous cart can't be built and handed over by link. The agent has to work inside the user's own logged-in session.
- First try: Playwright's own test browser with a saved profile. The user couldn't log in there: Google sign-in refuses browsers that Playwright launches.
- What `disco_cart.py` does now: it starts the user's real Google Chrome with a dedicated profile (`data/chrome-profile/`) and the DevTools port, and Playwright attaches to it. The user logs in there like in any Chrome, once per chain. The agent opens each product, clicks "Agregar", and ends on the cart. If a chain asks for login mid-run, the script waits for the user and then continues. Later runs reuse the saved session and need no human until checkout.
- In a product this maps to an agent running on the user's device (a desktop helper or an extension), not on our servers.
- **Before the first add, a logged-in user must answer delivery questions.** Mapped on Disco:
  1. Mode: "Modo normal" or "Disco Ya" (order in under 60 minutes).
  2. Delivery: "Envío a domicilio" or "Retiro en sucursal".
  3. Home delivery: pick one of the addresses saved in the account (or add one). Pickup: a zone (Montevideo, Maldonado y Punta del Este, Costa de Oro, Canelones, Libertad), then a branch from a list (16 in Montevideo).
  - The site remembers the answers: after the first time, "Agregar" adds directly. The script answers them from `preferences.json` (the answers the user would give once in our app) and leaves anything unexpected to the human.
- **Availability depends on that delivery setting, and only a logged-in user can change it.** Anonymous visitors get the default branch (Disco Fresh Market Plaza Italia); clicking the branch in the header asks them to log in. The same milk showed "Agregar" anonymously and "No Disponible" for the test account's address. So a scraper can only see default-branch availability; per-user availability needs the user's session.
- **Availability, details.** With home delivery to the test account's address, 2 of the first picks showed "No Disponible" and had to be swapped. The script skips unavailable products. Our scraped prices come from the default branch for anonymous visitors, so the app's list can include products the user's zone doesn't have.
- **Result (2026-10-17, Disco, logged-in test account, home delivery):** the script added 2 × milk, rice and oats with no human action. The cart showed them with correct quantities: subtotal UYU 402, delivery UYU 250, total UYU 652, on the "Proceder al pago" step. Nobody paid.
- **Devoto and Géant (same day, same code):** each chain needs its own login; the account isn't shared across the three sites. After login, the script answered the three questions from `preferences.json` (normal mode, home delivery, first saved address) and added the same 3 products. Devoto: total UYU 652, the same as Disco. Géant: UYU 662, because the oats cost UYU 69 there instead of 59. A second Devoto run went straight to adding, which confirms the answers are remembered.
- On Devoto and Géant an empty `<label>` covers each saved address, so the script force-clicks it.
- **Not tested yet:** whether the sessions survive restarting Chrome, and the pickup path end to end (mapped, but every run used home delivery).

## Rules followed

- The agent never logs in, never types credentials and never opens the payment step.
- 1 request per second, an honest User-Agent (`cart-handoff-spike/0.1`), about a dozen requests per chain.
- `robots.txt` asks bots to stay out of `/checkout/*` (Ta-Ta) and `/cart`, `/checkout`, `/login` (Disco). This spike went there on purpose; whether that is acceptable for a product is [open](open-decisions.md).

## What it means for ordering

Decided in [ADR 0012](../adr/0012-fill-carts-from-the-users-computer.md): carts are filled on the user's computer, Ta-Ta by link and GDU by a Chrome extension.


- **From our web app alone:** Ta-Ta works (the button opens the add-to-cart link). Disco, Devoto and Géant don't: a web page can't act on another site. They need a component on the user's device that our web app's button can trigger: a browser extension (desktop) or the app packaged with Capacitor and a built-in browser (phone).
- **Availability before showing the list:** that same component has the user's session, so it can check each product for the user's zone and swap an unavailable one for an allowed substitute before the list is shown, and check again while filling the cart. Scraped availability only covers the default branch.

- **VTEX chains (Ta-Ta):** a server-side agent can build the cart and send the user a link. This fits "the app fills the cart, you pay" with no browser on the user's side. It's the cheapest path to test with pilot users.
- **GDU chains (Disco, Devoto, Géant):** proven feasible with an agent driving the user's own logged-in browser: one login per chain and three delivery answers, then unattended. A link from our server can't carry the cart. The options are an agent running in the user's browser (an extension, or a webview in the app where the user logs in), or a deal with the chain ([roadmap](roadmap.md), "Ordering").

## Running the spike

From `spikes/cart-handoff/`:

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt && .venv/bin/playwright install chromium
```

Ta-Ta: fills an anonymous cart with the items in `products.json` and prints a link to open it in any browser.

```bash
.venv/bin/python tata_cart.py
```

Disco, Devoto or Géant: opens your real Google Chrome with a dedicated profile; you log in there (only the first time per chain), the script adds the items, and you continue to payment in that window.

```bash
.venv/bin/python disco_cart.py disco
```
