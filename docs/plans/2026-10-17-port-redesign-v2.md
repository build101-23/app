# Port the v2 redesign to main

Status: **done**, awaiting review.

## Context
The VIVERI v2 redesign (pumpkin orange and black, a floating glass dock, Google's button leading the sign-in) was built in an isolated preview, `C:\prompt-lab\previews\viveri-web-redesign\v2`, on top of `6bf25ae`, when the app only had chat and profile. Since then `main` added multiple chats, a menu card in the chat, voice input, the Menu and List screens, prices with the store rule, and CI. This brings v2 onto `main` (`8f3f071`) and keeps everything `main` does.

## Approach
1. **Source branch.** `redesign/v2-source` is `6bf25ae` plus v2's changed files (`src/`, `docs/`, `public/`, `index.html`, `package.json`, `vite.config.ts`, `README.md`). That way the merge has a true common base.
2. **Port branch.** `redesign/v2-port` starts from `main` and merges the source branch with `--no-commit`.
3. **ADRs.** v2's 0008–0011 collided with `main`'s, so they ended up as 0023–0026 (see step 9), with their cross-links updated. ADR 0025 now stands on its own: the "Google's own button" decision it pointed to was never committed.
4. **Code.** `main`'s behavior, with v2's look and structure on top:
   - `App.tsx`: v2's shell, splash and sign-in, and `main`'s Menu, List, chat draft and tab lock.
   - `Chat.tsx`: `main`'s chats, menu card, voice input and Enter-to-send, inside v2's skeleton, typing mark, alerts and floating composer.
   - `strings.ts`: the union of both. v2's placeholder strings are gone.
5. **Menu and List.** They're `.page` screens. Their buttons use v2's `button` classes, and their styles were rewritten on v2's tokens. There's no deeper redesign.
6. **Google.** The button shows only when `VITE_GOOGLE_CLIENT_ID` is set. `.env` is untouched, so for now email stays the only way in.
7. **Dev fixture.** It now covers chats, the menu and list cards, a saved menu or none (`?menu=`), the list with what you have at home, and the numbers switch (`?numbers=`).
8. **Docs.** `design.md` (menu and list cards, chats bar, voice input, Menu and List, the numbers switch, the prices rule), `architecture.md`, `development.md`, `open-decisions.md` and the ADR index.
9. **Second merge.** `main` moved on during the port (PR #8, the numbers switch; PR #9, the list follows the menu). Merged it in:
   - Upstream's ADRs 0021 and 0022 took those numbers, so the redesign's ADRs moved again, to 0023–0026.
   - Menu and List are upstream's, with the redesign's classes put back.
   - Chat keeps the redesign and gains the list card.
   - Perfil gets the numbers switch as a card with a toggle.

## Results
- `npm run lint`, `npm run build` and `npm test` (30 tests) pass. No fixture or picker code is in `dist/`.
- Headless Chrome screenshots from the fixture: sign-in, Chat (with the menu and list cards), the chat list, Menu (with numbers on), List (top and bottom) and Perfil, at 390 px in light and dark, plus Chat and List at 1280 px. No alerts and no console errors, and the last list row clears the dock.
- Not checked: the real Google popup, a real iPhone, and contrast measurements of the dock on the new screens.
