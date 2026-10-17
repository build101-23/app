# 0010. Google's button leads the sign-in screen

- Status: Proposed
- Date: 2026-10-17

## Context
The team decided to add Google's own sign-in button next to the magic link (decision "Sign in with Google's own button" in the main repo, uncommitted when this preview was made). That decision chose Google Identity Services with `supabase.auth.signInWithIdToken` and a nonce over Supabase's redirect flow, so sign-in never leaves an installed iOS app. The decision still needs one check: on Safari, which has no FedCM, Google opens a popup, and nobody has yet confirmed on a real iPhone that it hands the token back to an installed app. Until then, the magic link stays.

This redesign had to place that button on the sign-in card. Options:
- Both side by side, equal weight: two primary actions, and no answer to "which one do I use?".
- Google first, email behind a quiet link: one obvious action, and email stays one tap away.
- Google only: locks out anyone without a Google account, and anyone on a device where Google's script can't load.

## Decision
- Google's official button is the card's one primary action: pill-shaped, black in light mode and white in dark mode, in Spanish (`es-419`).
- The magic link stays behind a quiet "Entrar con tu email" link that opens the form in place and moves focus to the email field. Once Google leads, the form's own button turns secondary.
- The email form is the only way in, with a primary button and the email hint in the header, when `VITE_GOOGLE_CLIENT_ID` is empty or Google's script can't load. If the script can't load, the card says so ("Google no está disponible ahora. Entrá con tu email.").
- The token, nonce and Supabase calls are the main repo's `GoogleSignIn.tsx` unchanged. This preview only adds the theme and shape, reuses Google's script if it's already on the page, and adds the hand-over to email.

## Consequences
- One tap for anyone with a Google account, and nobody is locked out when Google isn't there.
- The decision's open questions carry over unchanged: the iPhone popup check, the authorized JavaScript origins, and Sign in with Apple at the Capacitor move.
- The button's look and text are Google's. Only its theme, shape, size and language fit the identity ([design.md](../design.md#sign-in-card)).
- The fixture fakes Google's button (`src/dev/fixture.ts`), so the screen can be reviewed without a Google client or the network. The real popup is not exercised here.
- When this preview merges into the main repo, the two numbering sequences must be reconciled: there, 0008 is the Google decision.
