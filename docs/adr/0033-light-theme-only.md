# 0033. Light theme only

- Status: Accepted
- Date: 2026-10-18

## Context
[ADR 0025](0025-viveri-identity-and-ui-system.md) gave every color token a dark counterpart, and the app followed the system: on a dark system it was dark, the Google button turned dark and the browser bar did too. The user doesn't want a dark mode ("Saca el modo oscuro, que quede el modo light"), and on a dark system the app looked dark whenever it opened ([plan](../plans/2026-10-18-light-only.md)).

Options considered:
- **Keep following the system.** Rejected: it's what the user doesn't want.
- **A setting to choose.** Rejected: more to build and measure, for a mode nobody asked for.
- **Light only.** Chosen.

## Decision
The app has one theme, the light one, on every system.
- The dark token block is removed from `src/index.css`. `:root` keeps `color-scheme: light`, so form controls, scrollbars and Google's button frame stay light on a dark system.
- The Google sign-in button is always `outline`, and there is one `theme-color`, the light ground.
- [design.md](../design.md) drops the `*-dark` tokens, the dark values and the dark glass measurements.

## Consequences
- This supersedes the dark-mode parts of [ADR 0025](0025-viveri-identity-and-ui-system.md) and [ADR 0026](0026-glass-navigation-layer.md) (the dark palette, the `#0D1613` glass tint and the dark capsule), and the dark values of [ADR 0031](0031-cleaner-neutral-palette.md), which never shipped.
- People on a dark system get a light app. The contrast checks and the glass measurements only have one theme to hold now.
- If a dark theme comes back, it is new work: its tokens, its glass measurements and a new ADR. The earlier plans and git history have the values that were tried.
