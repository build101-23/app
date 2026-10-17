---
name: VIVERI
description: Phone-first app that turns a conversation about how you eat into a week of meals and one shopping list.
colors:
  ground: "#f3f6f2"
  surface: "#ffffff"
  surface-sunk: "#e8eee9"
  line: "#d8e1db"
  line-strong: "#74877d"
  ink: "#14211b"
  ink-muted: "#55645c"
  brand: "#1e8a5e"
  brand-ink: "#156b49"
  deep: "#0b3d2b"
  deep-hover: "#134d38"
  on-deep: "#ffffff"
  on-deep-muted: "#b6c5be"
  one: "#e85d2a"
  glass: "#ffffff80"
  glass-solid: "#ffffff"
  capsule: "#ffffff"
  danger: "#b42318"
  danger-surface: "#fcedea"
  success-surface: "#e3f1e8"
  ground-dark: "#0d1613"
  surface-dark: "#16221d"
  surface-sunk-dark: "#1d2b25"
  line-dark: "#26352e"
  line-strong-dark: "#5c7067"
  ink-dark: "#e6eee9"
  ink-muted-dark: "#9aaba3"
  brand-ink-dark: "#5cc495"
  primary-hover-dark: "#7bd3aa"
  bubble-user-dark: "#1d5a42"
  glass-dark: "#0d1613ad"
  glass-solid-dark: "#0d1613"
  capsule-dark: "#16221d"
  danger-dark: "#ff8a7a"
  danger-surface-dark: "#2a1715"
  success-surface-dark: "#13291f"
typography:
  title-large:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.4375rem"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.01em"
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
    fontSize: "0.8125rem"
    fontWeight: 550
    lineHeight: 1.2
    letterSpacing: "normal"
rounded:
  bubble-tail: "6px"
  field: "14px"
  card: "16px"
  bubble: "18px"
  composer: "22px"
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
    backgroundColor: "{colors.deep}"
    textColor: "{colors.on-deep}"
    rounded: "{rounded.pill}"
    padding: "0 22px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.deep-hover}"
  button-secondary:
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 22px"
    height: "48px"
  button-quiet:
    textColor: "{colors.brand-ink}"
    padding: "0 12px"
    height: "44px"
  send-button:
    backgroundColor: "{colors.one}"
    textColor: "{colors.on-deep}"
    rounded: "{rounded.pill}"
    size: "44px"
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
    padding: "10px 16px"
  bubble-user:
    backgroundColor: "{colors.deep}"
    textColor: "{colors.on-deep}"
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
  pill:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
  title-bar:
    backgroundColor: "{colors.ground}"
    content: "the horizontal logo, 28px tall"
    height: "56px"
  tab-bar:
    backgroundColor: "{colors.glass}"
    backgroundColorDark: "{colors.glass-dark}"
    fallbackColor: "{colors.glass-solid}"
    fallbackColorDark: "{colors.glass-solid-dark}"
    textColor: "{colors.ink}"
    textColorDark: "{colors.ink-dark}"
    activeCapsule: "{colors.capsule}"
    activeCapsuleDark: "{colors.capsule-dark}"
    backdropBlur: "18px"
    typography: "{typography.tab}"
    rounded: "{rounded.pill}"
    height: "64px"
    maxWidth: "440px"
---

# Design System: VIVERI

Living doc: how the interface looks *now*. Tokens live as CSS custom properties at the top of [`src/index.css`](../src/index.css); this file explains them. The decision to adopt this system is [ADR 0021](adr/0021-viveri-identity-and-ui-system.md).

## Overview

**Creative North Star: "Siete en uno" (Seven into One)**

The approved mark is seven dots: six in a V, the week, converging on one tangerine dot, the one list and the one next step. The interface uses that idea as its notation instead of decorating with it. Green and deep green carry the everyday work, and tangerine appears only where there is exactly one thing: the screen you're on, the action that sends, the apex of the mark.

It is a working tool for people planning meals on a phone, at home or in a supermarket aisle, so it reads first as a familiar app: a top bar, a tab bar, a chat, standard controls. The identity lives in the content, not in the navigation:
- the logo at the top of every screen;
- the deep-green bubbles and buttons;
- the tangerine dot;
- the mark as the state glyph;
- a green-tinted ground instead of grey or cream.

The navigation is a neutral glass dock floating over that content ([ADR 0022](adr/0022-glass-navigation-layer.md)): it takes no color of its own, so it never repeats the content's green. The app deliberately avoids the category's wellness look (sage, cream, leaf illustrations) and the AI look (gradients, sparkles).

