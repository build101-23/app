# 0013. Weekly menu saved by a chat tool, keyed to a fixed food catalog

- Status: Accepted (confirm step removed by 0022; seven fixed days superseded by 0024)
- Date: 2026-10-17

## Context
Milestone 3 turns the chat's diet into a structured weekly menu with its own screen ([plan](../plans/2026-10-17-plan-and-menu.md)). The shopping list (milestone 4) and the prices (milestone 5) are built from that menu, so its ingredients need a shape they can add up and look up.

We had to decide:
- **How the menu is made.** Options: a new tool in the existing chat loop, or a separate function with structured output.
- **What an ingredient points at.** Options: free text (fast now, but "pollo" and "pechuga de pollo" have to be matched later), or a fixed catalog of foods.
- **When the menu counts as the user's plan.** Options: when the user accepts it in the chat, or as soon as it's proposed, plus a confirm button.

## Decision
- **The chat saves the menu with a strict `save_menu` tool**, next to `save_profile`. Each call replaces the whole week.
  - The week is a few recipes that repeat, and the days point at them.
  - Amounts are per serving, raw as bought.
  - The function checks what strict mode can't: catalog keys and their units, recipe ids, and each day exactly once. A failed check returns an error the model fixes.
- **Ingredients point at a fixed catalog** of about 50 everyday foods (`supabase/functions/_shared/catalog.ts`), each with its unit. Anything else is `other` with a name. The Spanish names live in `src/strings.ts` ([ADR 0006](0006-spanish-ui.md)). It's a starting point that we may revisit.
- **The menu is saved as soon as it's proposed.** A Confirm button in the Menu tab sets `confirmed_at`, and every save clears it.
- **The saved menu travels into each chat** as a `<saved_menu>` block, the same way as the profile ([ADR 0011](0011-profile-in-each-chat.md)).

## Consequences
- The list and the prices can work in plain code, by catalog key, with no cooked-to-raw step and no name matching.
- Foods outside the catalog end up as "not found online" until the catalog grows or is replaced by scraped products.
- The menu shows up in the Menu tab with no extra step. Confirming takes one tap, and the "first plan confirmed with 2 changes or fewer" metric needs a confirm event (milestone 6).
- The function's tool input isn't streamed, so the user waits while the week is generated. A short line before the tool call covers the wait, and the whole exchange has to fit in the Edge Function's wall clock.
- After a `save_menu`, the chat's next message repeats the menu once (a few thousand tokens), as ADR 0011 already accepts for the profile.
