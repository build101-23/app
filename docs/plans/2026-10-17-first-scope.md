# Define the first scope

## Context
The product doc mixed settled scope with open questions, and the first version tried to cover two entry paths. These decisions were made in review:

- First user: regular people in Montevideo (gym-goers, nutritionist patients, anyone). Entry is the AI chat only; plan upload moves to the roadmap.
- Prices: supermarket websites plus the government's price system (SIPC).
- Platform: installable web app (PWA) now, wrapped with Capacitor for the app stores later.
- Savings are measured against the average price of the same list across stores.
- Store choice: one store by default; a split across at most 2 stores only when it saves at least 10% or a store is missing items.
- Confirmed: Montevideo only, no ordering, voice is dictation only, numbers hidden by default.
- The learning table gets a target column.

## Steps
1. `docs/product.md`: rewrite Users, How it works and Scope for chat-only entry; remove the plan upload feature; rewrite the Save money section with the store rule and missing items; add targets to the learning table and drop the questions about plan reading and entry path.
2. `docs/notes/roadmap.md`: add plan upload (PDF, photo, text, portion-based plans) and a usual-store savings baseline.
3. `docs/notes/open-decisions.md`: remove the decided items; add supermarket terms check, safe limits for AI-built plans, and sending health data to an AI provider abroad (Law 18.331).

## Docs
- ADR 0002: PWA now, Capacitor later.
- ADR 0003: price sources.
- `docs/architecture.md`: list both in Stack.
- `docs/adr/README.md`: add both to the index.

## Verification
- No decision appears as both settled in `product.md` and open in `open-decisions.md`.
- `product.md` no longer mentions plan upload except in a link to the roadmap.
