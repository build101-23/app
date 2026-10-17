# VIVERI v2: more palette options in the dev picker

Status: **done**: the user chose Naranja zapallo, slightly darker ([ADR 0026](../adr/0026-naranja-zapallo-colors.md)). Isolated preview, not merged.

## Context
After seeing v2 running, the user said: "La menu bar me gusta. Los colores no", and asked for options they can try in the app the way the "Paleta (dev)" picker already offers three. So the dock, layout and logo geometry stay; only color changes, and only in development until the user picks one.

Already rejected in the conversation, so not offered again: v1's muted green and tangerine; celeste/sun, plum/acid and fuchsia/cyan; cherry, egg yolk, bubblegum and night/ice; fruit week and pearl. Coral manda (coral, aquamarine, black) is now disliked in the real app too.

## Approach
1. Generate candidates from six angles in parallel (bold daylight, deep premium, Montevideo market, minimal and loud, unexpected, coral evolved), each a complete token set for light and dark: ground, surfaces, lines, ink, primary, user bubble, "the one" accent, danger, week dots, sent surface, the brand field gradient, the tile and the mark's dot colors.
2. A judge picks eight, as varied as the candidates allow, rechecks every contrast pair and fixes what fails.
3. A generator script turns the eight into `src/dev/palettes.css` (one `:root[data-direction='…']` block per palette, light and dark) and `src/dev/palettes.ts` (the picker's list, with a one-line mood each). It refuses to write if a pair fails: text ≥ 4.5:1, strong lines and logo dots ≥ 3:1, dock labels ≥ 4.5:1 over the glass mixed with a user bubble behind it.
4. Remove what still assumed coral: the sign-in card's warm shadow becomes `--field-shade` / `--field-rim`, so each palette shadows its card with its own field's tone, and a dark field gets a light hairline in dark mode.
5. Verify, then show the user a comparison sheet.
6. Docs: `design.md` (directions under review, the card shadow token), `development.md` (picker and `?direction=` values), this plan.

## Constraints
- Dev-only: nothing from `src/dev/` reaches `npm run build`.
- No new dependencies; plain CSS tokens.
- The shipped default stays Coral manda until the user chooses.

## Result
- Eight palettes reached the picker, all passing the generator's checks.
- The user picked **Naranja zapallo**, "un pelín más oscuro": the orange went from #FF7F00 to #EA7402 (and the field and dots by the same step) and became the default in `src/index.css`. The favicon, logo SVG, manifest and theme colors were recolored. Coral manda moved to `src/dev/directions.css` as an alternative.
- Checked: `tsc`, oxlint, build; nothing from `src/dev/` or the old coral in `dist/`; captures of sign-in, chat, typing and profile, light and dark.
- Not done: the PNG app icons (`public/icons/`) are still coral; another process held them open, so they couldn't be overwritten. The new renders are ready to copy. Dock label contrast is calculated, not yet measured on real pixels, for the orange.
