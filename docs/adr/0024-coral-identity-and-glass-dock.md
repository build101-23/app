# 0024. Coral and aquamarine identity, floating glass dock

- Status: Proposed (colors superseded by 0026)
- Date: 2026-10-17

## Context
[ADR 0023](0023-viveri-identity-and-ui-system.md) gave the app the approved VIVERI mark with its muted green and tangerine, a deep-green tab bar, and a left rail on desktop. Reviewing the result, the product owner rejected the palette as boring and asked for:
- a more vivid, unconventional identity, including new colors for the logo with the same geometry;
- one translucent bottom dock at every width.

Options considered, all shown in context:
- celeste and sun;
- plum and acid yellow;
- fuchsia and cyan;
- cherry;
- egg yolk;
- bubblegum;
- night and ice;
- a fruit-colored week;
- pearl;
- coral and aquamarine, in four variants.

The product owner chose coral and aquamarine with coral leading, and black instead of navy.

## Decision
- **Palette:**
  - coral `#FF6A5C`, peach `#FF9E7A` and aquamarine `#5FE8CF`, with black `#121212` ink and a peach-tinted ground;
  - the brand screens (sign-in, splash) use the coral → aquamarine gradient;
  - coral carries the user's messages; aquamarine marks "the one" (the active tab, send);
  - the light and dark themes are composed separately.
- **Logo:** same geometry. The mark is recolored to coral dots with an aquamarine apex and always sits on its black tile, because coral and aquamarine are too light to stand alone on white. The wordmark is black on light and gradient grounds, white on black. Favicon, PWA icons and the logo SVG follow.
- **Navigation:** one floating dock, centered at the bottom, at every width. It replaces the phone tab bar and the desktop rail.
  - **Material:** `backdrop-filter` blur and saturation, a light-catching edge, a shadow, all static.
  - **Fallback:** solid when unsupported, or when the user asks for reduced transparency or more contrast.
  - **Active tab:** a solid aquamarine pill and bold text.
- **Kept from 0023:** the name, the approved mark and wordmark geometry, and plain CSS with tokens (no framework).
- **Dev picker:** a dev-only control compares the default with two close variants ("Aguamarina manda", "Trópico"); production never includes it.

## Consequences
- **Gains:** the app reads as vivid and specific, and the glass dock lets content stay visible.
- **Cost:** the logo needs its black tile everywhere, so a bare mark on white is not an option.
- **Approximation:** the web material only approximates the native one; real devices (iOS Safari, Android) still need checking.
- **Error color:** coral sits close to red, so errors use a deeper crimson with an icon, never coral alone.
- **Superseded:** 0023's color rules and the desktop rail.
