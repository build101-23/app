# Cart handoff spike

## Context
Ordering comes right after the first version ([roadmap](../notes/roadmap.md), "Ordering"). Before planning it, we want to know whether an agent can fill a supermarket cart with the products our app suggests, so the user only has to log in and pay. Checkout and payment stay with the user: the agent never logs in or pays.

This spike proves or disproves that for 4 products on Ta-Ta (VTEX) and Disco. Disco stands in for Devoto and Géant, which run on the same platform (GDU, Blazor Server). It is throwaway: the code doesn't need to be robust or production-shaped.

Decisions made in chat (grill-me):
- **Handoff by link.** The agent builds the cart from our side and gives the user a link that opens that cart in their own browser.
- **Mechanism.** Ta-Ta uses plain HTTP against the same cart API the site uses (VTEX `orderForm`). Disco uses a headless browser (Playwright), because Blazor drives the cart over a websocket.
- **Products.** A fixed list of 4 products picked by hand, with store ids per chain. Matching is out of scope; the price-scraping spike already covered it.
- **Success** for a chain: the link, opened in a *different* browser (e.g. a phone), shows the 4 items. A human then logs in and reaches the payment step with the items intact, and stops without paying.
- **Hackathon pace.** No more questions. Ta-Ta first, since it's the likely quick win, then Disco. Keep the code minimal, with no tests.
- **Disco fallback.** Investigate for at most ~30 min. If no cart id can travel in a link, fall back to a visible browser: the script fills the cart in a window, and the human logs in and reaches payment in that same window.
- **robots.txt.** Disco disallows `/cart` and `/checkout`; Ta-Ta disallows `/checkout/*`. We no longer treat robots.txt as a hard rule: drop "Respect `robots.txt`" from ADR 0005 and keep the rest of that ADR.
- **Branch.** `spike/cart-handoff` starts from `main` in a separate git worktree, so the uncommitted scraping work on `spike/supermarket-prices` stays apart.

## Steps
0. **ADR 0005 edit** (on `spike/supermarket-prices`, in the current checkout, left uncommitted like the rest of that branch): remove the "Respect `robots.txt`" part from the first rule in `docs/adr/0005-how-we-read-supermarket-sites.md`, and drop the robots.txt mention in its Context if it reads as a rule. Nothing else changes.
1. **Worktree**: `git worktree add ../app-cart-handoff -b spike/cart-handoff main`. Save this plan as `docs/plans/2026-10-17-cart-handoff-spike.md` there.
2. **Code** in `spikes/cart-handoff/` (no `.md`, English only). Python 3.13, local `.venv`, `requirements.txt` with `requests` and `playwright`, plus a `.gitignore` for `.venv/`, `__pycache__/` and `data/`.
   - `products.json`: 4 items (whole milk 1 L, rice 1 kg, oats, yerba 1 kg) with a quantity each, and per chain the `sku`, `seller` (Ta-Ta) and `product_url`. Pick them by hand once on each site.
   - `tata_cart.py`:
     1. Create an empty cart: `POST https://www.tata.com.uy/api/checkout/pub/orderForm?sc=4` → `orderFormId`.
     2. Add the items: `POST /api/checkout/pub/orderForm/{id}/items?sc=4` with `{"orderItems": [{"id": sku, "quantity": q, "seller": "1"}]}`.
     3. Read the cart back and print each item's name, quantity and price, plus anything the cart dropped or changed.
     4. Print the handoff link. Try `https://www.tata.com.uy/checkout/?orderFormId={id}#/cart` first. If FastStore uses another URL or domain, find it in the browser's network tab and write down which one works.
     - Honest User-Agent naming us, 1 req/s, no retries on 4xx.
   - `disco_cart.py`, in two phases:
     1. *Investigate (timebox ~30 min):* run Playwright in a visible window with network logging. Open one product page, click "Add", open the cart. Write down where the cart lives (cookie, local storage, server session over SignalR), whether a cart id ever shows up in a URL, and whether there's a "share cart" feature.
     2. *Build:* if a cart id can travel in a link, do what Ta-Ta does: headless fill, read back, print the link. Otherwise, `--headed` mode: a persistent visible browser opens each product URL, sets the quantity, clicks "Add" and opens the cart, then waits (`input()`) while the human logs in and goes to payment in that window.
   - The scripts never type credentials, never open login or payment pages, and never place an order.
3. **Human test**, one chain at a time. The human uses their own account.
   - Run the script.
   - Open the link on a phone or another browser and check the 4 items and quantities.
   - Log in and go as far as the payment step, then stop.
   - Write down: whether the cart survived login (kept, merged with an old cart, or replaced), whether prices or availability changed after setting a delivery address or branch, and any errors.
   - Empty the cart afterwards.
4. **Results note**: `docs/notes/cart-handoff-feasibility.md`. Per chain:
   - the mechanism and the handoff link format
   - pass or fail against the success bar, and what login did to the cart
   - request count, blocks and timings
   - terms and robots.txt caveats
   - what it means for ordering: link handoff, an agent running in the user's browser, or a deal with the chain
5. **Docs step**:
   - `docs/notes/open-decisions.md`: add "How ordering fills the cart: link handoff, agent in the user's browser, or a deal with the chain", linking to the results note. Also add "Legal read of the chains' terms for cart automation".
   - `docs/development.md` → Commands: how to set up (`playwright install chromium`) and run the two scripts.
   - No ADR. The spike's result feeds a later ordering decision. This also avoids an ADR number clash with 0005 on the other branch.
6. Commit on `spike/cart-handoff` only after your OK. No push or PR unless you ask.

## Constraints
- The agent fills the cart only. It never logs in, never stores credentials and never pays.
- A few dozen requests in total, 1 req/s, honest User-Agent, no anti-bot evasion.
- Tienda Inglesa and Cabacuá stay out.

## Verification
- `tata_cart.py` prints 4 items in the read-back cart and a link.
- The link opened on another device shows the same 4 items, and after login the human reaches the payment step with them.
- For Disco, either the same holds through a link, or the `--headed` fallback reaches the payment step in its window, and the note records why a link wasn't possible.
- `find . -name "*.md" -not -path "./.git/*"` shows nothing new outside `docs/`.