**Key Characteristics:**
- The app's name on every screen: the approved logo in a light top bar. The dock, not a title, says which section you're in.
- Neutral glass navigation: a floating dock in translucent white (or near-black in dark mode), the only element with depth.
- Tangerine marks "the one" and nothing else.
- Round forms taken from the dots: pills, capsules, a circular send button, soft bubbles.
- One system typeface, a tight scale, 16 px body text.
- Motion only for state: typing, loading, arrival, the active tab.

## Colors

A green-tinted neutral ground, the icon's deep green for the user's words and actions, neutral glass for the navigation, and one tangerine accent, each with a dark-theme counterpart. Contrast was computed for every text pair (all ≥ 4.5:1) and every UI graphic (≥ 3:1) in both themes. The glass was measured on real pixels instead (see [Navigation](#navigation)).

### Primary
- **Deep green** (#0B3D2B): the icon tile's color. The user's chat bubbles, primary buttons in light mode. White on it is 12.2:1.
- **Brand green** (#1E8A5E): the logo's dots and wordmark; focus rings in light mode. Never body text (3.97:1 on the ground).
- **Green ink** (#156B49 light, #5CC495 dark): text-safe green for links and quiet buttons. In dark mode #5CC495 is also the primary button fill, with deep-green text (5.7:1).

### Secondary
- **Tangerine** (#E85D2A): a graphic, never text. The active-tab dot, the send button (white arrow, 3.5:1), the mark's apex.

### Neutral
- **Ground** (#F3F6F2 / #0D1613): the page, the top bar, the chat bar and the splash.
- **Surface** (#FFFFFF / #16221D): cards, assistant bubbles, fields.
- **Sunk surface** (#E8EEE9 / #1D2B25): chips, the status pill, skeletons, the disabled send button.
- **Line** (#D8E1DB / #26352E): hairlines and card borders. **Strong line** (#74877D / #5C7067): field borders and the secondary button outline, ≥ 3:1 against both surfaces.
- **Ink** (#14211B / #E6EEE9) and **muted ink** (#55645C / #9AABA3): text.
- **Danger** (#B42318 on #FCEDEA / #FF8A7A on #2A1715) for errors; **success surface** (#E3F1E8 / #13291F) for the "check your email" panel.
- **Glass** (white at 50% / #0D1613 at 68%): the dock and the chat's composer accessory. **Solid glass** (#FFFFFF / #0D1613) is its opaque fallback. **Capsule** (#FFFFFF / #16221D): the active tab's opaque inner capsule.

### Named Rules
**The One Rule.** Tangerine appears once per region and always means "the one": the current tab, the send action, the apex of the mark. It never colors text, borders, or decoration.

**The Mark Keeps Its Colors Rule.** The logo and the mark are always drawn in their approved colors (green dots, tangerine apex, green wordmark), on light and dark grounds alike, and always on `ground` or `surface`: never on a color field or on glass. No white or recolored wordmark exists; don't invent one.

**The Flat Fill Rule.** Every fill outside the glass is flat and opaque. No gradients, glows or images behind content.

## Typography

**Display Font:** none. The logo carries the brand's lettering.
**Body Font:** system-ui (SF Pro on Apple devices, Roboto on Android, Segoe UI on Windows)

**Character:** one familiar sans for everything, tuned rather than replaced: semibold titles at a slight negative tracking, regular 16 px reading text.

### Hierarchy
- **Title large** (650, 1.75rem, 1.2): the sign-in heading.
- **Headline** (650, 1.4375rem, 1.25): reserved for page headings; no current screen uses it.
- **Title** (650, 1.25rem, 1.3): sheet titles (the health-data dialog). Screens have no visible title: the top bar shows the logo, and the section's name is a screen-reader-only `h1`.
- **Body** (400, 1rem, 1.5; 1.45 in bubbles): messages, values, hints.
- **Label** (550, 0.9375rem): field labels, chips, alerts, profile section headings, and Menu days and List sections (at 1rem, 650).
- **Meta** (400, 0.875rem): definition-list labels above profile values.
- **Caption** (0.8125rem): the status pill, error details, the chat's status line and disclaimer, dates in the chats list, and the List's store tags and menu amounts.
- **Tab** (550, 0.8125rem; 650 when active).

### Named Rules
**The 16 px Floor Rule.** Every text input is at least 16 px, so iOS never zooms the page on focus.

## Layout

- **Shell (every width):**
  - The shell is a full-height grid: the title bar, then the scrolling work area, which runs to the bottom edge of the screen. The dock floats over the work area at every width; there is no side rail.
  - The shell uses `100dvh`, falling back to `100svh`. The viewport sets `interactive-widget=resizes-content`, so on Android the layout shrinks above the keyboard.
- **Dock clearance:**
  - Content scrolls under the dock. Every scroller pads its bottom, and sets `scroll-padding-bottom`, to the dock's clearance: `--dock-clear`, which is the dock's 64 px, its bottom offset, and 16 px of air.
  - In chat, the clearance also includes the composer accessory's height, `--accessory-h`. A `ResizeObserver` measures it, so the last message and any focused control always sit above the glass.
- **Wide screens:**
  - Content stays in a 720px column centered in the window. The chat bar, the messages and the composer accessory align to that column, and the dock stays centered below at most 440px wide.
  - The top bar's logo and the sign-in screen sit at the window's left edge instead, `--edge` from it: 16px, and 32px from 960px up (24px at least on sign-in).
  - Scrolling pages reserve their scrollbar on both edges (`scrollbar-gutter: stable both-edges` on the main area), so the column doesn't drift when content starts to scroll. The chat view opts out, because its message list is the scroller.
- **Spacing:**
  - A 4px base and a 16px gutter.
  - Pages pad 20px on top and the dock's clearance at the bottom.
  - Profile groups are 28px apart, and headings sit closer to their content than to the group above.
- **Safe areas:** `--safe-top/right/bottom/left` wrap `env(safe-area-inset-*)`.
  - The title bar pads the top inset, and the gutters pad the side insets.
  - The dock sits `max(12px, bottom inset)` above the bottom edge and 12px plus the side insets from each side.
- **Keyboard:**
  - On touch screens (`pointer: coarse`, at any width), the dock is hidden only while the on-screen keyboard is up *and* focus is in the composer, so the keyboard doesn't stack on it. The composer accessory then drops to 8px above the keyboard. With a mouse or trackpad the rule never applies, so shrinking a desktop window never hides the dock.
  - `useKeyboardOpen` in `src/App.tsx` reads the visual viewport (ignoring zoom, resetting on rotation) and sets `data-keyboard="open"` on the shell.
  - When the keyboard goes down, the dock comes back even if the composer keeps focus.
  - The send button keeps focus in the textarea on tap, so the keyboard stays up and nothing shifts under the finger.

## Elevation & Depth

Flat content, glass navigation ([ADR 0022](adr/0022-glass-navigation-layer.md)).

- **Content** (cards, bubbles, fields, chips, the title bar) is flat. Depth comes from tone (ground vs. white surface vs. sunk surface) and 1px lines, never from shadows. Each element declares one edge: a border or a fill change, never both plus a shadow.
- **The navigation layer is the one exception.** The phone dock and the chat's composer accessory are glass:
  - a translucent tint;
  - an 18px `backdrop-filter` blur (with the `-webkit-` prefix, and no `saturate()`);
  - a 1px light edge;
  - one soft two-layer shadow.
  
  Nothing else gets a blur or a shadow.
- **Opaque fallback.** The glass turns into solid glass (#FFFFFF light, #0D1613 dark), with no blur:
  - when `backdrop-filter` isn't supported (`@supports`);
  - with `prefers-contrast: more`, which also adds a 1px strong-line border;
  - with `prefers-reduced-transparency: reduce`.
  
  `prefers-reduced-transparency` works in Chromium 118+: Chrome, Edge, Chrome Android and Samsung Internet. Firefox supports it only behind a preference, and Safari not at all; there the rule never triggers (MDN compat data, checked 2026-10-17).
- **Forced colors** (`forced-colors: active`): no blur and no shadow, system colors, and a 1px `CanvasText` border. The active capsule gets a `Highlight` outline.

## Shapes

Round, from the dots. Pills (999px) for buttons, chips, the status pill and the single-line composer; a 44px circle for send; 18px bubbles with a 6px "tail" corner on the speaker's side; 16px cards; 14px fields; a 64px pill for the dock, with pill-shaped items and active capsule; 44px circles for the microphone and the List's − and + steps.

## Components

### Buttons
- **Shape:** pill (999px), 48px tall (52px on sign-in), 600 weight.
- **Primary:** deep green with white text (light); green #5CC495 with deep-green text (dark). Hover darkens or lightens one step; press scales to 0.98.
- **Secondary:** transparent, with a 1px strong-line inset outline. Used for sign-out, so leaving is never the loudest action.
- **Quiet:** underlined green-ink text, 44px tall ("Usar otro email").
- **Disabled:** 55% opacity.
- **Busy:** full color, a progress cursor, a changed label ("Enviando…") and `aria-busy`. Busy means working, not unavailable.

### Top bar
- Every signed-in screen opens with the app's name: the approved horizontal logo (`src/assets/viveri-logo.svg`, `alt="VIVERI"`), 28px tall, on `ground`, at the window's left edge (`--edge`), with a hairline under it. It's opaque and flat.
- The section's name (Chat, Menú, Lista, Perfil) is the screen's `h1`, visible only to screen readers; the dock's active capsule and dot show it to everyone else.

### Sign-in
- At the window's left edge at every width: the logo (44px) in the corner, then a column of at most 400px with the title "Ingresar", Google's button, an "o con tu email" divider (a hairline on each side), the email hint and the form.
- **Google's button** is Google's own (Google Identity Services, [ADR 0023](adr/0023-google-sign-in-button.md)): we choose only its theme (outline, or dark when the system is dark), large size, the pill shape that matches our buttons, "Continuar con Google" and the `es-419` locale. Its 44px slot is reserved so the form doesn't jump while Google's script loads. Without a client ID it isn't shown, and neither is the divider.
- A failed Google sign-in shows the inline alert under the button, and the email form stays available.

### Send button
A 44px tangerine circle with a white up arrow. Disabled: sunk surface with a muted arrow. Its accessible name is "Enviar".

### Chat
- **Composer accessory (every width):**
  - The composer floats as a glass capsule 8px above the dock. It holds the field, the microphone (where the browser has speech recognition), the send button and the disclaimer.
  - It is as wide as the dock on phones, and on wide screens it grows up to the 720px content column (`--accessory-max`) while the dock stays at most 440px.
  - It belongs to the navigation layer: the same glass, fallbacks and ink focus ring. The field inside it stays an opaque surface, so its placeholder keeps its contrast.
  - Only the Chat has an accessory.
- **Disclaimer:**
  - One caption line under the field, always visible: "No reemplaza a tu nutricionista." It sits on glass, so it is ink.
  - It continues with an underlined "Tus datos de salud" link. The link opens a dialog explaining that health-data consent is coming ("Muy pronto") and saying only what's true today: what you tell the chat stays saved in your account.
- **Intent cards (empty chat):**
  - Below the welcome bubble, four cards in the user's voice, the only things the chat does today: "Armemos mi plan desde cero", "Tengo un plan de mi nutricionista", "Hay cosas que no puedo comer" and "Tengo poco tiempo para cocinar".
  - They are surface cards (16px radius, 1px line) in a 2 × 2 grid, sitting low near the composer, and tapping one sends its text as your message.
  - They don't promise anything the product doesn't do yet: no plans, prices or numbers.
- **Status line:**
  - While a reply is pending, a muted caption line under the last bubble says "Armando la respuesta…"; once words arrive, it says "Escribiendo…".
  - It disappears when the reply stops streaming (the turn may still be saving), and is a `role="status"` region.
  - The waiting bubble still shows the animated mark.
- **Chat bar:** above the conversation, on the ground and aligned to the content column: "Chats" (or "Volver") on the left, "Nuevo chat" on the right, both green-ink links. Disabled while a turn is saving.
- **Chats list:** replaces the conversation when open. Rows of title and date, 48px tall, hairlines between them; the open chat is at weight 650. It keeps the same clearance as the messages. If the list can't be read, it says so with a "Reintentar" of its own; a conversation that can't open shows its alert in the conversation.
- **Scroll padding:** the page area, the messages and the chats list also pad their top by 8px when scrolling to a focused control, so its focus ring isn't cut under the title bar.
- **Menu card:** when the chat saves or shows the week, it appears under that reply as an assistant bubble with the days and their meals, and a secondary "Ver menú" button.
- **Voice:** where the browser has speech recognition, a 44px microphone circle sits between the field and send, in ink. While listening it fills with the primary color and pulses slowly; tangerine stays on send.

### Menu
- A page (20px top, dock clearance at the bottom). On top, one primary "Confirmar menú" button, busy as "Confirmando…", or the muted "Menú confirmado." line once confirmed. Focus moves to that line, since the button it replaces is gone.
- Loading shows the page skeleton; with no menu yet, the empty state; a failed load, the inline alert.
- Each day is a section: its name (capitalized, 1rem/650) with a green-ink "Cambiar" link on the right. Each meal is a row that opens: the slot in muted ink, the recipe, then its ingredients, short instructions and its own "Cambiar".
- "Cambiar" takes you to the chat with a draft ready to finish.

### List
- A page. On top, when the list is priced, a flat card "Dónde comprar": the recommended store or split (radio buttons when there's a choice), the saving, the total per store, and the muted note that the prices are examples with their date ([ADR 0019](adr/0019-example-prices-until-matched.md)).
- Then the hint, and secondary "Compartir" and "Copiar" buttons with a "Lista nueva" link.
- Sections (Frutas y verduras, Almacén…) list items in rows with hairlines: a checkbox (brand green), the name (it wraps beside the checkbox), a store or "No encontrado online" tag on its own line, the amount to buy on the right with what the menu uses under it, and 44px − and + circles.
- Crossed-out items (you have them at home) turn muted and struck through.
- Loading shows the page skeleton; with no menu yet, the empty state; before the menu is confirmed, one line and a primary "Ver menú" button; a failed load, the inline alert.

### Chips
Sunk-surface pills (6px 14px) listing what the chat saved: can't eat, dislikes, likes, wants. Read-only; long items wrap.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** surface.
- **Border:** 1px line, no shadow.
- **Internal Padding:** 16px horizontally; definition-list rows are 12px tall with hairlines between them.

### Inputs / Fields
- **Style:** surface fill, 1px strong-line border, 14px radius, 52px tall; the label sits above at 0.9375rem/550.
- **Composer:** the same field as a 22px-radius pill that grows with the text up to about six lines (`field-sizing: content`, with a JS fallback), then scrolls.
- **Focus:** a 2px brand-green ring (`:focus-visible`), except inside the navigation layer, where it is ink (see [Navigation](#navigation)). On fields it's drawn over the field's own border (offset −1px), so there's one ring, not two; other controls use a 2px offset. The composer hides its scrollbar so it never paints over the rounded corner.

### Navigation
- **Dock (every width):**
  - **Shape and placement:** a floating glass capsule, 64px tall and at most 440px wide, centered, with four equal items (a 24px icon and a 13px label). It doesn't compact on scroll, and the labels never disappear.
  - **No rail:** the dock looks the same on a phone and a desktop, and there's no side rail. The logo is in the top bar instead.
  - **Labels:** every item is ink (#14211B / #E6EEE9) at weight 550; the active one is at 650.
  - **Active item:** an opaque inner capsule (#FFFFFF / #16221D) with a 6px tangerine dot above the icon, plus `aria-current="page"`. The dot always sits inside the capsule, never on the glass.
  - **Why three signals:** against glass over dark content, the capsule alone is too faint. So "active" is told by the capsule, the dot and the weight together.
  - **Focus:** inside the navigation layer, keyboard focus is a 2px ink ring (#14211B / #E6EEE9), drawn on the item's outer 2px. The brand-green ring doesn't reach 3:1 on this glass.
  - **Tint, measured:** white at 50% in light mode and #0D1613 at 68% in dark mode. Both were measured on real pixels in headless Chrome ([v3 plan, results](plans/2026-10-17-glass-dock-living-color.md#results)). The dock's own ink was hidden, and the glass was captured over uniform worst-case fills and over the real chat and profile scrolled beneath it.
    - The worst cases come from the fills: ink in light mode, white in dark mode.
    - Labels and icons: ≥ 5.11:1 (light) and ≥ 5.35:1 (dark).
    - The ink ring against its neighbors: ≥ 3.50:1 and ≥ 3.31:1.
    - The dot on the capsule: 3.48:1 and 4.71:1.
    - The disclaimer: ≥ 5.04:1 and ≥ 5.35:1.
    - The tint is the lowest measured value that keeps at least 10% margin on every threshold. Dark 65% left the ring at 3.13:1.
  - **Hover** (pointer devices): inactive items get a half-strength capsule wash.
  - **While the chat saves a turn**, the items are disabled, since leaving would hide that turn. The other items fade to 55%; the current one keeps its capsule and dot.

### Alerts and states
- **Inline alert:** danger text on the danger surface, a 20px alert icon, 14px radius (`Alert` in `src/ui.tsx` when there's nothing to do but read it). Below the message goes either a muted detail line (the provider's raw message on sign-in) or a quiet "Reintentar" button when the failed load can be retried (chats, profile).
- **Skeletons:** sunk-surface shapes in the layout of what's loading (bubbles, definition rows; `PageSkeleton` in `src/ui.tsx` for Menu and List), with a slow opacity pulse, inside a `role="status"` region with a screen-reader label.
- **Not available yet:** something in the product plan but not in the app yet shows a "Muy pronto" pill and says only what's true today. Today that's the health-data consent dialog.
- **Empty screens** (Profile, Menu, List; `EmptyState` in `src/ui.tsx`): the mark, one line of copy, and an "Ir al chat" primary button.
- **Results that appear in place** (the chat's status line, "Menú confirmado.", "Lista copiada.") live in a `role="status"` element that is always mounted, so screen readers announce each change of its text.

### The mark (signature component)
`Mark` in [`src/ui.tsx`](../src/ui.tsx) draws the approved icon's seven circles, with unchanged centers and radii, cropped to the dots. It is the system's state glyph: inside an assistant bubble while a reply hasn't started (with the visible status line below it), on the splash after a 400ms delay, and static on the empty profile. The `converge` animation lights the dots from the outer pair inward to the apex, 1.2s per loop, 0.15s apart.

### Icons
Drawn for this app on a 24px grid: 1.75px round strokes, `currentColor` (the send arrow uses a 2.25px stroke). Chat, Menú (a calendar with three dots), Lista (a checklist), Perfil, send, alert, mail, and the microphone (drawn inline in `src/Chat.tsx`; while listening it becomes a filled stop square).

### Logo and app icons
- `src/assets/viveri-logo.svg` and `public/favicon.svg` are byte-for-byte copies of the approved `recommended-horizontal.svg` and `recommended-icon.svg` (from the logo exploration, `C:\prompt-lab\assets\logo-app\v1\`).
- `public/icons/icon-180.png`, `icon-192.png` and `icon-512.png` were rendered from that icon SVG with headless Microsoft Edge at 1× scale. Each PNG carries its origin in a `tEXt` chunk. The 512 also serves as the maskable icon; the mark sits inside the 40% safe circle.
- The 16px favicon is the full icon; a simplified small-size mark doesn't exist yet.

### Motion
| Name | Value | Use |
| --- | --- | --- |
| `--dur-fast` | 120ms | press feedback, color changes |
| `--dur` | 200ms | fades |
| `--ease` | cubic-bezier(0.2, 0.7, 0.2, 1) | everything that isn't a loop |
| `rise-in` | 160ms, 6px | a new bubble arriving |
| `dot-in` | 180ms scale | the active-tab dot |
| `converge` | 1.2s loop | the mark while waiting |
| `pulse` | 1.4s loop (1.2s on the microphone) | skeletons, listening |

`prefers-reduced-motion: reduce` turns every animation and transition off; the mark then shows all seven dots, static.

## Do's and Don'ts

### Do:
- **Do** take colors, sizes and radii from the tokens in `src/index.css`; add a token before adding a one-off value.
- **Do** keep tangerine for "the one" (see The One Rule): the active-tab dot, send and the mark's apex. Never a fill, a capsule or a call to action.
- **Do** reserve the dock's clearance (`--dock-clear`, plus `--accessory-h` in chat) at the bottom of any new scrolling view, as padding and `scroll-padding-bottom`.
- **Do** re-measure the glass on real pixels, against the worst content beneath, after changing the tint, the dock colors or the content colors.
- **Do** give every new screen its loading, empty and error states, with the skeleton, empty-state and alert patterns above.
- **Do** put new copy in `src/strings.ts`, in Rioplatense Spanish.
- **Do** check new screens with the dev fixture ([development.md](development.md#testing)) at 360px, 390px and 1280px, in light and dark.

### Don't:
- **Don't** recolor, redraw or rearrange the mark or the wordmark, or set "VIVERI" in a font as a stand-in logo.
- **Don't** use shadows or blur for depth outside the navigation layer, or stack a border, a fill change and a shadow on one element.
- **Don't** put glass anywhere but the dock and the chat's composer accessory: not on the title bar, cards or sheets.
- **Don't** use gradients, or put the logo or the mark on anything but `ground` or `surface`.
- **Don't** give any screen but the Chat an accessory, or float a second action bar over the dock: a screen's main action goes in its content.
- **Don't** use muted ink on glass; every label on glass is ink.
- **Don't** add a display typeface; the logo is the brand's lettering.
- **Don't** show prices or savings the product doesn't compute, or without saying what they are: today's example prices always carry their "no son reales" note and date ([ADR 0019](adr/0019-example-prices-until-matched.md)). No medical claims.
- **Don't** make something look available before the product has it.
- **Don't** add a CSS framework or a component library for styling.
