# VIVERI v2: Google sign-in as the main way in

Status: **built and verified** (isolated preview, not merged).

## Context
The user asked to replace the sign-in card's "Enviame un link para entrar" button with the Google sign-in that the team built with Supabase. That work exists uncommitted in `C:\build 101` (read-only for this preview): `src/GoogleSignIn.tsx`, its ADR "Sign in with Google's own button" and its plan.

How it works there: Google's official button (Google Identity Services) returns a signed ID token to the page, and `supabase.auth.signInWithIdToken` turns it into a session, with a nonce so a stolen token can't be replayed. The page never navigates away, which is the point for an installed iOS app. The button only renders when `VITE_GOOGLE_CLIENT_ID` is set. In the original, the magic-link email stays as the other way in, because whether Google's popup returns to an installed iOS app is still untested.

## Decision for v2
See [ADR 0010](../adr/0010-google-leads-sign-in.md). In short: Google's button leads, the email form sits behind a quiet "Entrar con tu email" link, and email becomes the only way in when Google isn't configured or can't load.

## Steps
1. Save this plan.
2. `src/GoogleSignIn.tsx` (adapted from the original) and `src/google.ts` (client ID). `src/App.tsx`: Google first, then the toggle for the email form.
3. New strings in `src/strings.ts`, in Rioplatense: the Google hint, the email toggle, the Google error (from the original) and the "Google isn't available" message.
4. Fixture: the fake GIS and `signInWithIdToken` in `src/dev/fixture.ts`; a placeholder client ID in fixture mode (`vite.config.ts`), skipped with `FIXTURE_NO_GOOGLE=1`; `?google=ok|error|unreachable`.
5. Verify:
   - build, lint, no fixture strings in `dist/`;
   - captures of the sign-in states, light and dark;
   - signing in through the simulated button reaches the chat.
6. Docs: `architecture.md` (auth), `development.md` (`VITE_GOOGLE_CLIENT_ID`, Google Cloud and Supabase setup, fixture parameters), ADR 0010, `design.md` (sign-in card).

## Results
- **Checks:** `tsc -b`, `oxlint` (0 warnings, 0 errors), `npm run build` pass. `dist/` has no fixture or picker code.
- **Captured** with headless Edge at 390 × 844 (light and dark) and 1280 × 800:
  - Google first: the button plus the "Entrar con tu email" link, no horizontal overflow;
  - email open: the form below a hairline, with its hint and a secondary button; focus lands on the email field;
  - `google=error`: the alert "No se pudo entrar con Google…", the email link still there;
  - `google=unreachable`: no button; the alert "Google no está disponible ahora…", the form open with a primary button, and the email hint in the header;
  - no client ID (`FIXTURE_NO_GOOGLE=1`): the email form alone, with a primary button;
  - the simulated button signs in and lands on the chat.
- **Changes made during verification:** when Google can't load, the header no longer promises Google, the form's button turns primary, and the empty button box is removed. Opening the email form moves focus to the field, because the link that had focus disappears.
- **Not verifiable here:** Google's real button and popup (the fixture fakes them), the real Supabase token exchange, and the iPhone popup check that the original ADR leaves open.
