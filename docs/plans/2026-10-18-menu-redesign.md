# A modern Menu tab

## Context
The user finds the Menu tab ugly and dated. Design advice came from an Opus subagent briefed with design.md and the code, and the diagnosis holds up:
- **No containers.** Profile and List put their content in surface cards; Menu puts 28 rows straight on the ground, so it reads as a document.
- **No hierarchy.** Day headings are 1rem, one step above body text, and each meal's slot and recipe share one body-size line.
- **Browser defaults and repetition.** The native disclosure triangle, bulleted ingredients, and 7 + 28 underlined "Cambiar" links, about eight on screen at once.
- **No way through the week.** Seven days are about 2,000 px of scroll.

## Approach
One day at a time: a day strip over a single day card. Markup in `src/Menu.tsx`, styles in the Menu section of `src/index.css`. No new dependency, no new color token.

- **Day strip** (only when the menu has more than one day): a `<fieldset>` of native radios in a sunk-surface pill track. Each segment is the day's first three letters (Lun, Mar, Mié…) with the full name as its accessible name; the selected one is filled with `--primary`. Saved order, never sorted. Native radios give one tab stop and arrow-key movement. Selection is `useState(0)`: the menu starts tomorrow, so defaulting to "today" would be wrong right after saving.
- **Day card** (`.card`): the day's name at the Title size, then each meal as a `<details name="meal">` (an exclusive native accordion) with a hairline above it. The summary has the slot in caption type, the recipe at 1rem/550 and a chevron (new `ChevronIcon`) that turns when open. Opened, a meal shows "Ingredientes" as a plain list (name left, amount right in muted tabular figures), "Cómo se hace", and a secondary "Cambiar este plato" button. From 640 px the body is two columns.
- **"Cambiar el martes"** is a secondary button under the card. At most two "Cambiar" buttons are on screen, instead of about eight underlined links.
- **Numbers switch:** the day's total goes under the day's name and each meal's macros under its recipe, as now.
- **Skeleton:** redrawn to match: a 52 px strip, a card with a title bar and four 64 px rows, a pill.
- **Motion:** the card is keyed by day, so the page fade-in replays on a day switch with no new CSS; the chevron turns over `--dur`; an opened meal fades in over `--dur`. Reduced motion already turns everything off. The accordion's height isn't animated (`::details-content` is Chromium-only).
- **Forced colors:** the selected day uses `Highlight`, or it would vanish.

Rejected: all days stacked with a sticky strip of anchor links. It can't show which day you're on without an IntersectionObserver, it's still about 2,000 px, and it stacks a second bar under the top bar. A tangerine selected day: it would repeat the dock's tangerine dot, two on screen against The One Rule.

## Tradeoffs to flag
- The Menu tab no longer shows the whole week at once (the chat's menu card still does), and it opens on the first day every time.
- `details name` (exclusive accordion) needs Chrome 120, Safari 17.2 or Firefox 130. Elsewhere several meals can be open, which is harmless.
- The selected day is a new use of `--primary` (buttons, the user's bubbles, the listening microphone so far).
- Larger text sizes make the strip scroll sideways instead of wrapping.

## Steps
1. Strings: `dayPicker`, `ingredients`, `how`, `changeThisDay`, `changeThisMeal`; drop the unused `change`.
2. `ChevronIcon` and the new menu shape of `PageSkeleton` in `src/ui.tsx`.
3. `src/Menu.tsx` and the Menu and skeleton CSS.
4. Check in `npm run dev:fixture` (`?menu=saved`, `?menu=short`, `?numbers=on`, `?loading=data`) at 390 px and 1280 px, light and dark; keyboard (arrows on the strip, Enter on a meal); `npx tsc -b`, `npm run lint`, `npm run build`.
5. Docs: design.md (Menu, Typography, Skeletons, Icons) and an ADR, since dropping the week overview is a product decision.

## Results
- Built as planned: `src/Menu.tsx`, the Menu and skeleton CSS, `ChevronIcon` and the menu shape of `PageSkeleton` in `src/ui.tsx`, new strings, design.md, [ADR 0032](../adr/0032-menu-shows-one-day-at-a-time.md).
- Checked in `npm run dev:fixture` at 390 px (light, with and without `?numbers=on`), at 1100 px in dark, and with `?loading=data`:
  - the strip shows seven days and picks the right one; the arrow keys move between days and the focus follows;
  - opening a meal closes the other (the native exclusive accordion), and switching days closes them all;
  - from 640 px the opened meal has two columns; the selected day is the dark theme's green fill;
  - the skeleton's strip (76 px from the top), card (140 px) and pill sit where the real ones do.
- `npx tsc -b`, `npm run lint` and `npm run build` pass.
- Not verified: Safari and Firefox (the `:has()` selectors and `details name` are the parts to look at), a real screen reader, and the forced-colors rule. The selected day's contrast uses the pairs design.md already documents (`--on-primary` on `--primary` in both themes), not new measurements.
