---
name: VIVERI
description: Phone-first app that turns a conversation about how you eat into a week of meals and one shopping list.
colors:
  orange: "#ea7402"
  black: "#111111"
  ground: "#f4f2ee"
  surface: "#ffffff"
  surface-sunk: "#e9e6e0"
  line: "#dfdbd3"
  line-strong: "#7e7973"
  ink: "#111111"
  ink-muted: "#56524c"
  primary-hover: "#33312e"
  danger: "#b0103f"
  danger-surface: "#fce8ee"
  ground-dark: "#0d0c0b"
  surface-dark: "#191816"
  surface-sunk-dark: "#262421"
  line-dark: "#2e2c29"
  line-strong-dark: "#7a756f"
  ink-dark: "#f5f3ee"
  ink-muted-dark: "#b0aaa2"
  primary-dark: "#f5f3ee"
  primary-hover-dark: "#dad6cf"
  danger-dark: "#ff8fa8"
  danger-surface-dark: "#2d121a"
typography:
  title-large:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  section-heading:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 650
    lineHeight: 1.3
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 550
    lineHeight: 1.5
    letterSpacing: "normal"
  meta:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  caption:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  tab:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.01em"
rounded:
  bubble-tail: "6px"
  field: "14px"
  card: "16px"
  bubble: "18px"
  composer: "24px"
  dock-item: "29px"
  dock: "34px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  gutter: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.black}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "0 22px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-primary-dark:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.black}"
  button-secondary:
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 22px"
    height: "48px"
  send-button:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.black}"
    rounded: "{rounded.pill}"
    size: "48px"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0 16px"
    height: "52px"
  composer-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.composer}"
    padding: "12px 18px"
  bubble-user:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.black}"
    rounded: "{rounded.bubble}"
    padding: "10px 14px"
  bubble-assistant:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.bubble}"
    padding: "10px 14px"
  chip:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
  dock:
    textColor: "{colors.ink}"
    typography: "{typography.tab}"
    rounded: "{rounded.dock}"
    height: "68px"
  dock-item-active:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.black}"
    rounded: "{rounded.dock-item}"
---

# Design System: VIVERI

Living doc: how the interface looks *now*. Tokens live as CSS custom properties at the top of [`src/index.css`](../src/index.css); this file explains them. The colors come from [ADR 0028](adr/0028-naranja-zapallo-colors.md); the dock, layout and everything else from [ADR 0026](adr/0026-coral-identity-and-glass-dock.md), which replaced the green and tangerine identity and the desktop rail of [ADR 0025](adr/0025-viveri-identity-and-ui-system.md).

## Overview

**Creative North Star: "Naranja zapallo" (pumpkin orange)**

Street poster and market stall: newsprint off-white, a firm black and one pumpkin orange that lights up the screen. One color plus black, nothing else. The brand screens (sign-in, splash) are an all-orange field, darker at the top-left corner and warmer toward the bottom-right. Inside the app the ground is a neutral warm off-white, the user's messages are orange, and the same orange marks the one thing that's active: the current tab, the send button. Black carries the text, the primary buttons and the tile the mark sits on.

It's still a working tool: a title bar, a chat, standard controls. Navigation is one floating glass dock, the same at every width, through which content stays visible.

**Key Characteristics:**
- One vivid color and black, graphic like a poster.
- Orange for the user's voice and for "the one"; never for text.
- The mark always on its black tile.
- A floating translucent dock, with a solid fallback.
- One system typeface, 16 px body.
- Motion only for state; off under reduced motion.

## Colors

Pumpkin orange with black, each with a composed dark theme. Every text pair is ≥ 4.5:1 and every UI graphic ≥ 3:1 in both themes, computed, including dock labels over the glass with a user bubble behind it.

