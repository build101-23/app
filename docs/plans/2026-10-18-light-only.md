# Light theme only

## Context
The user doesn't want a dark mode: "Saca el modo oscuro, que quede el modo light". Today the app follows the system: `@media (prefers-color-scheme: dark)` swaps every color token, the Google sign-in button turns dark, and a second `theme-color` meta paints the browser bar dark. On a dark system the app shows dark, and twice in this session the preview pane did too.

## Approach
Remove the dark theme; the app is the light theme on every system.
- `src/index.css`: delete the dark block. `:root` already says `color-scheme: light`, so form controls, scrollbars and the Google button's frame stay light on a dark system. The `.google-button` rule no longer needs its own `color-scheme: light`.
- `src/GoogleSignIn.tsx`: the button's theme is always `outline`.
- `index.html`: one `theme-color` meta, the light ground, without a `media` condition.
- Docs: `design.md` loses the `*-dark` tokens, the dark values and the dark measurements (the glass was measured in light mode too, and those numbers stay); `development.md` stops asking for dark checks; a new ADR (0033) records the decision and supersedes the dark-mode parts of ADRs 0025, 0026 and 0031.

Not touched: the logo and mark colors, the light palette, the glass fallbacks, and the history in earlier plans (they describe what was done then). The palette plan gets a line saying its dark rows are historical.

## Check
In `npm run dev:fixture` with the browser pane emulating a dark system: the app must render light, the sign-in screen (`?auth=out`) included. `npx tsc -b`, `npm run lint`, `npm run build`, and a search for leftover `dark` in `src/`, `index.html` and `docs/design.md`.

## Docs
Done as part of the change, above.
