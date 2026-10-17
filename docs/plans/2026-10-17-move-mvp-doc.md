# Move the MVP doc into the docs structure

## Context
`nutrition-app-mvp.md` sits in the repo root, which breaks the "no `.md` files outside `docs/`" rule. Its content mixes current scope, future ideas and open questions, so it splits across the existing homes.

## Steps
1. `docs/product.md`: problem, differentiation, users, how it works, scope (in and out), AI nutritionist rules, what we want to learn. Keep the existing headings (Problem, Users, Scope In/Out) and add the others.
2. `docs/notes/roadmap.md`: future plans, grouped by area.
3. `docs/notes/open-decisions.md`: the open decisions checklist and the SIPC source.
4. `README.md`: replace the TODO with a two-sentence description.
5. Delete `nutrition-app-mvp.md`.

## Docs
This change is docs only. No ADR: it applies the structure from [ADR 0001](../adr/0001-record-architecture-decisions.md) and doesn't change it.

## Verification
- `find . -name "*.md" -not -path "./.git/*"` shows no `.md` files outside `docs/` other than README, AGENTS and CLAUDE.
- Every section of the old file has exactly one new home.
