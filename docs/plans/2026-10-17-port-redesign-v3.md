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
3. **ADRs.** The redesign's 0008 and 0009 collide with `main`'s 0008 and 0009, so they become **0021** ("VIVERI identity and UI system") and **0022** ("Glass navigation layer"). Update their cross-links, `docs/adr/README.md`, and every reference in `docs/design.md` and the plans.
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
    - ADRs 0021 and 0022 and the ADR index;
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
- The redesign's ADRs are now 0021 and 0022, with every reference updated.

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
