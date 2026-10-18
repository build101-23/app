# Skeletons in the shape of the page

## Context
Switching to Menú, Lista or Perfil shows five generic grey-green lines until the data arrives, on every switch. Then the real layout appears somewhere else entirely. It reads as crude: the placeholder says nothing about what's coming, and the content jumps into a different arrangement.

## Approach
Each screen gets a placeholder with the real thing's structure, built from the real classes where they exist, so the gaps, hairlines and card edges are the same and the content arrives where its placeholder was.

- **Menú:** three days, each with a heading bar and a short bar on the right ("Cambiar"), then four meal rows with a hairline under each (a short bar for the slot, a longer one for the recipe). Reuses `.menu section`, `.menu-day`.
- **Lista:** the "Dónde comprar" card (`.prices`) with a heading and three lines, the two button pills, then a section heading and five rows (checkbox square, name bar, quantity bar). Reuses `.prices`, `.list-actions`, `.list ul`, `.list li`.
- **Perfil:** the facts card (`.card.facts`) with three label and value rows, then two groups with a heading bar and chip pills (`.group`, `.chips`).
- Still flat sunk shapes with the slow `pulse`. A shimmer would need a gradient fill, which design.md's Flat Fill Rule rules out, so the chat status line's shimmer isn't reused.
- All placeholders share a `skeleton` class. The page fade-in skips `.skeleton` (it used to list the two skeleton classes).
- Each keeps one `role="status"` region with the screen-reader label; the other pieces are `aria-hidden`.
- `PageSkeleton` takes the shape (`menu` or `list`); Profile's lives in `Profile.tsx` as before.

## Check
`npm run dev:fixture` with `?loading=data` (stuck on the skeletons), at 390 px, light and dark; then without it, to see the swap to the real content. `npm run lint` and `npm run build`.

## Docs
`docs/design.md`: the Skeletons bullet (shapes, shared class, no shimmer) and the "Content arriving" bullet (the `.skeleton` exclusion).

## Results
- Checked in `npm run dev:fixture` with `?loading=data` at 390 px, light and dark, and by measuring the placeholder against the loaded page (fixture, `?menu=saved`): Menú's first day heading is at the same y (92 px); the first meal row was 3 px off and the second day 11 px off, so the heading is now 31 px tall and the skeleton has the page's 8 px gap between days. Lista's row is 49 px with its hairline, like the real one. Perfil's card-to-group gap is the real 28 px.
- Not matched, by nature: Lista's "Dónde comprar" card is as tall as its content (558 px in the fixture, once the prices are read), so the rows under it move when the prices arrive, as before. The skeleton shows a five-line card.
- `npx tsc -b` and `npm run lint` pass.
