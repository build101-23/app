# Port the v3 redesign to main

Status: **merged on this branch** (results at the end). Not pushed.

## Context
The visual redesign was built in isolated previews on top of `6bf25ae`, when the app only had chat and profile.
- `C:\prompt-lab\previews\viveri-web-redesign\v1`: the VIVERI identity, the seven-dot mark, tokens, chat and profile states, and the dev fixture.
- `v3`, on top of v1: a neutral glass dock at every width, flat color fields, chat intent cards, a status line and a disclaimer. The decisions behind it are in the UX research (`C:\prompt-lab\results\referencias-ux-viveri\v1\research.md`) and in v3's own plan.

Since then `main` added several things the redesign never saw:
- multiple chats, a menu card in the chat and menu confirmation;
- browser voice input;
- the Menu and List screens;
- the price catalog, the store rule with example prices, and CI.

## Approach
1. **Source branch.** `redesign/v3-source` is `6bf25ae` plus v3's 28 changed files (commit `8b20de0`; review captures left out). The merge gets a true common base, so git combines everything that doesn't overlap.
2. **Port branch.** This branch, `worktree-redesign-v3-port`, starts from `main` at `8f3f071`. It merges the source branch with `--no-commit`, resolves the conflicts, and is verified before committing. The user's checkout of `main` (untracked files and stashes) is not touched.

## Decisions carried over (not reopened here)
- **Identity:** green and tangerine, the seven-dot mark, and tangerine only for "the one" (ADR 0008 from the redesign).
- **Glass:** a neutral glass dock, the "Más vidrio" setting, the floating pill at every width with no rail, and no compaction on scroll.
  - Tints: white at 50% in light mode, `#0D1613` at 68% in dark mode.
  - Labels: 13 px, all in ink.
  - Focus: an ink ring inside the dock.
  - Tangerine dot: inside an opaque active capsule.
- **Title bar:** a flat color field (ADR 0009 from the redesign).

## Steps
1. Save this plan.
2. Merge `redesign/v3-source` with `--no-commit`. Take each non-overlapping change as is.
3. **ADRs.** The redesign's 0008 and 0009 collide with `main`'s 0008 and 0009, so they took the next free numbers, which moved each time `main` added ADRs. They are now **0025** ("VIVERI identity and UI system") and **0026** ("Glass navigation layer"), after `main`'s 0021 to 0024. Update their cross-links, `docs/adr/README.md`, and every reference in `docs/design.md` and the plans.
4. **Code conflicts.** Keep all of `main`'s behavior and apply the redesign's look and structure on top.
   - `src/App.tsx`: `main`'s tabs, routing and data, inside the redesign's shell (title field, glass dock, splash, sign-in).
   - `src/Chat.tsx`:
     - from `main`: multiple chats, the menu card, confirmation, voice input, the Enter behavior and locking;
     - from the redesign: the skeleton, the mark as the typing glyph, the status line, the intent cards, the composer as the dock accessory, and the disclaimer.
   - `src/strings.ts`: the union of both, keeping one key per text. All copy in Rioplatense Spanish.
   - `src/index.css`: the redesign's tokens and components, plus `main`'s new component styles rewritten on those tokens.
5. **Menu and List** (`src/Menu.tsx`, `src/List.tsx`, new in `main`):
   - They render with the new tokens, and their content clears the dock and accessory.
   - Their CTAs use the primary button, never tangerine.
   - Price and store elements keep `main`'s rules (example prices, the store rule).
   - A deeper redesign of these two screens is out of scope (follow-up).
6. **Docs that changed on both sides** (`architecture.md`, `development.md`, `product.md`, `open-decisions.md`): keep both contents.
7. **`docs/design.md`.** Update the rules that `main` made obsolete:
   - Menu and List now exist, so the "Not available yet" rules no longer cover them;
   - the "no prices" rule becomes "only `main`'s example and checked prices, with their date".
   Document how Menu, List and the chat's menu card use the system.
8. **Dev fixture** (`src/dev/fixture.ts`): extend it so `main`'s new data (conversations, menus, list, prices) renders for screenshots. It must never reach the production build.
9. **Verify:**
   - `npm run lint`, `npm run build` and `npm test`, with no fixture code in `dist/`;
   - screenshots from the fixture at 360, 390 and 1280 px, light and dark, of chat, the menu card, Menu, List and Perfil;
   - a geometry check that nothing hides under the dock;
   - a contrast re-check of the dock with v3's measuring scripts.
