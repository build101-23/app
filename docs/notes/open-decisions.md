# Open decisions

Once a decision is made, record it where it belongs (an ADR in [adr/](../adr/), or [product.md](../product.md)) and remove it from here.

- [ ] Can we read the supermarkets' websites? Status after the [spike](price-scraping-feasibility.md), following [ADR 0008](../adr/0008-how-we-read-supermarket-sites.md):
  - Devoto, Géant, Disco: shared terms have no clause on automated reading, but say the site "may only be used" to offer and buy products. Needs a legal read.
  - Ta-Ta: terms forbid reproducing design, images and code; nothing on automated reading.
  - Tienda Inglesa: blocked by an anti-bot challenge. Only through a deal or feed.
  - Cabacuá: terms forbid scraping and comparators, so the [ADR 0003](../adr/0003-price-sources.md) fallback means a paid data license.
  - Do we ask a lawyer, or contact the chains, before real prices reach users?
- [ ] Where the price scraper runs, and in what language: Supabase Edge Functions or a Cloudflare Worker in batches, or a scheduled job outside both, which [ADR 0004](../adr/0004-vite-react-supabase-claude.md) ("no servers of our own") doesn't cover yet. Trade-offs in [price-sources-research.md](price-sources-research.md#where-scraping-should-run).
- [ ] What counts as "most similar" when a store doesn't have the exact product: another brand, another size, or both? The spike uses a [provisional rule](price-sources-research.md#matching-across-chains).
- [ ] How often prices are refreshed for the pilot: daily or weekly.
- [ ] Safe limits for plans the AI builds from scratch: minimum calories, maximum deficit, minimum protein. Have a nutritionist review them.
- [ ] Sending health data to an AI provider abroad: check what Law 18.331 requires for international transfers, and say it in the consent.
- [ ] App name.
