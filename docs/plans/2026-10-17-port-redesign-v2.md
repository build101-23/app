# Port the v2 redesign to main

Status: **done**, awaiting review.

## Context
The VIVERI v2 redesign (pumpkin orange and black, a floating glass dock, Google's button leading the sign-in) was built in an isolated preview, `C:\prompt-lab\previews\viveri-web-redesign\v2`, on top of `6bf25ae`, when the app only had chat and profile. Since then `main` added multiple chats, a menu card in the chat, voice input, the Menu and List screens, prices with the store rule, and CI. This brings v2 onto `main` (`8f3f071`) and keeps everything `main` does.

## Approach
1. **Source branch.** `redesign/v2-source` is `6bf25ae` plus v2's changed files (`src/`, `docs/`, `public/`, `index.html`, `package.json`, `vite.config.ts`, `README.md`). That way the merge has a true common base.
2. **Port branch.** `redesign/v2-port` starts from `main` and merges the source branch with `--no-commit`.
3. **ADRs.** v2's 0008–0011 collided with `main`'s, so they took the next free numbers, which moved each time `main` added ADRs. They are now 0025–0028 (see step 9 and the revision below), with their cross-links updated. ADR 0027 now stands on its own: the "Google's own button" decision it pointed to was never committed.
4. **Code.** `main`'s behavior, with v2's look and structure on top:
   - `App.tsx`: v2's shell, splash and sign-in, and `main`'s Menu, List, chat draft and tab lock.
   - `Chat.tsx`: `main`'s chats, menu card, voice input and Enter-to-send, inside v2's skeleton, typing mark, alerts and floating composer.
   - `strings.ts`: the union of both. v2's placeholder strings are gone.
5. **Menu and List.** They're `.page` screens. Their buttons use v2's `button` classes, and their styles were rewritten on v2's tokens. There's no deeper redesign.
6. **Google.** The button shows only when `VITE_GOOGLE_CLIENT_ID` is set. `.env` is untouched, so for now email stays the only way in.
7. **Dev fixture.** It now covers chats, the menu and list cards, a saved menu or none (`?menu=`), the list with what you have at home, and the numbers switch (`?numbers=`).
8. **Docs.** `design.md` (menu and list cards, chats bar, voice input, Menu and List, the numbers switch, the prices rule), `architecture.md`, `development.md`, `open-decisions.md` and the ADR index.
9. **Second merge.** `main` moved on during the port (PR #8, the numbers switch; PR #9, the list follows the menu). Merged it in:
   - Upstream's ADRs 0021 and 0022 took those numbers, so the redesign's ADRs moved again (now 0025–0028, after the revision below).
   - Menu and List are upstream's, with the redesign's classes put back.
   - Chat keeps the redesign and gains the list card.
   - Perfil gets the numbers switch as a card with a toggle.

## Results
- `npm run lint`, `npm run build` and `npm test` (30 tests) pass. No fixture or picker code is in `dist/`.
- Headless Chrome screenshots from the fixture: sign-in, Chat (with the menu and list cards), the chat list, Menu (with numbers on), List (top and bottom) and Perfil, at 390 px in light and dark, plus Chat and List at 1280 px. No alerts and no console errors, and the last list row clears the dock.
- Not checked: the real Google popup, a real iPhone, and contrast measurements of the dock on the new screens.

## Revision: merging `main` with real products, and the brand top bar
v2 was chosen over v3 (pull request 14, which stays open for now). `main` moved again (to `3adc3b2`), mostly with real supermarket prices (pull request 13):
- the chat agent builds the menu from real products, with a budget and a product search (ADR 0024);
- the scraper reads prices for the unit of sale (ADR 0023);
- the List tab and the chat's list card read those products (`src/prices.ts`), show a budget line and link each line to the product to buy.

**Steps**
1. **ADRs.** `main` now owns 0023 and 0024. In a commit before the merge, v2's ADRs move to **0025** (identity), **0026** (glass dock), **0027** (Google leads sign-in) and **0028** (colors), with every reference.
2. **Merge `origin/main`** and resolve the conflicts: `src/List.tsx` keeps `main`'s pricing, budget and product links in v2's page and classes; the docs keep both sides.
3. **Top bar.** It always shows the app's name (the tile and the VIVERI wordmark), never the section's. The section's name stays as an `sr-only` `h1` for screen readers. The sign-in already has its lockup and title on the left.
4. **Google.**
   - Commit the public `VITE_GOOGLE_CLIENT_ID` in `.env`, so the button shows.
   - Google's button iframe gets `color-scheme: light`, so it doesn't draw an opaque white box on a dark card.
   - `development.md` lists the authorized JavaScript origins Google needs: production, `localhost`, and each Preview URL on its own, since Google allows no wildcards. Signing in on a Preview that isn't listed fails with `origin_mismatch`.
5. **Fixture.** A `prices` scenario (`ok`, `over`, `old`, `error`) serves synthetic `store_products` rows, so List and the list card show prices, the budget line and product links.
6. **Verify.**
   - Lint, types, tests and the build, with no fixture code in `dist/`.
   - An adversarial review of the merge: parity with `main`, design and accessibility, and docs.
   - The screens in the fixture.
7. **Docs:** `design.md` (top bar, List prices, budget and product links, no more "example prices"), `development.md`, the ADR index, `milestones.md`, and the results here.

**Results**
- **Merged** `origin/main` at `3adc3b2`.
  - Conflicts in `src/List.tsx`, the ADR index and `open-decisions.md`, resolved by keeping both sides.
  - The renumber is its own commit before the merge, so `main`'s 0023 and 0024 kept their numbers and links.
- **On top of the merge:**
  - the top bar shows the tile and the wordmark, in ink, on every tab;
  - the client ID is in `.env`, and the fixture never uses it;
  - Google's slot has `color-scheme: light`;
  - the List's product line sits under the name;
  - over budget stays ink;
  - the fixture's `prices` scenario.
- **Adversarial review.** Four reviewers (parity with `main`, design and accessibility, docs, fixture and build), each checked by a skeptic: 16 findings, 9 confirmed, all fixed.
  - **Chat.** "Reintentar" is disabled during a turn. Before, it could reopen the chat mid-reply and swap the history under the streaming text. The load alert now sits after the history, where the view is, and a new turn clears a stale one. Both bugs came from the first port, not from `main`.
  - **Docs.**
    - a stale ADR number in this plan;
    - Preview sign-in needs the Google origin too;
    - a typography entry for the old screen title;
    - a split Motion table;
    - a dead anchor in the coral plan.
  - **Fixture.** The default prices now show a split to choose, a saving and a food no store sells online, and `over` shows that a split fits. The links go to `example.com`.
  - **Rejected:** 7, most of them unchanged from `main`. For example, the product link sits inside the checkbox's label, and over budget uses `role="alert"`.
- **Checks.**
  - Lint 0 warnings, `tsc -b` passes, `npm test` 45 of 45, and the build passes with the client ID and no fixture or picker code.
  - Fixture builds with and without `FIXTURE_NO_GOOGLE` carry the placeholder or nothing, never the real ID.
  - In the fixture at 375 px, light and dark:
    - the top bar on every tab;
    - List with every price state, with no horizontal scroll;
    - the chat's list card;
    - the sign-in;
    - the chat's load error.
- **Not checked:**
  - real Google sign-in, which needs the origins in Google Cloud;
  - real data and devices;
  - dock contrast measurements on the new List rows.