### Primary
- **Orange** (#EA7402): a touch deeper than pure #FF7F00, so it reads less neon. The user's message bubbles (black text, 6.3:1), the active tab pill, the send button, the listening mic and the sent-link badge (as tints). Never text: 3.0:1 on white, 2.7:1 on the ground.
- **Black** (#111111): ink, primary buttons in light mode, the mark's tile, the wordmark on the orange field.

### Brand field and mark
- **Field gradient:** `135deg`, #E96104 0% → #EA7402 45% → #EC8A08 80% → #F09912 100%. All orange, so it never goes gray. Black text on it is ≥ 5.5:1.
- **Mark:** the outer pair #E96104, the middle pair #EA7F05, the inner pair #F09C1B (5.5, 6.8 and 8.5:1 on the tile), and a white apex.

### Neutral
- **Ground** (#F4F2EE / #0D0C0B): page and title bar.
- **Surface** (#FFFFFF / #191816): cards, assistant bubbles, fields, the solid dock.
- **Sunk surface** (#E9E6E0 / #262421): chips, status pill, skeletons, disabled send.
- **Line** (#DFDBD3 / #2E2C29) and **strong line** (#7E7973 / #7A756F): hairlines; field borders and outlines (≥ 3:1).
- **Ink** (#111111 / #F5F3EE) and **muted ink** (#56524C / #B0AAA2).
- **Primary in dark mode:** off-white (#F5F3EE) with black text.
- **Danger** (#B0103F on #FCE8EE / #FF8FA8 on #2D121A): errors, always with an icon. It's a crimson-rose, far enough from the orange that it never reads as brand.

### Named Rules
**The One Rule.** Orange is the user's voice (their bubbles) and marks the single active or primary-next thing per region: the current tab, send. It is a fill with black on top, never text or decoration.

**The Tile Rule.** The mark (orange dots, white apex) always sits on its black tile: the app icon, the title bar, the typing bubble, the empty profile, the splash. The wordmark is black on light grounds and on the orange field, white on black. Geometry never changes.

### Color directions under review
The dev-only picker (see [development.md](development.md#color-directions-dev-only)) still compares the default with ten alternatives, all checked to the same contrast bar; none ships. Each one swaps only color tokens: layout, dock, type and logo geometry stay.
- **Coral manda:** the previous default (coral bubbles, aquamarine for "the one", a coral-to-aquamarine field). Its full token set lives in [`src/dev/directions.css`](../src/dev/directions.css).
- **Aguamarina manda:** aquamarine bubbles and mark dots; coral marks what's active; gradient aquamarine → teal → coral; ground #F0FBF8.
- **Trópico:** adds sun yellow (#FFD23F) as "the one". The mark's pairs go coral, yellow and aquamarine, with a white apex; gradient coral → yellow → aquamarine; ground #FFFAF0.
- **Seven more from the palette exploration** ([plan](plans/2026-10-17-viveri-v2-palette-options.md)), in the judge's order, by user bubble / "the one":
  1. Petróleo y azafrán: petrol / saffron, on a dark petrol field with a saffron tile.
  2. Cacao y mburucuyá: chocolate / passion-fruit gold, on a gold field.
  3. Palta: avocado green / black, on a green field.
  4. Tannat y menta: wine / mint, on a wine field.
  5. Mandarina y petróleo: tangerine / petrol, on an orange field.
  6. Sandía: green / watermelon pink, on a green-to-pink field.
  7. Verde lechuga: lettuce green, used for both, with black.

  Their exact values live in [`src/dev/palettes.css`](../src/dev/palettes.css), with each one's reasoning as a comment.

## Typography

**Display Font:** none; the wordmark is the brand's lettering.
**Body Font:** system-ui (SF Pro on Apple devices, Roboto on Android, Segoe UI on Windows)

**Character:** one familiar sans, tuned: semibold titles with slight negative tracking, 16 px reading text, heavier labels on the glass dock.

### Hierarchy
- **Title large** (650, 1.75rem, 1.2): the sign-in heading.
- **Section heading** (650, 1.0625rem, 1.3): Menu's days and List's sections and "Dónde comprar".
- **Body** (400, 1rem, 1.5; 1.45 in bubbles): messages, values, hints.
- **Label** (550, 0.9375rem): field labels, chips, alerts; profile section headings at 1rem/650.
- **Meta** (400, 0.875rem): definition-list labels.
- **Caption** (600, 0.8125rem): status pill, error details, weekday letters.
- **Tab** (600, 0.75rem; 750 when active): dock labels, always in full ink. Gray text isn't used on glass.

### Named Rules
**The 16 px Floor Rule.** Every text input is at least 16 px, so iOS never zooms on focus.

## Layout

- **Every width:** a title bar (the tile plus the VIVERI wordmark in ink, aligned to the content column; always the app's name, never the screen's, which is an `sr-only` `h1` for screen readers), one scrolling work area, and the dock floating over the bottom. Content sits in a 720 px column centered on wide screens. The dock is centered below it; there's no side navigation.
- **Dock clearance:** `--dock-space` is the height from the viewport's bottom edge to the top of the dock (68 px dock + 12 px gap + the bottom safe area).
  - **Pages** end with that much room plus 28 px, so their last line scrolls clear of the dock.
  - **Chat:** messages scroll all the way down, behind the floating composer and the dock. The list reserves space below the last message equal to the dock, the composer (its live height in `--composer-h`, from a `ResizeObserver`) and a margin, and `scroll-padding-bottom` keeps auto-scroll there too.
- **Scroll edge:** where content meets the floating chrome it fades into the ground (`--veil`, 88%), so cut-off lines never crowd the controls.
  - **Where:** the veil covers every edge (below the dock, beside it on wide screens, the gap under the composer) except a feathered elliptical hole inside the dock's outline (`--veil-hole`, a CSS mask). There the veil drops to about a third, so the glass shows what's scrolling past.
  - **Hole size:** 47% of the width on phones, 220 px from 464 px up. Each size uses a single unit, because Chromium rejects % and px mixed in a gradient size.
  - **Chat:** `.chat::after` holds the veil up to the composer, then eases out over 44 px. The list keeps 48 px under its last message, so the newest message never sits in that ease. The veil stops 12 px short of the right edge, where the scrollbar is.
  - **Pages:** `.shell::after` covers the 28 px above the dock.
  - **Keyboard open:** with no dock, there's no hole.
  - **Reduced transparency or more contrast:** the veils turn solid, with no hole.
  - **Contrast:** the veils also keep dark-mode dock labels above 4.5:1 over bright content.
- **Staying at the end:** if you're at the end of the conversation, it stays there when the composer grows, the keyboard opens or closes, or the dock comes back.
- **Keyboard:** while the on-screen keyboard is up and focus is in the composer, the dock is hidden and `--dock-space` drops to 0, so the composer sits just above the keyboard. `useKeyboardOpen` in `src/App.tsx` reads the visual viewport. When the keyboard goes down, the dock comes back even if the composer keeps focus. The send button keeps focus in the textarea, so tapping it doesn't shift the layout.
- **Safe areas:** `--safe-*` wrap `env(safe-area-inset-*)`. The title bar pads the top inset, the dock floats 12 px above the bottom inset, and the gutters respect the side insets.
- **Spacing:** a 4 px base, a 16 px gutter, 28 px between profile groups.

## Elevation & Depth

Mostly flat, with one floating layer. Surfaces separate by tone and 1 px lines. The dock and the floating composer are the only elevated things:
- **Dock:** glass material (below), with a two-layer shadow.
- **Composer:** the field and the send button each carry a short shadow so they read above the scrolled messages.

### Shadow Vocabulary
- **Dock** (`0 12px 32px -12px rgb(18 18 18 / 0.4), 0 2px 8px rgb(18 18 18 / 0.08)`; dark: black at 0.8/0.4): separation from busy content.
- **Floating control** (`0 6px 18px -8px rgb(18 18 18 / 0.35)`): the composer field and send.

### Named Rules
**The One Floating Layer Rule.** Only navigation and the composer float, plus the sign-in card, which needs a soft shadow to keep its outline over the gradient's light band. Nothing else gets a shadow, and a translucent surface never sits on another translucent surface.

## Shapes

Round, from the dots:
- **Pills** (999px): buttons, chips, the status pill.
- **Circle:** 48 px for send.
- **Composer:** 24px.
- **Bubbles:** 18px, with a 6px tail corner.
- **Cards:** 16px. **Fields:** 14px.
- **Dock:** 34px, with 29px active pills.
- **The tile:** 22% of its size, the app-icon corner.

## Components

### The dock (signature component)
- **Placement:** fixed, centered, `min(100% − 24px, 440px)` wide and 68 px tall, 12 px above the bottom safe area, at every width. Four equal tabs, icon plus label, each at least 48 px wide and 58 px tall.
- **Glass** (where `backdrop-filter` is supported): the ground at 50% (dark: the surface at 55%), `blur(24px) saturate(180%)` with the `-webkit-` prefix.
  - **Edge:** an inset white top edge that catches the light (0.95 light, 0.22 dark). A 2 px gap, then a faint sheen over the top fifth, and a hairline rim and the dock shadow.
  - **Dark mode:** the edge reads as its own line (about 2:1 against the content above).
  - **Light mode:** a white line on near-white glass can't stand out at rest; there the 12% ink rim draws the outline, and the white edge shows against colored content.
  - No shimmer, no refraction.
- **Label legibility:** labels stay legible over whatever passes behind. With Coral manda, measured on real pixels: worst case 7.3:1 light, 5.5:1 dark. With the orange, only calculated so far: ≥ 4.5:1 with a user bubble behind the glass.
- **Active tab:** a solid orange pill with a 1.5 px ink ring, black label at weight 750, `aria-current="page"`. The ring keeps the state ≥ 3:1 against any glass, so it's marked by outline, shape and weight, not color alone. Switching tabs isn't animated (measured: no animations running right after a switch); pressing scales to 0.96.
- **Appearing:** when the dock appears (first load, or the keyboard going down), it materializes in 200 ms: opacity, an 8 px rise and a 0.98 scale. This is never tied to a tab switch, and it's off under reduced motion.
- **Focus:** a 2 px ink ring drawn inside the tab (offset −4 px), so it never merges with the active pill's ring next to it. In forced-colors mode, focus is a 3 px CanvasText outline, distinct from the active tab's Highlight outline.
- **Solid fallback:** surface fill with a 1 px strong-line border, used when `backdrop-filter` is unsupported or when the user asks for reduced transparency. With more contrast it gets an ink border. Forced-colors mode uses system colors with a Highlight outline on the active tab.
- **Implementation note:** the dock reads its material from custom properties (`--dock-bg`, `--dock-filter`, `--dock-border`, `--dock-layer`). The solid look is the default; glass is layered on inside `@supports`, and the accessibility media queries reset it.

This is a web approximation of a translucent material; it does not reproduce Apple's native one.

### Buttons
- **Shape:** pill, 48 px tall (52 px on sign-in), 600 weight.
- **Primary:** black with white (light); off-white with black (dark).
- **Secondary:** transparent with a strong-line inset outline (sign-out, and the email form's button while Google leads).
- **Quiet:** underlined ink text, 44 px tall; inside alerts it takes the danger color ("Reintentar").
- **Disabled:** 55% opacity.
- **Busy:** full color, a progress cursor, a changed label and `aria-busy`.

### Send button
A 48 px orange circle with a black arrow, with the floating-control shadow. Disabled: sunk surface with a muted arrow.

### Inputs / Fields
- **Style:** surface fill, 1 px strong-line border, 14 px radius, 52 px tall; label above.
- **Composer:** a 24 px-radius field that grows up to about six lines (`field-sizing: content`, with a JS fallback), then scrolls without showing a scrollbar.
- **Focus:** a 2 px ink ring drawn over the field's own border (offset −1 px).

### Chips
Sunk-surface pills with ink text: the can't-eat, dislikes, likes and wants lists. Read-only.

### Cards / Containers
16 px corners, surface fill, 1 px line border, no shadow. The sign-in card has no border; it sits on the gradient with a hairline and a soft shadow in the field's own dark tone, `--field-shade` (#6E2E02, the field's first stop darkened): `0 0 0 1px` at 12% (`--field-rim`) and `0 12px 32px -14px` at 32%. A neutral shadow would gray the field. On a dark field in dark mode, `--field-rim` turns into a light hairline so the dark card doesn't merge with the field.

### Sign-in card
- **Google first:** Google's official button is the one primary action: pill, "Continuar con Google", black (`filled_black`) in light mode and white (`outline`) in dark mode, up to 400 px wide. Its look and text are Google's; we only pick theme, shape, size and language. A 44 px box holds its place while Google's script loads.
- **Email behind a link:** a quiet "Entrar con tu email" link under it. Pressing it opens the form in place, below a hairline, with its own hint, and moves focus to the email field. The form's button is secondary, so the card never has two primary actions.
- **Email only:** with no Google client ID, or when Google's script can't load, the card is the email form with a primary button, and the header gives the email hint. If the script failed, an inline alert says Google isn't available and to use email.
- Why: [ADR 0027](adr/0027-google-leads-sign-in.md).

### Chat bubbles
- **User:** orange with black text, tail corner bottom right.
- **Assistant:** surface with a line border, tail corner bottom left.
- **Waiting for a reply:** a black bubble with the mark.
- **Arrival:** messages that arrive while you're in the chat rise 6 px and fade in over 160 ms (`.bubble.fresh`). The loaded history doesn't animate, so coming back to the chat from another tab never replays it.
- **Menu card:** a saved or shown menu is an assistant bubble with the week (day in bold, meals on one line) and a primary "Ver menú" button.
- **List card:** the list as it stands, by section, with the total in bold, the budget line when the menu has a budget, a small muted line with how many products weren't found and the date the prices were read, and a primary "Ver lista" button. Until the prices are read, or when they can't be, one muted line says so.
- **Chats bar:** "Chats" and "Nuevo chat" as quiet links above the messages, with a hairline under them. The chat list replaces the messages and scrolls behind the composer and dock the same way.
- **Voice input:** a 48 px round button beside send, surface with a strong line; while listening it takes the orange fill and pulses.

### Menu and List
- Both are `.page` screens: the same column and gutters as Perfil, and bottom room for the dock.
- **Buttons:** one primary action per screen ("Compartir"), secondary for the next ("Copiar"), and quiet links for "Cambiar" and "Lista nueva". Never orange.
- **Menu:** each day is a heading with "Cambiar", then its meals as rows that open to the ingredients and how to make it, separated by hairlines. With the numbers switch on, the day's total and each meal's calories and macros sit under them in small muted text.
- **Numbers switch** (Perfil): a card with the label and a 52 × 32 px toggle, orange when on. If saving fails it flips back and shows an inline alert.
- **List:** "Dónde comprar" is a card on top. The items are hairline rows with a checkbox, the name, the amount to buy (what the menu needs under it, muted) and round 44 px − and + buttons. Crossed-out items are muted and struck through.
  - Under the name, in small muted type, either "No encontrado online" or the product to buy at the chosen store ("2 × Boniato 1 kg · Géant · $ 144"), underlined as a link to its page.
- **Prices:** from the products the chat picked ([ADR 0024](adr/0024-agent-builds-the-menu-from-real-products.md)), always with the muted line saying the date they were read and that they may change.
  - When the menu has a budget, a line in ink says whether the total fits. Over budget is announced to screen readers, but it isn't an error, so it stays ink, not crimson.
  - While the prices load, for a menu saved before real products, or when they can't be read, the card holds one muted line instead.

### Alerts and states
- **Inline alert:** danger on the danger surface, a 20 px icon, 14 px radius. Below the message goes either the provider's raw detail (sign-in) or a "Reintentar" button (chat history, profile).
- **Skeletons:** sunk-surface shapes with a slow pulse.
- **Empty profile:** the tile, the existing copy and an "Ir al chat" primary button.
- **Sent sign-in link:** an orange-tinted mail badge, the message and the address.

### The mark, tile and wordmark
- **`Mark`** in [`src/ui.tsx`](../src/ui.tsx) draws the approved icon's seven circles (same centers and radii), filled from `--logo-dot` and `--logo-apex`. `--logo-dot-2` and `--logo-dot-3` let a direction color each pair separately.
- **`Tile`** is the black rounded square with the mark at the icon's proportion (57%). In dark mode it gets a faint light edge so it doesn't vanish on the near-black ground.
- **`Wordmark`** is the approved wordmark path, copied verbatim, filled from the ground's ink.
- **Motion:** the `converge` animation lights the dots from the outer pair inward to the apex while waiting (1.2 s loop).

### Logo and app icons
- `public/favicon.svg` is the approved icon with only its fills changed: a black tile, orange dots (darkest outside, lightest inside) and a white apex.
- `src/assets/viveri-logo.svg` is the approved horizontal logo in its on-black colorway: orange dots, a white apex and a white wordmark. Use it on black only.
- `public/icons/icon-180.png`, `icon-192.png` and `icon-512.png` were rendered from the new `favicon.svg` with headless Microsoft Edge at 1× scale. Each PNG carries its origin in a `tEXt` chunk; the 512 also serves as the maskable icon.
- Path data was compared with the approved files by script and is identical.

### Motion
| Name | Value | Use |
| --- | --- | --- |
| `--dur-fast` | 120ms | press feedback, color changes |
| `--dur` | 200ms | fades |
| `--ease` | cubic-bezier(0.2, 0.7, 0.2, 1) | all non-looping motion |
| `rise-in` | 160ms, 6px | a new bubble |
| `converge` | 1.2s loop | the mark while waiting |
| `pulse` | 1.4s loop | skeletons |
| `dock-in` | 200ms, 8px rise, 0.98 scale | the dock appearing (first load, keyboard down), never on tab switch |

`prefers-reduced-motion: reduce` turns every animation and transition off.

## Do's and Don'ts

### Do:
- **Do** take colors, sizes and radii from the tokens in `src/index.css`.
- **Do** keep orange for the user's voice and "the one", always as a fill with black on top.
- **Do** put the mark on its black tile, every time.
- **Do** keep content able to scroll under the dock, and give every screen enough bottom room (`--dock-space`).
- **Do** check new screens with the dev fixture at 360, 390 and 1280 px, in light and dark, and with reduced transparency.

### Don't:
- **Don't** put orange text on white or on the ground (3.0:1 and 2.7:1), or the bare mark on a light ground.
- **Don't** stack translucent surfaces, animate the dock, or add shimmer or refraction to it.
- **Don't** use orange for errors; errors are crimson-rose with an icon.
- **Don't** reintroduce side navigation; the dock is the navigation at every width.
- **Don't** show prices or savings without the date they were read and that they may change, or make medical claims.
- **Don't** add a CSS framework or component library for styling.
