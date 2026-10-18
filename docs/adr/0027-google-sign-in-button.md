# 0027. Sign in with Google's own button

- Status: Accepted
- Date: 2026-10-17

## Context
Sign-in was Supabase's magic link only, and the link opens Safari, outside an installed iOS app ([milestones](../notes/milestones.md), milestone 6). We wanted a one-tap way in that keeps the session inside the app. Options:
- Supabase's redirect flow (`signInWithOAuth`): the least code, but the page navigates to Google and back, which on an installed iOS app can end up in Safari, like the magic link.
- Google's own button (Google Identity Services) with `supabase.auth.signInWithIdToken`: Google hands a signed ID token to the page and Supabase turns it into a session. The app never navigates away.
- Firebase Auth or Google Cloud Identity Platform: a second auth system next to Supabase, whose row-level security is built on Supabase's own user ID. Rejected.

## Decision
- Google's official button, with its script loaded from `accounts.google.com` on the sign-in screen only, and `signInWithIdToken` with a nonce so a stolen ID token can't be replayed.
- The magic link email stays as the other way in. The button is hidden while `VITE_GOOGLE_CLIENT_ID` is empty.

## Consequences
- One tap for anyone with a Google account, and no email to wait for.
- Supabase links identities with the same verified email to one user, so signing in with Google and with email doesn't create two accounts.
- Not yet proven: Safari has no FedCM, so there the button opens a Google popup. Whether that popup returns the token to an installed iOS app has to be tested on a real iPhone. If it doesn't, the email form still works, and the move to Capacitor ([ADR 0002](0002-pwa-now-capacitor-later.md)) would use native Google sign-in instead.
- The button's look and text are Google's. We only choose theme, size and locale.
- Every origin the app runs on must be listed in the Google client's authorized JavaScript origins.
- The App Store asks apps with Google sign-in to also offer a privacy-focused option such as Sign in with Apple, so the Capacitor move must add one.
