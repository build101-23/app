# The mark becomes the first V of VIVERI

Status: **done** (2026-10-18). Branch `feat/integrated-logo`, from `main`. Lint, tests, build and the fixture screens (360 and 1280 px: top bar, sign-in, splash) checked.

## Context
The app shows the approved v1 logo: the seven-dot mark next to the full word VIVERI ([ADR 0025](../adr/0025-viveri-identity-and-ui-system.md)). The client asked for the mark to be part of the word instead: not "mark + VIVERI" but "mark + IVERI", with the mark working as the first V.

A logo exploration (outside this repo, in `C:\prompt-lab\assets\logo-app\`) produced the options:
- **v2:** three designs judged on legibility, brand fidelity and typographic craft, plus a refined one.
- **v3:** the client chose the narrow redrawn mark.
- **v4:** the app icon and the standalone mark were redrawn with the same V, so icon and wordmark share one drawing.

The narrow V differs from v1's mark:
- the arms open 26.5° from vertical (v1: 30.1°), so the V sits closer to the width of the solid V in the word;
- the gaps between dots are wider, so the seven dots stay separate at small sizes;
- seven dots, the orange point 1.28× the first pair, and the colors are unchanged.

The exploration also found an arc-rounding defect in v1's horizontal logo: two dots were drawn about 4% taller than wide. The new files use true circles.

## Decisions (made in chat, 2026-10-18)
- Use the v3 integrated wordmark and the v4 icon everywhere the v1 files are used today.
- Swap the app, not only add the files: logo, favicon, PNG app icons, and the `Mark` component's geometry.
- Record it as a new ADR that amends ADR 0025's "approved logo files", rather than rewriting 0025.

## Steps
1. Save this plan.
2. Copy the files byte for byte:
   - `C:\prompt-lab\assets\logo-app\v3\recommended-integrated.svg` to `src/assets/viveri-logo.svg`;
   - `C:\prompt-lab\assets\logo-app\v4\recommended-icon.svg` to `public/favicon.svg`.
3. Re-render `public/icons/icon-180.png`, `icon-192.png` and `icon-512.png` from the new icon with headless Chrome at 1× scale. Keep the origin note in a `tEXt` chunk, as before.
4. `src/ui.tsx`: give `Mark` the new icon's centers and radii, with the viewBox cropped to the dots. Keep the `converge` animation and its steps (outer pair to apex).
5. `src/App.tsx`: update the logo `<img>` width and height to the new aspect ratio (183.03 × 57.8), at the same 28px and 44px heights.
6. Check: `npm run lint`, `npm test`, `npm run build`, and the fixture build at 360 and 1280 px (top bar, sign-in, splash and the chat's waiting mark).
7. **Docs step:**
   - `docs/design.md`: the top bar, the mark component, and the logo and app icon files and their origin;
   - a new ADR for the integrated logo and the redrawn mark, with ADR 0025's status noting the amendment;
   - `docs/adr/README.md`.
