---
name: VIVERI
description: Phone-first app that turns a conversation about how you eat into a week of meals and one shopping list.
colors:
  ground: "#f8f9f8"
  surface: "#ffffff"
  surface-sunk: "#e9f2ec"
  line: "#e3e8e4"
  line-strong: "#74877d"
  ink: "#0f1713"
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
    fallbackColor: "{colors.glass-solid}"
    textColor: "{colors.ink}"
    activeCapsule: "{colors.capsule}"
    backdropBlur: "18px"
    typography: "{typography.tab}"
    rounded: "{rounded.pill}"
    height: "64px"
    maxWidth: "440px"
---

# Design System: VIVERI

Living doc: how the interface looks *now*. Tokens live as CSS custom properties at the top of [`src/index.css`](../src/index.css); this file explains them. The decision to adopt this system is [ADR 0025](adr/0025-viveri-identity-and-ui-system.md).

## Overview

**Creative North Star: "Siete en uno" (Seven into One)**

The approved mark is seven dots: six in a V, the week, converging on one tangerine dot, the one list and the one next step. In the logo the mark is the first letter, the V of VIVERI ([ADR 0035](adr/0035-mark-is-the-first-v.md)). The interface uses that idea as its notation instead of decorating with it. Green and deep green carry the everyday work, and tangerine appears only where there is exactly one thing: the screen you're on, the action that sends, the apex of the mark.

It is a working tool for people planning meals on a phone, at home or in a supermarket aisle, so it reads first as a familiar app: a top bar, a tab bar, a chat, standard controls. The identity lives in the content, not in the navigation:
- the logo at the top of every screen;
- the deep-green bubbles and buttons;
- the tangerine dot;
- the mark as the state glyph;
- a near-white ground with a faint green tint, and mint chips, instead of grey or cream.

The navigation is a neutral glass dock floating over that content ([ADR 0026](adr/0026-glass-navigation-layer.md)): it takes no color of its own, so it never repeats the content's green. The app deliberately avoids the category's wellness look (sage, cream, leaf illustrations) and the AI look (gradients, sparkles).

**Key Characteristics:**
- The app's name on every screen: the approved logo in a light top bar. The dock, not a title, says which section you're in.
- Neutral glass navigation: a floating dock in translucent white, the only element with depth.
- Tangerine marks "the one" and nothing else.
- Round forms taken from the dots: pills, capsules, a circular send button, soft bubbles.
- One system typeface, a tight scale, 16 px body text.
- Motion only for state: typing, loading, arrival, the active tab.

## Colors

A near-white ground with a faint green tint, the icon's deep green for the user's words and actions, neutral glass for the navigation, and one tangerine accent. The app has one theme, the light one ([ADR 0033](adr/0033-light-theme-only.md)). The neutrals were cleaned up on 2026-10-18 ([ADR 0031](adr/0031-cleaner-neutral-palette.md)); the brand colors didn't change. Contrast was computed for every text pair (all ≥ 4.5:1) and every UI graphic (≥ 3:1). The glass was measured on real pixels instead (see [Navigation](#navigation)).

