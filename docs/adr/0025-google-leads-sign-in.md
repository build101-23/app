# 0025. Google's button leads the sign-in screen

- Status: Proposed
- Date: 2026-10-17

## Context
The magic link opens Safari, outside an installed iOS app ([milestones](../notes/milestones.md), milestone 6), so we add Google's own sign-in button next to it. It uses Google Identity Services with `supabase.auth.signInWithIdToken` and a nonce, not Supabase's redirect flow (`signInWithOAuth`), so sign-in never navigates away from an installed app and a stolen ID token can't be replayed. One check is still open: on Safari, which has no FedCM, Google opens a popup, and nobody has yet confirmed on a real iPhone that it hands the token back to an installed app. Until then, the magic link stays.

This redesign had to place that button on the sign-in card. Options:
- Both side by side, equal weight: two primary actions, and no answer to "which one do I use?".
- Google first, email behind a quiet link: one obvious action, and email stays one tap away.
- Google only: locks out anyone without a Google account, and anyone on a device where Google's script can't load.

## Decision
- Google's official button is the card's one primary action: pill-shaped, black in light mode and white in dark mode, in Spanish (`es-419`).
- The magic link stays behind a quiet "Entrar con tu email" link that opens the form in place and moves focus to the email field. Once Google leads, the form's own button turns secondary.
- The email form is the only way in, with a primary button and the email hint in the header, when `VITE_GOOGLE_CLIENT_ID` is empty or Google's script can't load. If the script can't load, the card says so ("Google no está disponible ahora. Entrá con tu email.").
- `src/GoogleSignIn.tsx` loads Google's script on the sign-in screen only (reusing it if it's already on the page), passes a hashed nonce, and hands the ID token to `signInWithIdToken`. It also adds the theme, the shape and the hand-over to email.

## Consequences
- One tap for anyone with a Google account, and nobody is locked out when Google isn't there.
- Open questions: the iPhone popup check; every origin the app runs on must be listed in the Google client's authorized JavaScript origins; and the App Store asks apps with Google sign-in to also offer Sign in with Apple, so the Capacitor move ([ADR 0002](0002-pwa-now-capacitor-later.md)) must add one.
- Supabase links identities with the same verified email to one user, so Google and email don't create two accounts.
- The button's look and text are Google's. Only its theme, shape, size and language fit the identity ([design.md](../design.md#sign-in-card)).
- The fixture fakes Google's button (`src/dev/fixture.ts`), so the screen can be reviewed without a Google client or the network. The real popup is not exercised here.
