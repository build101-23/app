# Open decisions

Once a decision is made, record it where it belongs (an ADR in [adr/](../adr/), or [product.md](../product.md)) and remove it from here.

- [ ] Can we read the supermarkets' websites? Status after the [spike](price-scraping-feasibility.md), following [ADR 0008](../adr/0008-how-we-read-supermarket-sites.md):
  - Devoto, Géant, Disco: shared terms have no clause on automated reading, but say the site "may only be used" to offer and buy products. Needs a legal read. Devoto blocked the scraper once, on 2026-10-17 ([research](price-sources-research.md#devoto-géant-and-disco-grupo-disco-uruguay)).
  - Ta-Ta: terms forbid reproducing design, images and code; nothing on automated reading.
  - Tienda Inglesa: blocked by an anti-bot challenge. Only through a deal or feed.
  - Cabacuá: terms forbid scraping and comparators, so the [ADR 0003](../adr/0003-price-sources.md) fallback means a paid data license.
  - Do we ask a lawyer, or contact the chains, before real prices reach users?
- [ ] Where the price scraper runs on a schedule. For now it's a Python job run by hand ([ADR 0015](../adr/0015-price-scraper-python-job-with-time-budget.md)). Options: GitHub Actions on the Tenki runners planned for CI, or a machine of ours. Trade-offs in [price-sources-research.md](price-sources-research.md#where-scraping-should-run).
- [ ] What counts as "most similar" when a store doesn't have the exact product: another brand, another size, or both? The spike uses a [provisional rule](price-sources-research.md#matching-across-chains).
- [ ] How often prices are refreshed for the pilot: daily or weekly. A run takes 25 minutes at most ([ADR 0015](../adr/0015-price-scraper-python-job-with-time-budget.md)), so daily is possible.
- [ ] Legal read of the chains' terms and `robots.txt` (both ask bots to stay out of cart and checkout) before cart automation reaches users.
- [ ] Safe limits for plans the AI builds from scratch: minimum calories, maximum deficit, minimum protein. Have a nutritionist review them.
- [ ] Sending health data to an AI provider abroad: check what Law 18.331 requires for international transfers, and say it in the consent.
- [ ] Which list edits count toward "under 20% of items edited" ([product.md](../product.md#what-we-want-to-learn)). Crossing something out often means it's in the pantry, not that the list was wrong, so milestone 6's events should record the kind of edit (crossed out or −) and where it came from (list or chat).
- [ ] Which event marks a plan as accepted for "How many shop from their first plan with 2 menu changes or fewer" ([product.md](../product.md#what-we-want-to-learn)), now that there's no confirm step ([ADR 0022](../adr/0022-list-follows-the-menu.md)). Candidates: sharing or copying the list, or asking the chat for it.
- [ ] Real prices before the pilot? On example prices, "Do they actually save?" and "Do they accept a split?" ([product.md](../product.md#what-we-want-to-learn)) measure nothing ([ADR 0019](../adr/0019-example-prices-until-matched.md)).
