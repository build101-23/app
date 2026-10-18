# 0035. The mark is the first V of VIVERI

- Status: Accepted
- Date: 2026-10-18

## Context
[ADR 0025](0025-viveri-identity-and-ui-system.md) adopted the v1 logo unchanged: the seven-dot mark next to the full word VIVERI. The client asked for the mark to be part of the word instead, "LOGO IVERI", with the mark working as the first V.

A logo exploration (`C:\prompt-lab\assets\logo-app\`, v2 to v4) compared four ways to do it, judged on legibility, brand fidelity and typographic craft:
- **The exact v1 mark as the first letter:** keeps one drawing for icon and wordmark, but the letter is 27% wider than the solid V in the same word and noticeably lighter.
- **Dots laid on the solid V's skeleton:** the most legible, but the dots merge into a beaded V below about 40px, and the arms no longer converge on the point.
- **A raised initial, taller than the capitals:** reads as misaligned, and most like an icon in front of "IVERI".
- **A narrower redrawn mark:** the arms at 26.5° from vertical instead of 30.1°, and wider gaps so the seven dots stay separate down to 16px. It is 13.5% wider than the solid V instead of 27%.

## Decision
- The logo is the mark followed by IVERI, using the narrower redrawn mark (v3, `recommended-integrated.svg`). The letters, their spacing and the colors are v1's.
- The app icon and the `Mark` component are redrawn with the same V (v4), so the icon, the wordmark and the state glyph stay one drawing.
- The files are used unchanged, as ADR 0025 set for v1. Details and file origins live in [design.md](../design.md#logo-and-app-icons).

## Consequences
- The brand shows one sign in three places: the first letter of the logo, the app icon, and the loading mark.
- The logo is narrower (183.03 × 57.8 instead of 260.56 × 72), so the top bar and sign-in logos take less width at the same height.
- The first letter is still lighter than the letters after it: its dots carry about 65% of the solid V's ink.
- The redrawn mark has not been tested with real users, on real home screens, or in print. Trademark and domain checks are still open.
- A 16px favicon and Android adaptive or monochrome icons still need simplified variants, as ADR 0025 noted.
