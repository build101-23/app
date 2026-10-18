# Tab content fades in

## Context
Menú, Lista and Perfil show a skeleton while they load, then the content replaces it in one frame. Switching tabs does the same: the page mounts and its text is just there. Chat already animates its bubbles (`rise-in`), so it's the only tab that doesn't feel abrupt.

## Approach
CSS only, in `src/index.css`; no component changes.

- A page's content is its direct children: `.page > *`. React keeps `.page` mounted while it swaps the skeleton for the content, but the children are new elements, so a CSS animation on them plays when the content arrives and again on each tab switch. Content that shows up later (the "Dónde comprar" card once the prices are read) fades in too.
- The skeletons are excluded (`.page-skeleton`, `.profile-skeleton`). A load that takes 100 ms would otherwise swap a half-faded skeleton for content that starts at zero, which flickers.
- `fade-in` (existing keyframes), 300 ms, `ease-out`. New token `--dur-slow: 300ms`, since `--dur` (200 ms) is too short to read as a fade. `ease-out` instead of `--ease`: `--ease` reaches half the opacity in about 16% of the time, so on a fade it reads as a pop.
- `prefers-reduced-motion: reduce` already turns every animation off.

## Check
`npm run dev:fixture`: switch between Menú, Lista and Perfil, and watch `document.getAnimations()` for the duration and the targets (skeletons must have none). Pause the animation at 100 ms to see a half-faded frame. `npm run lint` and `npm run build`.

## Docs
`docs/design.md`: a row for `--dur-slow` in the Motion table, and one line under Alerts and states about content fading in.
