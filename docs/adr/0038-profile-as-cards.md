# 0038. The Profile is built from cards

- Status: Accepted
- Date: 2026-10-18

## Context
The Profile tab was the one screen that didn't look like the rest of the app ([plan](../plans/2026-10-18-profile-redesign.md)). The Menu and the chat's cards put the title inside a card, with rows under hairlines and a caption label over each value. The Profile mixed three patterns instead:
- a card of facts;
- groups of chips loose on the ground, with headings outside any card;
- "Preferencias" and "Cuenta" as headings over cards of their own, where the email and "Cerrar sesión" wrapped awkwardly.

## Decision
- **A header first:** a circle with the email's initial, and the email. It's there in every state of the page.
- **Two cards for what the chat saved,** built like the Menu's day card: "Sobre vos" (the facts) and "Tus gustos" (the four lists as chips). Each row is a caption label over its value. A card with nothing to show isn't drawn.
- **The numbers switch in a card of its own,** with no title: "Mostrar números" and a muted hint, "Calorías y macros en tu menú".
- **"Cerrar sesión" last,** a secondary pill on its own. The "Preferencias" and "Cuenta" headings are gone; the email is in the header.
- **The profile stays read-only.** A "Cambiar en el chat" button like the Menu's was considered and left out.

Details are in [design.md](../design.md#profile).

## Consequences
- Every tab now reads the same way: cards with the title inside, labels in caption type, hairlines between rows.
- The email is at the top, so who's signed in is the first thing on the page, not the last.
- Changing the profile still means telling the chat, and nothing on the page points there except the empty state.
