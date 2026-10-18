# 0032. The Menu tab shows one day at a time

- Status: Accepted
- Date: 2026-10-18

## Context
The Menu tab listed every day, each with its meals as plain rows on the ground: about 2,000 px of scroll for seven days, no containers, no hierarchy, and eight underlined "Cambiar" links on screen at once. The user found it ugly and dated ([plan](../plans/2026-10-18-menu-redesign.md)).

Options considered:
- **One day at a time**: a day strip over the day's card.
- **All days stacked**, one card each, with a sticky strip of anchor links. Rejected: the strip can't show which day you're on without an IntersectionObserver, it's still about 2,000 px, and it stacks a second bar under the top bar.
- **A tangerine selected day.** Rejected: the dock already shows a tangerine dot, and two on screen weaken [The One Rule](../design.md#colors).

## Decision
The Menu tab shows one day: a segmented strip of the menu's days (native radios, saved order) over a card with that day's meals, each meal an exclusive native accordion. "Cambiar" is a button per opened meal and one for the day. Details in [design.md](../design.md#menu).

## Consequences
- Answering "what do I eat on Thursday?" is one tap, and the screen is short, but the tab no longer shows the whole week at once. The chat's menu card still does.
- It opens on the first day every time the tab is opened. There's no "today" to default to: menus start tomorrow.
- The selected day is a new use of the primary color (buttons, the user's bubbles and the listening microphone so far).
- The exclusive accordion (`details name`) needs Chrome 120, Safari 17.2 or Firefox 130. Elsewhere several meals can stay open, which is harmless.
- The skeleton and the Menu CSS changed with it; the day strip scrolls sideways at very large text sizes instead of wrapping.
