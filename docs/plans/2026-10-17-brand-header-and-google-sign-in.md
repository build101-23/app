# Brand header, left-aligned sign-in and Google sign-in

Status: **built on this branch** (results at the end). Not pushed.

## Context
Right after the redesign was merged on this branch, the user asked for three changes:
1. The top bar always shows the app's name, VIVERI, instead of the section (Chat, Menú, Lista, Perfil).
2. On the sign-in screen, the logo and the title go on the left.
3. Sign in with Google through Supabase.

The user had already built Google sign-in on their own checkout, uncommitted: `src/GoogleSignIn.tsx`, its ADR and plan (untracked), and its wiring in `stash@{0}`. It uses Google's own button (Google Identity Services) and `supabase.auth.signInWithIdToken` with a nonce. This port reuses that work as is and restyles it. The user's checkout and stash are not touched.

## Decisions (the user's, 2026-10-17)
- **Header:** the approved horizontal logo on a light bar (`ground`), on the left, at every width. The bar is no longer the green color field: the logo may never sit on a color field (The Mark Keeps Its Colors Rule), and no white wordmark exists. The section's name stays as a screen-reader-only `h1`; the dock already shows which section is active.
- **Sign-in on wide screens:** logo, title and form aligned to the left edge of the window, with the app's gutter, instead of a centered column. Phones look as before.
- **Google:** the user's ADR, renumbered from 0008 to **0023**, because 0008 is taken on `main`.

## Steps
1. Save this plan.
2. **Header** (`src/App.tsx`, `src/index.css`):
   - The logo image (`alt="VIVERI"`), 28px tall, plus an `sr-only` `h1` with the section.
   - The bar sits on `ground` with a hairline under it, and pads to the gutter at every width.
   - Remove the `--field` and `--on-field` tokens, now unused.
3. **Sign-in left** (`src/index.css`): `.signin` loses its centered 440px column. On every width it pads by the gutter, the logo sits at the top left, and the form stays at most 400px wide.
4. **Google** (from the user's work):
   - `src/GoogleSignIn.tsx`: the user's component unchanged, except that its error uses `Alert` and its classes are renamed.
   - `src/App.tsx`: the order is the title, then Google's button, then the "o con tu email" divider, then the email hint and form.
   - Text in `src/strings.ts` (`orEmail`, `googleError`) and styles on the tokens in `src/index.css`.
   - `.env`: `VITE_GOOGLE_CLIENT_ID` (public).
   - The dev fixture stubs `signInWithIdToken`.
5. **Verify:** `npm run lint`, `tsc -b`, `npm test` and `npm run build`. Check the sign-in screen and the header at 360, 390 and 1280 px, light and dark.
6. **Docs:**
   - `docs/design.md`: Overview, Colors, Layout, Components and Do's and Don'ts.
   - ADRs: 0021 and 0022, where they say the title bar is a color field. Add ADR 0023 (the user's) and update the index.
   - `docs/architecture.md` (Auth and the sign-in data flow) and `docs/development.md` (Google setup, `VITE_GOOGLE_CLIENT_ID`).
   - `docs/notes/milestones.md`: the Google line.
   - The user's Google plan, with its ADR number updated.
   - Append the results here.

## Results
- **Header:** the logo on `ground` with a hairline, at `--edge` from the window's left (16px; 32px from 960px). The section's name is an `sr-only` `h1`. The `--field` tokens are gone from the CSS, `design.md` and ADR 0022.
- **Sign-in:** left-aligned at every width, in a column of at most 400px.
- **Google:** the user's component, with two changes: its error uses `Alert`, and the button's shape is `pill` instead of `rectangular`, to match the app's buttons. On a phone, in Spanish, it renders as "Continuar con Google", light and dark. In headless Edge at 1280px it read "Continue with Google", from that browser's English setting.
- **Fixture:** stubs `signInWithIdToken`. In the fixture Google's script does load, but Google rejects sign-in from fixture ports that aren't authorized origins.
- **`.claude/launch.json`:** the user's `web-windows` entry.
- **Checks:** `npm run lint` passes with 0 warnings. `tsc -b` passes. `npm test` passes, 26 of 26. `npm run build` passes, with no fixture code in `dist/`.
- **Screens checked:** sign-in and the chat header at 375px (light and dark) and 1280px (light).
- **Not verified:** real Google sign-in. It needs the Google Cloud and Supabase setup in the user's plan, and an iPhone test.

## Not in scope
- The Google Cloud and Supabase setup, and testing on a real iPhone. They need the user's logins; the user's Google plan lists them.
- The user's voice demo (`src/demo/`, `supabase/functions/voice-token/`, ADR 0005-gemini).
