# Supermarket price scraping spike

## Context
[ADR 0003](../adr/0003-price-sources.md) makes supermarket websites the main price source, but nobody has proven yet that we can read them. A research handoff (`~/Downloads/files.zip`: `HANDOFF.md` plus a half-finished Python draft) already covers each chain:
- Devoto, Géant and Disco (same group, Blazor, JSON-LD with EAN) and Ta-Ta (VTEX GraphQL, internal codes, no EAN) are viable.
- Tienda Inglesa is behind a Cloudflare challenge.
- Cabacuá's terms forbid scraping and comparators.

This branch proves we can fetch products for the full 15-item test basket across the four viable chains and compare them. It does **not** build the production pipeline: a teammate is still defining the architecture.

Decisions made in chat:
- **Supabase is where prices will be stored, not where scraping runs.** Edge Functions have a 2 s CPU limit and a 150/400 s wall-clock limit, and they can't run a browser. A full run takes minutes, and parsing the GDU sitemap is CPU-heavy. Production scraping is probably a separate scheduled worker that writes to Supabase, but that is the teammate's call.
- **The spike stays in Python and completes the existing draft.** It is throwaway, and it doesn't fix the production language.
- **No Supabase ADR, schema or migrations here.** Output fields are snake_case with plain types, so they are easy to load into Postgres later. The field list goes into the research note as a proposal.
- **Scope: full basket (15 items)**, including cross-chain matching and a feasibility report.

Repo rules that change the draft:
- Everything in English: code, comments, output values and docs.
- No `.md` outside `docs/`. The handoff, the spike README and the feasibility report all move into `docs/notes/`.
- The plan is saved to `docs/plans/`.

## Steps
0. `git switch -c spike/supermarket-prices` from `main`. Save this plan as `docs/plans/2026-10-17-price-scraping-spike.md`.
1. **Research note**: `docs/notes/price-sources-research.md`. A condensed English version of the handoff:
   - findings per source (sections 2–3)
   - matching levels and non-negotiable rules (section 4)
   - provisional output fields for a future Supabase table
   - why scraping should run outside Edge Functions
   - The zip itself is not committed.
2. **Code** in `spikes/supermarket-prices/` (isolated, no `.md`). Python 3.13 with a local `.venv` and `requirements.txt` containing only `requests`. Tests use stdlib `unittest`.
   - `common.py`, `basket.py`, `scrape_gdu.py`: the draft, translated to English (docstrings, comments, messages, values such as `size_source`: `spec` / `name` and `price_context`). Logic unchanged.
   - `scrape_tata.py` (new): GET `https://www.tata.com.uy/api/graphql?operationName=ProductsQuery`.
     - variables as in the handoff, `salesChannel` 4, one page of 24 per basket `term`
     - keep only names that contain `name_must`
     - `gtin` stored as `store_code`, not as an EAN
     - no images
     - builds offers with the same fields as `build_offer` in GDU, reusing `parse_size`, `unit_price` and `PoliteSession` from `common.py`
   - `match.py` (new), from handoff section 4:
     - `exact_gtin`
     - `exact` (normalized brand, base size and type tokens)
     - `review`
     - `substitute`, with a **provisional** rule: brand and/or size may differ, critical tokens (whole/skim/lactose-free, integral, light, flavor, salt-free, organic, in oil/natural, parboiled/white…) must match, and products are compared by unit price only. Flagged as provisional because open question 1 is still unresolved.
     - Lowest price is computed separately for exact matches and for substitutes.
   - `run.py`: the orchestrator. CLI flags `--stores`, `--limit`, `--refresh-sitemap`.
     - Writes to `data/out/` (git-ignored, like `data/cache/`): `offers.json`/`.csv`, `comparison.csv`, `review.csv`.
     - Also writes `run_report.json`: counts per store, blocks, errors, the request log, the share of GDU prices that differ across the three chains, how often the JSON-LD price differs from the visible price, and timings (total time and sitemap parse time, useful for the worker decision).
   - `tests/`: `parse_size`, `valid_gtin`, matching, and the GDU page and Ta-Ta GraphQL parsers. They use small hand-written fixtures that mimic the structure, not copies of the sites' pages.
   - `.gitignore`: `.venv/`, `data/`, `__pycache__/`.
3. **Check the terms first.** Try once to fetch the GDU terms page. If they forbid automated extraction, stop and ask before the full run.
4. **Run**:
   - `python -m unittest`
   - a smoke run with `python run.py --limit 2` (a handful of requests per chain)
   - then the full basket in the background, about 245 requests and 4–5 min at 1 req/s
5. **Feasibility report**: `docs/notes/price-scraping-feasibility.md`.
   - what worked per chain, with counts, blocks and timings
   - match rates per level
   - how often Devoto, Géant and Disco prices differ
   - JSON-LD vs visible price: is the JSON-LD price the list price or the promo price?
   - a few example rows
   - implications for the production worker and Supabase
6. **Docs step**:
   - `docs/notes/open-decisions.md`: update the terms item with the status per chain (Ta-Ta terms checked, GDU result from step 3, Tienda Inglesa blocked, Cabacuá only through a license). Add: what counts as "most similar", legal check before the MVP, target refresh frequency, and where scraping runs and in what language (the teammate's call).
   - ADR 0008, "How we read supermarket sites": honest User-Agent, at most 1 req/s, no anti-bot evasion, no retries on blocks, no images, every price carries `extracted_at` and `price_context`. Add it to `docs/adr/README.md`.
   - `docs/development.md` → Commands: how to set up and run the spike, linking to the research note.
   - No change to `architecture.md`: the spike is not architecture.
7. Commit on the branch only after your OK. No push or PR unless you ask.

## Constraints
- No calls to `api.cabacua.com`.
- No evading Tienda Inglesa's Cloudflare challenge. Its block is already documented, so no new probe.
- No invented data: unknown fields stay `null`.
- At most 1 req/s, honest User-Agent.

## Verification
- `python -m unittest` passes.
- The smoke run prints at least one priced product per chain (Devoto, Géant, Disco, Ta-Ta), each with `product_url`, `price`, `extracted_at` and `price_context`.
- After the full run, `run_report.json` shows no blocks, and `comparison.csv` has `exact_gtin` matches across GDU and at least some `exact` matches with Ta-Ta.
- `find . -name "*.md" -not -path "./.git/*"` shows nothing new outside `docs/`. No Spanish in code, comments or docs other than scraped data and site field labels such as "Contenido".
