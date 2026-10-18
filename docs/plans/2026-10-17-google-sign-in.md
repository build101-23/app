# Sign in with Google

Status: **code done**, waiting on the prerequisites and an iPhone test.

## Context
Sign-in is Supabase's magic link only. On an installed iOS app the link opens Safari, so the session lands outside the app. This adds Google as a second way in, next to the email form.

Supabase's redirect flow (`signInWithOAuth`) would have the same problem: the page leaves the app for Google and can come back in Safari. Google's own button (Google Identity Services) instead returns a signed ID token to the page, and `supabase.auth.signInWithIdToken` turns it into a Supabase session, so the app never navigates away. Reasoning in [ADR 0025](../adr/0025-google-sign-in-button.md).

## Prerequisites (you run these: they need your Google and Supabase logins)
1. Google Cloud Console → a project for the app → **Google Auth Platform**: set it up as **External**, with the scopes `openid`, `email` and `profile`. While it's in **Testing**, only the emails added as test users can sign in. Publish it before the pilot (these scopes don't need Google's verification).
2. Google Auth Platform → **Clients** → Create client → **Web application**. Authorized JavaScript origins: `http://localhost`, `http://localhost:5173` and `https://app.build101-23.workers.dev`. No redirect URIs.
3. Supabase → Authentication → Sign In / Providers → **Google**: enable it and put the client ID under **Client IDs**. The client secret is only used by the redirect flow. Leave "Skip nonce checks" off.
4. Put the client ID in `.env` as `VITE_GOOGLE_CLIENT_ID`. It's public, like the Supabase publishable key.

## Steps
1. Save this plan.
2. `src/GoogleSignIn.tsx`: loads `https://accounts.google.com/gsi/client` on the sign-in screen only. Makes a random nonce, gives Google its SHA-256 and Supabase the raw value, so a stolen ID token can't be replayed. Renders the official button (`continue_with`, `es-419`, dark when the system is dark) and calls `signInWithIdToken`. Renders nothing when `VITE_GOOGLE_CLIENT_ID` is empty, so the email form keeps working alone.
3. `src/App.tsx`: the button above the email form, with an "o con tu email" divider. Text in `src/strings.ts`, styles in `src/index.css`.
4. `.env`: add an empty `VITE_GOOGLE_CLIENT_ID=`.
5. `.claude/launch.json`: a second dev server entry that runs on Windows (the existing one points at Homebrew's npm).
6. Verify: `npm run build`, `npm run lint`, and the sign-in screen in the browser with and without a client ID. Real sign-in, including on an iPhone with the app installed, needs the prerequisites done first.
7. Docs: `docs/architecture.md` (Auth, sign-in data flow), `docs/development.md` (Google setup, `VITE_GOOGLE_CLIENT_ID`), ADR 0025 and `docs/adr/README.md`, and a line in `docs/notes/milestones.md`.