10. **Docs step:**
    - `docs/design.md` (step 7);
    - ADRs 0025 and 0026 and the ADR index;
    - `docs/development.md` (fixture);
    - `docs/architecture.md` (stack line).

    Append the results here.

## Out of scope
- A visual redesign of Menu and List beyond tokens and clearance.
- The user's uncommitted work: Google sign-in and the voice demo, in untracked files and in `stash@{0}` on their checkout.
- Pushing or opening a PR. That needs the user's go-ahead.

## Results
**Merge.**
- `redesign/v3-source` (`8b20de0`, base `6bf25ae`) merged into this branch, which starts from `main` at `8f3f071`.
- Conflicts in seven files were resolved by hand: `docs/adr/README.md`, `docs/development.md`, `docs/notes/open-decisions.md`, `src/App.tsx`, `src/Chat.tsx`, `src/index.css` and `src/strings.ts`. Everything else merged on its own.
- The redesign's ADRs are now 0025 and 0026, with every reference updated.

**Code adapted on top of the merge.**
- `Menu.tsx`, `List.tsx` and the menu card: page layout, button classes, `Alert`, `PageSkeleton` and `EmptyState`.
- The fixture now serves chats, a saved week, its list and example prices.

**Checks.**
- `npm run lint` passes with 0 warnings.
- `tsc -b` passes.
- `npm test` passes, 26 of 26.
- `npm run build` passes, with no fixture code in `dist/`.

**Adversarial review.** Four independent reviewers, each finding then checked by a skeptic: behavior parity with `main`, design rules and accessibility, measured geometry and contrast, and docs.
- 23 findings confirmed, 3 rejected; all 23 fixed. Among them:
  - "Reintentar" now locks the chat until the latest chat is open, as `main` did.
  - A failed refresh after a reply no longer shows a load error over a working chat.
  - The chats list has its own error and retry.
  - The intent cards hide while you type.
  - The status line, "Menú confirmado." and "Lista copiada." are always-mounted live regions.
  - "Confirmar menú" shows "Confirmando…" and moves focus to its result.
  - The microphone keeps one accessible name.
  - Menu and List have loading skeletons and empty states.
  - Focus rings are no longer clipped under the title bar.
  - Docs fixes.
- Geometry, measured in headless Chrome at 360×640, 390×844 and 1280×800, light and dark: 0 failures. In every view the last content sits above the dock and composer, and no focused control ends up under the glass.
- Contrast: the dock at the shipped tints matches v3 exactly over the uniform worst cases. Real Menu and List content beneath it is easier: labels ≥ 13.3:1.

**Not verified.**
- Real devices and real Supabase. The fixture stands in for both.
- The on-screen keyboard on a phone.

## Revision: merging `main` again
After the port and the brand-header commit (`8a6fcc6`), `main` moved on. The new commits added:
- the numbers switch (ADR 0021);
- the list following the menu, with no confirm step and a live list card in the chat (ADR 0022);
- one menu card per turn;
- a default-calories rule in the chat prompt.

