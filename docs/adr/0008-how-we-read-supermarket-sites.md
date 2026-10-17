# 0008. How we read supermarket sites

- Status: Accepted
- Date: 2026-10-17

## Context
[ADR 0003](0003-price-sources.md) makes supermarket websites the main price source. Reading them carelessly could overload them, break their terms, or put wrong prices in front of users. Research and a spike ([notes](../notes/price-sources-research.md)) showed that Devoto, Géant, Disco and Ta-Ta can be read with plain HTTP, while Tienda Inglesa blocks non-browser clients and Cabacuá forbids scraping.

## Decision
Any code that reads a supermarket site follows these rules:
- An honest User-Agent that names us. No browser impersonation.
- At most 1 request per second per site, and only public pages or the public queries the site itself makes.
- Never get around a block: no retries on 401, 403 or 429, and no solving anti-bot challenges. A blocked site is logged and skipped.
- Store only price facts (name, brand, size, price, availability, codes). No images or descriptions.
- Never invent data: a field the source doesn't give stays empty.
- Every price records `extracted_at` and `price_context` (the branch or sales channel it belongs to), so the app can show when and where it was checked.
- Before reading a new site, check its terms. If they forbid it, ask for a deal instead.

## Consequences
- Tienda Inglesa stays out until we have a deal or a feed from them.
- Reading a full catalog is slow by design, so scraping must run as a background job, never on a user request.
- Prices are for one default branch per chain, not for the user's address.