### Primary
- **Deep green** (#0B3D2B): the icon tile's color. The user's chat bubbles, primary buttons in light mode. White on it is 12.2:1.
- **Brand green** (#1E8A5E): the logo's dots and wordmark; focus rings in light mode. Never body text (3.97:1 on the ground).
- **Green ink** (#156B49): text-safe green for links and quiet buttons.

### Secondary
- **Tangerine** (#E85D2A): a graphic, never text. The active-tab dot, the send button (white arrow, 3.5:1), the mark's apex.

### Neutral
- **Ground** (#F8F9F8 / #0B0F0D): the page, the top bar, the chat bar and the splash.
- **Surface** (#FFFFFF / #141A17): cards, assistant bubbles, fields.
- **Sunk surface** (#E9F2EC, a mint wash / #1C2420): chips, the status pill, skeletons, the disabled send button.
- **Line** (#E3E8E4 / #252D29): hairlines and card borders. **Strong line** (#74877D / #5F6F67): field borders and the secondary button outline, ≥ 3:1 against both surfaces.
- **Ink** (#0F1713 / #E9EFEB) and **muted ink** (#55645C / #9BA9A2): text.
- **Danger** (#B42318 on #FCEDEA / #FF8A7A on #2A1715) for errors; **success surface** (#E3F1E8 / #13291F) for the "check your email" panel.
- **Glass** (white at 50% / #0B0F0D at 68%): the dock and the chat's composer accessory. **Solid glass** (#FFFFFF / #0B0F0D) is its opaque fallback. **Capsule** (#FFFFFF / #141A17): the active tab's opaque inner capsule.

### Named Rules
**The One Rule.** Tangerine appears once per region and always means "the one": the current tab, the send action, the apex of the mark. It never colors text, borders, or decoration.

**The Mark Keeps Its Colors Rule.** The logo and the mark are always drawn in their approved colors (green dots, tangerine apex, green wordmark), and always on `ground` or `surface`: never on a color field or on glass. No white or recolored wordmark exists; don't invent one.

**The Flat Fill Rule.** Every fill outside the glass is flat and opaque. No gradients, glows or images behind content.

## Typography

**Display Font:** none. The logo carries the brand's lettering.
**Body Font:** system-ui (SF Pro on Apple devices, Roboto on Android, Segoe UI on Windows)

**Character:** one familiar sans for everything, tuned rather than replaced: semibold titles at a slight negative tracking, regular 16 px reading text.

### Hierarchy
- **Title large** (650, 1.75rem, 1.2): the sign-in heading.
- **Headline** (650, 1.4375rem, 1.25): reserved for page headings; no current screen uses it.
- **Title** (650, 1.25rem, 1.3): sheet titles (the health-data dialog), the Menu's day name and the Profile's card titles. Screens have no visible title: the top bar shows the logo, and the section's name is a screen-reader-only `h1`.
- **Body** (400, 1rem, 1.5; 1.45 in bubbles): messages, values, hints.
- **Label** (550, 0.9375rem): field labels, chips, alerts, and List sections (at 1rem, 650).
- **Meta** (400, 0.875rem): the sign-in divider and the notes under the List's order button; the small button borrows its size.
- **Caption** (0.8125rem): the status pill, error details, the chat's status line and disclaimer, dates in the chats list, the List's store tags and menu amounts, and the Profile's labels and switch hint.
- **Tab** (550, 0.8125rem; 650 when active).

### Named Rules
**The 16 px Floor Rule.** Every text input is at least 16 px, so iOS never zooms the page on focus.

## Layout

- **Shell (every width):**
  - The shell is a full-height grid: the top bar, then the scrolling work area, which runs to the bottom edge of the screen. The dock floats over the work area at every width; there is no side rail.
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
  - Profile cards are 16px apart.
- **Safe areas:** `--safe-top/right/bottom/left` wrap `env(safe-area-inset-*)`.
  - The top bar pads the top inset, and the gutters pad the side insets.
  - The dock sits `max(12px, bottom inset)` above the bottom edge and 12px plus the side insets from each side.
- **Keyboard:**
  - On touch screens (`pointer: coarse`, at any width), the dock is hidden only while the on-screen keyboard is up *and* focus is in the composer, so the keyboard doesn't stack on it. The composer accessory then drops to 8px above the keyboard. With a mouse or trackpad the rule never applies, so shrinking a desktop window never hides the dock.
  - `useKeyboardOpen` in `src/App.tsx` reads the visual viewport (ignoring zoom, resetting on rotation, and taking a height change without a touch screen (`pointer: coarse`) or a focused text field as the window resizing, not the keyboard) and sets `data-keyboard="open"` on the shell.
  - When the keyboard goes down, the dock comes back even if the composer keeps focus.
  - The send button keeps focus in the textarea on tap, so the keyboard stays up and nothing shifts under the finger.

## Elevation & Depth

Flat content, glass navigation ([ADR 0026](adr/0026-glass-navigation-layer.md)).

- **Content** (cards, bubbles, fields, chips, the top bar) is flat. Depth comes from tone (ground vs. white surface vs. sunk surface) and 1px lines, never from shadows. Each element declares one edge: a border or a fill change, never both plus a shadow.
- **The navigation layer is the one exception.** The phone dock and the chat's composer accessory are glass:
  - a translucent tint;
  - an 18px `backdrop-filter` blur (with the `-webkit-` prefix, and no `saturate()`);
  - a 1px light edge;
  - one soft two-layer shadow.
  
  Nothing else gets a blur or a shadow.
- **Opaque fallback.** The glass turns into solid glass (#FFFFFF), with no blur:
  - when `backdrop-filter` isn't supported (`@supports`);
  - with `prefers-contrast: more`, which also adds a 1px strong-line border;
  - with `prefers-reduced-transparency: reduce`.
  
  `prefers-reduced-transparency` works in Chromium 118+: Chrome, Edge, Chrome Android and Samsung Internet. Firefox supports it only behind a preference, and Safari not at all; there the rule never triggers (MDN compat data, checked 2026-10-17).
- **Forced colors** (`forced-colors: active`): no blur and no shadow, system colors, and a 1px `CanvasText` border. The active capsule gets a `Highlight` outline.

## Shapes

Round, from the dots. Pills (999px) for buttons, chips, the status pill and the single-line composer; a 44px circle for send; 18px bubbles with a 6px "tail" corner on the speaker's side; 16px cards; 14px fields; a 64px pill for the dock, with pill-shaped items and active capsule; a 44px circle for the microphone; a 56px circle for the profile's initial; 32px circles for the List's − and + steps, with a 44px target.

## Components

### Buttons
- **Shape:** pill (999px), 48px tall (52px on sign-in), 600 weight.
- **Primary:** deep green with white text. Hover darkens one step; press scales to 0.98.
- **Secondary:** transparent, with a 1px strong-line inset outline. Used for sign-out, so leaving is never the loudest action.
- **Small:** a secondary pill 40px tall with 0.875rem text, for an action beside bigger buttons (the List's "Restablecer lista").
- **Quiet:** underlined green-ink text, 44px tall ("Usar otro email").
- **Disabled:** 55% opacity.
- **Busy:** full color, a progress cursor, a changed label ("Enviando…") and `aria-busy`. Busy means working, not unavailable.

### Top bar
- Every signed-in screen opens with the app's name: the approved horizontal logo (`src/assets/viveri-logo.svg`, `alt="VIVERI"`), 28px tall, on `ground`, at the window's left edge (`--edge`), with a hairline under it. It's opaque and flat.
- The section's name (Chat, Menú, Lista, Perfil) is the screen's `h1`, visible only to screen readers; the dock's active capsule and dot show it to everyone else.

### Sign-in
- At the window's left edge at every width: the logo (44px) in the corner, then a column of at most 400px with the title "Ingresar", Google's button, an "o con tu email" divider (a hairline on each side), the email hint and the form.
- **Google's button** is Google's own (Google Identity Services, [ADR 0027](adr/0027-google-sign-in-button.md)): we choose only its outline theme, large size, the pill shape that matches our buttons, "Continuar con Google" and the `es-419` locale. Its 44px slot is reserved so the form doesn't jump while Google's script loads. Without a client ID it isn't shown, and neither is the divider.
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
  - Below the welcome bubble, four cards in the user's voice, four ways to start what the chat does: "Armemos mi plan desde cero", "Tengo un plan de mi nutricionista", "Hay cosas que no puedo comer" and "Tengo poco tiempo para cocinar".
  - They are surface cards (16px radius, 1px line) in a 2 × 2 grid, sitting low near the composer, and tapping one sends its text as your message.
  - They only promise what the chat does today (a plan and its menu, your restrictions, your time) and never savings, real prices or calories.
- **Status line:**
  - While a reply is pending, a caption line under the last bubble says what the chat is doing: "Armando la respuesta…" until the chat function reports a step, then that step: thinking, writing, or the tool it's calling ("Buscando los mejores precios…"). Labels: `t.chat.steps` in [`src/strings.ts`](../src/strings.ts) ([ADR 0029](adr/0029-chat-streams-its-steps.md)).
  - Each new step fades in, and a band of ink sweeps across the muted words (`shimmer`), as other AI chats do. Never lighter than the muted caption.
  - It disappears when the reply stops streaming (the turn may still be saving), and is a `role="status"` region.
  - It keeps one line of height even when empty (`min-height: 1.5em`), so it coming and going moves nothing under the scroll position.
- **Streaming text:**
  - The reply's text is shown at a steady pace, not as each network chunk lands (`paceText` in [`src/pace.ts`](../src/pace.ts)): every animation frame reveals an eighth of what's waiting, at least one character. A burst spreads over a few frames and a trickle still moves. It shows everything at once in a hidden tab and with reduced motion, and the stored turn replaces the bubbles only once the text has finished showing.
  - The list follows the end while the reply grows, in a layout effect so the text and the scroll move in the same frame. Scroll up to read and it stops following; sending a message or opening a chat follows again.
  - The waiting bubble still shows the animated mark.
- **Chat bar:** above the conversation, on the ground and aligned to the content column: a chats icon (two bubbles) on the left that opens and closes the list of chats, tinted while the list is open, and a + on the right for a new chat. Both are 44px round green-ink icon buttons, named "Chats" and "Nuevo chat" for screen readers, and muted while a turn is saving.
- **Chats list:** replaces the conversation when open. Rows of title and date, 48px tall, hairlines between them; the open chat is at weight 650. It keeps the same clearance as the messages. If the list can't be read, it says so with a "Reintentar" of its own; a conversation that can't open shows its alert in the conversation.
- **Scroll padding:** the page area, the messages and the chats list also pad their top by 8px when scrolling to a focused control, so its focus ring isn't cut under the top bar.
- **Menu card:** when the chat saves or shows the menu, it appears under that reply as a card (not a bubble: a bubble's tail belongs to a speaker). Up to 28rem wide, surface fill, 1px line, 16px radius, with the usual `rise-in`.
  - **Header:** a 32px sunk-surface circle with the Menú icon, "Tu menú" at 650, and a pill on the right with the length ("7 días").
  - **Rows:** one per day in saved order, under hairlines like the Menu tab's: the day's first three letters in a muted 2.5rem column, and its meals in ink, joined with " · " and clamped to two lines. The tab has the whole menu; screen readers get the whole day name.
  - **Footer:** a secondary "Ver menú" pill with a trailing arrow (the chevron, turned).
  - Nothing is colored: the look comes from the hierarchy, the spacing and the icon circle. Each successful save adds one card; a turn that only shows the menu adds at most one, and none after a save in that turn (rules in [architecture.md](architecture.md#data-flow)).
- **List card:** when the chat shows or changes the list, it appears under the reply as a card like the menu card (same width, line, radius, header and button), with the price first. It's drawn live from the saved menu, so only the latest one shows ([ADR 0022](adr/0022-list-follows-the-menu.md)).
  - **Header:** the sunk circle with the Lista icon, "Tu lista", and a pill with how many products are left to buy.
  - **Price block:** the chosen store's icon (two when the buy is split), the total at 1.5rem/650 in tabular figures, "Todo en Géant" or "Géant y Disco" under it, and what it comes to per day in muted caption type. Under that, the budget line in plain ink (over budget is announced, but it isn't an error, so no alert). When no one store has the whole list: that sentence, and each store's total in muted type. Until the prices are read, or when they can't be or the menu is old, one muted line takes its place.
  - **Sections:** one row per section with products left, under hairlines: the name on the left, the count on the right in muted tabular figures. The items themselves are in the List tab.
  - **Note and button:** a muted note with how many products weren't found and the prices' date, then the secondary "Ver lista" pill with the arrow. With nothing left to buy it says so instead of the price and the sections.
- **Voice:** where the browser has speech recognition, a 44px microphone circle sits between the field and send, in ink. While listening it fills with the primary color and pulses slowly; tangerine stays on send.

### Menu
- A page (20px top, dock clearance at the bottom). There's no confirm step: the list follows the menu ([ADR 0022](adr/0022-list-follows-the-menu.md)).
- Loading shows the page skeleton; with no menu yet, the empty state; a failed load, the inline alert.
- One day at a time ([ADR 0032](adr/0032-menu-shows-one-day-at-a-time.md)): a day strip over the day's card.
  - **Day strip** (only when the menu has more than one day): a segmented control of native radios in a sunk-surface pill track (3px padding, 46px segments). Each segment is the day's first three letters (Lun, Mar, Mié…); the radio's accessible name is the whole day, and a screen-reader legend names the group. Saved order, never sorted. The selected day is filled with the primary color (deep green) with bold text. The arrow keys move between days. It opens on the first day, since the menu starts tomorrow and there's no "today" in it. In forced colors the selected day uses `Highlight`. Not tangerine: that's the dock's dot, and two on screen would break The One Rule.
  - **Day card:** a surface card with the day's name at the Title size (capitalized) and each meal as a row under a hairline: the slot in caption type, the recipe at 1rem/550, and a chevron that turns when the meal is open (64px tall, so it's an easy target). Meals are native `<details>` with a shared `name`, so opening one closes the others where the browser supports it.
  - **An opened meal:** "Ingredientes" as a plain list (name left, amount right in muted tabular figures), "Cómo se hace", and a secondary "Cambiar este plato" button with the chat icon. From 640px the ingredients and the instructions sit in two columns. It fades in over `--dur`.
  - **"Cambiar el martes"** is a secondary button under the card. At most two "Cambiar" buttons are on screen. "Cambiar" takes you to the chat with a draft ready to finish.
  - Switching days replays the page fade-in on the card (it's keyed by day). The accordion's height isn't animated.
- With the numbers switch on ([ADR 0021](adr/0021-numbers-switch-in-the-profile.md)), the day's total goes under its name and each meal's macros under its recipe, in muted caption type with tabular figures. Off by default: the app talks about meals, not numbers.

### List
- A page. On top, when the list is priced from the products the chat picked ([ADR 0024](adr/0024-agent-builds-the-menu-from-real-products.md)), three supermarket tabs ([ADR 0034](adr/0034-list-shows-one-store-at-a-time.md)):
  - three equal cards in a row, each a button with `aria-pressed`: the store's icon at 40px ([Store icons](#store-icons)), its name, its total in 650 weight, and either the "Recomendado" pill or "N productos no encontrados" in caption type;
  - under them, when two stores beat one, the cheapest split ([ADR 0037](adr/0037-list-shows-the-cheapest-split.md)): the same kind of button across the whole width, in one line: both icons at 40px, "Géant y Ta-Ta", and its total at the right edge. No pill;
  - the selected one trades its line for a 2px primary edge;
  - under them, for the selected store or split: what its total comes to per day (menus of 2 days or more), the budget line in plain ink (over budget is announced, but it isn't an error, so it doesn't use the alert), the savings card when it's the recommended store or the split, and the muted note with the date the prices were read.
  - **Savings card:** a small card (up to 22rem, the usual line and radius, no color): "Ahorrás $ 11" at 1.25rem/650 with "frente al promedio de los súper", then under a hairline "Unos $ 47 al mes" and a caption saying it's this menu repeated for a month at today's prices. The month is the saving × 30 ÷ the menu's days, rounded: an estimate, and it says so.
- While the prices load, or for a menu saved before real products, a card holds one muted line instead. If they can't be read, the inline alert takes its place.
- Then the hint, and one row of four small pills (40px, the same size), wrapping when the width asks for it:
  - secondary "Compartir" and "Copiar", and "Restablecer lista" when something is marked (it asks before clearing every "ya tengo");
  - at the right edge, the primary "Pedir" with the store's icon at 24px, so nobody has to scroll to reach it. It's the same button as under the list (a link for Ta-Ta; disabled with "Muy pronto" for Disco and Géant), and its accessible name is the whole "Pedir ahora en {store}". On a phone the first three share a line and "Pedir" goes to the right of the next; from about 480px all four share one. On the split, one "Pedir" per store, side by side.
- Sections (Frutas y verduras, Almacén…) list items in rows with hairlines, in two columns:
  - **Left:** a checkbox (brand green) and the name (it wraps beside the checkbox); under it, in caption type, "No encontrado online", "No está en {store}", or the product to buy at the selected store ("Boniato 1 kg · Géant"), linked to its page: muted ink, underlined; then "(menú: 1,75 kg)" when what's bought differs from what the menu uses; and under that the control, small − and + circles (32px, with an invisible 44px target) with the amount between them, aligned with the name.
  - **The amount** is what the cart adds, in units of the selected store ("2 × 1 kg", "3 × 250 g"), and the catalog's pack where there is no price.
  - **Right:** the line's price in 650 weight and tabular figures; "$ 0", muted and not struck through, when the item is crossed out or lowered to zero (once the prices are read); empty when there is no price.
  - **Unavailable lines** (the selected store doesn't sell it, or none does: the ones with "No está en {store}" or "No encontrado online") are grayed out: the name goes muted and the checkbox and the − amount + control fade; the note stays readable.
  - **What the taps do:** with a price, − and + move by one unit of sale of the selected store (a pack, a piece, a tray), so every tap changes what's paid and the list adds up to what the cart adds ([ADR 0036](adr/0036-list-steps-by-unit-of-sale.md)). Without a price they move by the food's own step.
- Under the list, "Pedir ahora en {store}": a primary button with the store's icon at 28px, at the right edge ([ADR 0030](adr/0030-cart-filling-tata-link-gdu-team-extension.md)). Its notes stay on the left, under it. On the split, one per store, one under the other, each with only what goes there.
  - For Ta-Ta it's a link that opens the cart in another tab. Muted lines under it give how many products and the estimated total, then what stays out, one line per reason. After a tap, one muted line appears in an always-mounted `role="status"`.
  - For Disco and Géant it's disabled, with the "Muy pronto" pill beside it and one muted line.
- Crossed-out items (you have them at home) turn muted and struck through.
- Loading shows the page skeleton; with no menu yet, the empty state; a failed load, the inline alert.

### Profile
A page ([ADR 0038](adr/0038-profile-as-cards.md)), built like the Menu: cards with the title inside, and nothing loose on the ground but the header and the sign-out button.
- **Header:** a 56px sunk-surface circle with the email's first letter in green ink at 1.375rem/650 (the Perfil icon without an email), then the email at 650. It's there in every state, since the session is, and the loading, error and empty states go under it.
- **"Sobre vos":** a card titled at the Title size like the Menu's day card, with one row per fact under hairlines: the label in caption type (muted, 600) like a meal's slot, the value in body type under it.
- **"Tus gustos":** the same card, with one row per list (No puedo comer, No me gusta, Me gusta, Quiero comer) and its [chips](#chips) under the label.
- A card with nothing to show isn't drawn; with nothing at all, the empty state takes their place.
- **Numbers switch:** its own card with no title: "Mostrar números" at 550 with "Calorías y macros en tu menú" under it in muted caption type, and the switch on the right.
- **"Cerrar sesión"** comes last: a secondary pill at the start of the line, so leaving is never the loudest action.
- **Switch:** a real checkbox with `role="switch"`, drawn as a 44 × 26px track (strong line off, primary on) with a surface knob. It changes at once and goes back, with an inline alert under its card, if saving fails. In forced colors it uses system colors.
- The profile is read-only: what's in it changes by talking to the chat.

### Chips
Sunk-surface pills (6px 14px) listing what the chat saved, in the Profile's "Tus gustos" card: can't eat, dislikes, likes, wants. Read-only; long items wrap.

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
  - **Labels:** every item is ink (#0F1713 / #E9EFEB) at weight 550; the active one is at 650.
  - **Active item:** an opaque inner capsule (#FFFFFF / #141A17) with a 6px tangerine dot above the icon, plus `aria-current="page"`. The dot always sits inside the capsule, never on the glass.
  - **Why three signals:** against glass over dark content, the capsule alone is too faint. So "active" is told by the capsule, the dot and the weight together.
  - **Focus:** inside the navigation layer, keyboard focus is a 2px ink ring (#0F1713 / #E9EFEB), drawn on the item's outer 2px. The brand-green ring doesn't reach 3:1 on this glass.
  - **Tint, measured:** white at 50%. It was measured on real pixels in headless Chrome, first for [the glass dock](plans/2026-10-17-glass-dock-living-color.md#results) and again, with the current colors, for [the cleaner palette](plans/2026-10-18-modern-palette.md#results) (the numbers below). The dock's own ink was hidden, and the glass was captured over uniform worst-case fills and over the real chat, Menú, Lista and profile scrolled beneath it.
    - The worst case comes from the fills: ink under the glass.
    - Labels and icons: ≥ 5.28:1.
    - The ink ring against its neighbors: ≥ 4.68:1.
    - The dot on the capsule: 3.48:1.
    - The disclaimer: ≥ 5.21:1.
    - 50% is the lowest tint that keeps at least 10% margin on every threshold.
  - **Hover** (pointer devices): inactive items get a half-strength capsule wash.
  - **While the chat saves a turn**, the items are disabled, since leaving would hide that turn. The other items fade to 55%; the current one keeps its capsule and dot.

### Alerts and states
- **Inline alert:** danger text on the danger surface, a 20px alert icon, 14px radius (`Alert` in `src/ui.tsx` when there's nothing to do but read it). Below the message goes either a muted detail line (the provider's raw message on sign-in) or a quiet "Reintentar" button when the failed load can be retried (chats, profile).
- **Skeletons:** flat sunk-surface shapes with a slow opacity pulse, in the layout of what's loading, inside a `role="status"` region with a screen-reader label (the rest `aria-hidden`). Chat has bubbles; Menu has the day strip, a card with a title bar and four meal rows with hairlines, and a pill; List has the "Dónde comprar" card, the two button pills and a section of rows (checkbox, name, price, and the control under the name); Profile has its two cards (rows of a label and a value, then rows of a label and a chip-high bar) under the header, which doesn't wait. They reuse the real page's classes (`.day-card`, `.prices`, `.list li`, `.profile-card`), so gaps and hairlines match and the content arrives where its placeholder was; `PageSkeleton` in `src/ui.tsx` takes the shape (`menu` or `list`), and Profile's is in `src/Profile.tsx`. No shimmer: a sweeping band needs a gradient fill, which the Flat Fill Rule rules out. Every skeleton has the `skeleton` class, which the page fade-in skips.
- **Content arriving:** on Menu, List and Profile, what replaces a skeleton (and each page on a tab switch) fades in over `--dur-slow`: every direct child of `.page` except `.skeleton`, so a quick load never shows a half-faded skeleton. Chat's bubbles already have `rise-in`.
- **Not available yet:** something in the product plan but not in the app yet shows a "Muy pronto" pill and says only what's true today. Today that's the health-data consent dialog.
- **Empty screens** (Profile, Menu, List; `EmptyState` in `src/ui.tsx`): the mark, one line of copy, and an "Ir al chat" primary button.
- **Results that appear in place** (the chat's status line, "Lista copiada.") live in a `role="status"` element that is always mounted, so screen readers announce each change of its text.

### The mark (signature component)
`Mark` in [`src/ui.tsx`](../src/ui.tsx) draws the app icon's seven circles (`public/favicon.svg`), with unchanged centers and radii, cropped to the dots. It is the system's state glyph: inside an assistant bubble while a reply hasn't started (with the visible status line below it), on the splash after a 400ms delay, and static on the empty profile. The `converge` animation lights the dots from the outer pair inward to the apex, 1.2s per loop, 0.15s apart.

### Icons
Drawn for this app on a 24px grid: 1.75px round strokes, `currentColor` (the send arrow uses a 2.25px stroke). Chat, Menú (a calendar with three dots), Lista (a checklist), Perfil, send, alert, mail, a chevron (opens a Menu meal, and points right on the menu card's button), and the microphone (drawn inline in `src/Chat.tsx`; while listening it becomes a filled stop square).

### Logo and app icons
- `src/assets/viveri-logo.svg` is a byte-for-byte copy of the integrated logo: the mark as the first V, then IVERI (`C:\prompt-lab\assets\logo-app\v3\recommended-integrated.svg`). It is 183.03 × 57.8 units, so 89px wide in the top bar (28px tall) and 139px on sign-in (44px).
- `public/favicon.svg` is a byte-for-byte copy of the app icon redrawn with the same V (`C:\prompt-lab\assets\logo-app\v4\recommended-icon.svg`).
- Both replaced the v1 files on 2026-10-18 ([ADR 0035](adr/0035-mark-is-the-first-v.md)). Every dot in them is a true circle; v1's horizontal logo had two dots about 4% taller than wide.
- `public/icons/icon-180.png`, `icon-192.png` and `icon-512.png` were rendered from that icon SVG with headless Google Chrome at 1× scale. Each PNG carries its origin in a `tEXt` chunk. The 512 also serves as the maskable icon; the mark sits inside the 40% safe circle.
- The 16px favicon is the full icon; a simplified small-size mark doesn't exist yet.

### Store icons
- Each supermarket's own square icon, from its website on 2026-10-18, scaled down to 128px and otherwise unchanged, in `src/assets/stores/`:
  - `disco.png`: `https://www.disco.com.uy/img/Disco/icon.png`, the red oval;
  - `geant.png`: `https://www.geant.com.uy/img/Geant/icon.png`, "Gé" in green;
  - `tata.png`: `https://www.tata.com.uy/icons/icon-512x512.png`, the red wordmark.
- `StoreIcon` in `src/ui.tsx` puts one on a white tile with a 1px line border and 8px corners, so the icons are never recolored. Its size comes from where it sits (`--store-icon-size`): 40px in the List's tabs, 28px in the order button.
- It's decorative: the store's name is always written next to it.

### Motion
| Name | Value | Use |
| --- | --- | --- |
| `--dur-fast` | 120ms | press feedback, color changes |
| `--dur` | 200ms | fades |
| `--dur-slow` | 300ms, `ease-out` | a page's content fading in (`--ease` is too sharp for an opacity fade) |
| `--ease` | cubic-bezier(0.2, 0.7, 0.2, 1) | everything that isn't a loop |
| `rise-in` | 160ms, 6px | a new bubble arriving |
| `dot-in` | 180ms scale | the active-tab dot |
| `converge` | 1.2s loop | the mark while waiting |
| `shimmer` | 1.8s loop | the chat's status line |
| `pulse` | 1.4s loop (1.2s on the microphone) | skeletons, listening |

`prefers-reduced-motion: reduce` turns every animation and transition off; the mark then shows all seven dots, static, and the status line is plain muted text.

## Do's and Don'ts

### Do:
- **Do** take colors, sizes and radii from the tokens in `src/index.css`; add a token before adding a one-off value.
- **Do** keep tangerine for "the one" (see The One Rule): the active-tab dot, send and the mark's apex. Never a fill, a capsule or a call to action.
- **Do** reserve the dock's clearance (`--dock-clear`, plus `--accessory-h` in chat) at the bottom of any new scrolling view, as padding and `scroll-padding-bottom`.
- **Do** re-measure the glass on real pixels, against the worst content beneath, after changing the tint, the dock colors or the content colors.
- **Do** give every new screen its loading, empty and error states, with the skeleton, empty-state and alert patterns above.
- **Do** put new copy in `src/strings.ts`, in Rioplatense Spanish.
- **Do** check new screens with the dev fixture ([development.md](development.md#testing)) at 360px, 390px and 1280px.

### Don't:
- **Don't** recolor, redraw or rearrange the mark or the wordmark, or set "VIVERI" in a font as a stand-in logo.
- **Don't** use shadows or blur for depth outside the navigation layer, or stack a border, a fill change and a shadow on one element.
- **Don't** put glass anywhere but the dock and the chat's composer accessory: not on the top bar, cards or sheets.
- **Don't** use gradients, or put the logo or the mark on anything but `ground` or `surface`.
- **Don't** give any screen but the Chat an accessory, or float a second action bar over the dock: a screen's main action goes in its content.
- **Don't** use muted ink on glass; every label on glass is ink.
- **Don't** add a display typeface; the logo is the brand's lettering.
- **Don't** show prices or savings the product doesn't compute, or without saying what they are: prices always carry the date they were read and that they may change. No medical claims.
- **Don't** make something look available before the product has it.
- **Don't** add a CSS framework or a component library for styling.
