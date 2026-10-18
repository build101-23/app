# 0012. Fill supermarket carts from the user's computer

- Status: Accepted (partly changed by [0030](0030-cart-filling-tata-link-gdu-team-extension.md): the extension is team-only until the legal read; Devoto, delivery answers, weekly run, zone check and substitutes)
- Date: 2026-10-17

## Context
The goal is that the user builds the shopping list in our web app, picks where it's cheapest, and the app fills that supermarket's cart. The user only checks the cart and pays. The [cart handoff spike](../notes/cart-handoff-feasibility.md) showed:
- **Ta-Ta (VTEX)** fills a cart with an add-to-cart link. It needs no account and no install, and it works in the user's own browser, logged in or not.
- **Disco, Devoto and Géant (GDU)** only keep carts for logged-in users, and a web page can't act on another site. An agent clicking "Agregar" inside the user's logged-in browser works on all three. Each chain needs one login and three delivery answers, which the site then remembers.
- **Availability depends on the user's delivery zone**, which on GDU only a logged-in session can see. Scraped prices only cover each chain's default branch.

Options considered for GDU:
- our servers holding each user's session
- a Chrome extension on the user's computer
- a phone app with a built-in browser (Capacitor)
- a deal with each chain

## Decision
- Cart filling runs on the user's computer, in the user's own browser and session. Our servers never hold supermarket sessions or passwords.
- Ta-Ta: the web app opens the add-to-cart link.
- Disco, Devoto and Géant: a Chrome extension we build. It receives the list from the web app, answers the delivery questions from the user's saved preferences, checks availability and clicks "Agregar". The logic comes from `spikes/cart-handoff/disco_cart.py`.
- The user can schedule it weekly. Before each week, the extension checks every product for the user's zone. If one isn't available, the user gets a warning with a proposed substitute (following the [matching rules](../notes/price-sources-research.md#matching-across-chains)) and decides before the cart is filled.

## Consequences
- Desktop only. Phones need the Capacitor app from [ADR 0002](0002-pwa-now-capacitor-later.md), with the same logic inside a built-in browser.
- Ta-Ta can ship as soon as the list has prices. GDU waits for the extension.
- The extension breaks whenever a GDU site changes its buttons or dialogs, so it needs upkeep like the price scraper.
- Each user logs in once per chain, inside their own Chrome.
- Both the chains' terms and `robots.txt` ask bots to stay out of cart and checkout. The legal read stays [open](../notes/open-decisions.md).