**Steps**
1. Merge `origin/main` at `0ba9cea` and resolve the conflicts in `App`, `Chat`, `Menu`, `List`, `Profile`, `strings`, `index.css` and the docs. Keep every behavior from `main`, and keep the port's look and fixes.
2. **ADRs.** `main` now owns 0021 and 0022, so the redesign's and Google's ADRs move after them, and every reference with them. Their numbers moved once more in the [next revision](#revision-merging-main-with-real-products).
3. **The new pieces in the system.**
   - **The confirm step is gone** from Menu and List, along with its focus and announcement code.
   - **The chat's list card** becomes an assistant bubble with a secondary "Ver lista".
   - **The Menu's macros** use muted caption type with tabular figures.
   - **The numbers switch** goes in a "Preferencias" card on Perfil. It is a real checkbox with `role="switch"`, drawn as a track and a knob, and it shows even when nothing is saved yet.
4. **Fixture.**
   - A turn that shows the list.
   - The `menu` scenarios become `saved`, `none` and `error`.
   - A new `numbers` scenario: `off`, `on` or `error`.
   - An `rpc` stub for `set_show_numbers`.
5. **Verify.** Lint, types, tests and the build. Then an adversarial review of the merge.
6. **Merge `origin/main` again at `d470768`**, which adds the default-calories prompt rule. It should merge cleanly.
7. **Docs:** `design.md`, `architecture.md`, `development.md`, the ADR index, `milestones.md`, and the results here.

**Results**
- **Merged and checked.** Lint 0 warnings, `tsc -b` passes, `npm test` 30 of 30, build passes with no fixture code in `dist/`.
- **Adversarial review.** Three reviewers (parity with the new `main`, design and accessibility, docs), each checked by a skeptic: 12 confirmed findings (one reported twice), 1 rejected. All fixed:
  - **Google button in dark mode.** It sat in an opaque white box, because Google's iframe inherited the dark `color-scheme`. The fix is `color-scheme: light` on its slot, so Google's own dark button shows.
  - **The switch in forced colors.** Its knob was hard to see when on; it now uses `HighlightText` on `Highlight`.
  - **The chat when the menu can't be read.** It now opens without its list card instead of failing; this was inherited from `main`.
  - **The fixture's `numbers=error`.** It no longer saves the value it reports as failed, and `profile=empty` keeps the switch.
  - **Docs.** A stale ADR number, the menu-card rule, the intent-card rule, and this revision.
- **Measured** in headless Chrome, 156 runs: 360×640, 390×844 and 1280×800, light and dark, with and without iPhone safe areas.
  - Geometry: 0 failures. The list card clears the composer by about 31 px, and Menu (with macros), List and Perfil clear the dock by 16 px.
  - Focus is never under the glass.
  - Dock contrast over the new content is at least the uniform worst case: labels ≥ 5.87:1 light, ≥ 11.26:1 dark.
  - The switch is at least 3.1:1 against the card in every state.

## Revision: merging `main` with real products
Before the pull request, `main` moved again (to `3adc3b2`), mainly with real supermarket prices (pull request 13):
- the agent builds the menu from real products, with a budget and a product search (ADR 0024);
- the scraper reads prices for the unit of sale (ADR 0023);
- the List tab and the chat's list card read those products (`src/prices.ts`), show a budget line and link each line to the product to buy.

**Steps**
1. **ADRs.** `main` now owns 0023 and 0024. In a commit before the merge, the redesign's ADRs become **0025** (identity) and **0026** (glass), and Google's becomes **0027**, with every reference.
2. Merge `origin/main` and resolve the conflicts:
   - `src/List.tsx`: `main`'s pricing, budget and product links, inside the port's layout, skeleton, empty state and alerts;
   - the docs: keep both sides.
3. **Fixture.** Serve `store_products` rows for the saved week, so List and the list card show real-style prices, the budget line and product links.
4. **Design.** The budget line and the product links follow the system, with no tangerine:
   - the budget line is plain ink: over budget is announced, but it isn't an error, so it doesn't take the danger alert;
   - prices that can't be read are an error, so they show the inline alert.

   Update `design.md` where it still says "example prices".
5. **Verify.** Lint, types, tests, the build, and the List and chat cards in the fixture.

**Results**
- **Merged** `origin/main` at `3adc3b2`.
  - Conflicts in `src/List.tsx`, the ADR index, `milestones.md` and `open-decisions.md`, all resolved by keeping both sides.
  - The renumber went in its own commit before the merge, so `main`'s new 0023 and 0024 kept their numbers and links.
- **List.** `main`'s pricing, budget line and product links sit in the port's page. Two changes on top:
  - a failed price read shows the inline alert;
  - the old rule that indented the store tag under the checkbox is gone, so the product line sits right under the name.
- **Fixture.** A new `prices` scenario (`ok`, `over`, `old`, `error`) serves synthetic `store_products` rows for the saved week.
- **Checks.**
  - Lint 0 warnings, `tsc -b` passes, `npm test` 45 of 45, and the build passes with no fixture code in `dist/`.
  - In the fixture at 375 px: every price state on List and in the chat's card, no horizontal scroll, and product links in muted ink, underlined.
- **Not re-measured:** the full geometry and contrast runs. List rows are taller now, with one more caption line, but the clearance under the dock comes from padding, not from row height.
