# 0025. VIVERI identity and a token-based UI system

- Status: Superseded by [0026](0026-coral-identity-and-glass-dock.md)
- Date: 2026-10-17

## Context
The app shipped with placeholder looks: GitHub-like colors, a purple favicon, and "app" as the page title, the manifest name and the iOS home-screen name. The name VIVERI and its logo (seven dots in a V converging on one tangerine dot, with a custom wordmark) were approved in a separate logo exploration. We needed one visual system before the Menu and List screens are built on top of the current ones. Options considered:
- Keep the incumbent styles and only swap the logo and accent color: fast, but the rest stays generic and every new screen inherits that.
- A CSS framework or a component library: consistent quickly, but adds a dependency only for styling and pulls the app toward that library's look.
- Plain CSS with design tokens, built on the approved identity: no new dependencies, and the app stays small and Capacitor-friendly ([ADR 0002](0002-pwa-now-capacitor-later.md)).

## Decision
- The app is called **VIVERI** everywhere a name shows: page title, iOS home-screen title, PWA manifest.
- The approved logo files are used unchanged: the horizontal logo on sign-in, the icon as favicon, app icon (PNG renders at 180, 192 and 512 px) and the desktop rail. Nobody redraws or recolors them.
- The UI is plain CSS with tokens as custom properties in `src/index.css`, light and dark. No CSS framework or component library.
- The system follows the mark's idea, "seven into one": the icon's deep green for the tab bar, tangerine only for "the one" (current tab, send, the apex), and the mark itself as the loading and typing indicator. Details live in [design.md](../design.md).

## Consequences
- New screens start from documented tokens and components instead of one-off styles.
- The look stays consistent across the PWA and a future Capacitor build, since it's the same CSS.
- A 16 px favicon and Android adaptive or monochrome icons still need simplified variants of the mark, which don't exist yet.
- Anyone changing colors must keep the contrast the system was checked against (text ≥ 4.5:1, UI graphics ≥ 3:1, both themes).
