# Profile tab redesign: header + cards

Status: **built on `feat/profile-redesign`**, approved by the user in the local fixture.

## Context
The Profile tab doesn't look like the rest of the app. Menu and the chat cards use **cards with the title inside**, rows under hairlines and a caption label above the value. Profile mixes styles instead:
- a facts card;
- chip groups loose on the ground, with 1rem headings outside any card;
- "Preferencias" and "Cuenta" each as a heading over its own card;
- an account card where the email and "Cerrar sesión" wrap awkwardly;
- a switch label that wraps to two lines at 375px.

The user picked **"Encabezado + tarjetas"** and **no "Cambiar en el chat" button** (the profile stays read-only).

Target (phone):
```
(P)  persona@ejemplo.com            ← identity header, on the ground
╭ Sobre vos ───────────────────╮    ← card, title inside (like Menu's day card)
│ Objetivo (caption, muted)    │
│ Comer más ordenado…          │
│──────────────────────────────│
│ Comidas por día / 4 …        │
╰──────────────────────────────╯
╭ Tus gustos ──────────────────╮
│ No puedo comer               │
│ (gluten) (pescado)           │
│──────────────────────────────│ …
╰──────────────────────────────╯
╭──────────────────────────────╮
│ Mostrar números        [ ○ ] │    ← switch row: title + muted hint
│ Calorías y macros en tu menú │
╰──────────────────────────────╯
( Cerrar sesión )                   ← secondary pill, last
```

## Steps

1. **Save this plan** as `docs/plans/2026-10-18-profile-redesign.md` (AGENTS.md rule).

2. **`src/Profile.tsx`**
   - **Header:** at the top of `.page.profile`, shown in every state (loading, error, empty), since the session is already there:
     - `<header className="identity">` holding a 56px `.avatar` circle (`aria-hidden`) with the email's first letter in uppercase;
     - then the email in `<p>`;
     - with no email (possible in Supabase's types), the circle shows `<ProfileIcon />` from `src/ui.tsx` instead.
   - **`Saved`:** two `<section className="card profile-card">`, each with an `<h2>` and a `<dl>`. Each row is a `<div>` holding a `<dt>` label and a `<dd>`:
     - "Sobre vos" holds the facts (unchanged logic);
     - "Tus gustos" holds the four lists, each `<dd>` holding the existing `<ul className="chips">`;
     - a card with nothing to show isn't rendered;
     - the empty state (`EmptyState`) is unchanged.
   - **Switch:** a `.card` holding the existing `label.switch`, with no visible heading. The label gets two lines, `t.profile.numbers` and a `<small>` with `t.profile.numbersHint`. The optimistic toggle, the rollback and the `Alert` stay as they are.
   - **Sign-out:** the `.account` section goes away, and "Cerrar sesión" becomes the page's last element: `button secondary`, aligned to the start.
   - **Skeleton:** rewrite it to the new shape. Keep the `role="status"` wrapper and its sr-only label, inside a `skeleton` element. Inside, two `card profile-card` blocks: a title bar, then rows of a label bar plus a value bar (3 rows), or a label bar plus a chip bar (2 rows). They reuse the real classes, so the hairlines and gaps match.

3. **`src/strings.ts`** (`t.profile`)
   - Add `about: 'Sobre vos'`, `tastes: 'Tus gustos'` and `numbersHint: 'Calorías y macros en tu menú'`.
   - Change `numbers` to `'Mostrar números'`.
   - Delete `settings` and `account`: grep shows only `Profile.tsx` uses them. `openChat` stays, because Menu uses it too.

4. **`src/index.css`**, in the `/* Profile */` block. Tokens only, no new values beyond the sizes below.
   - `.profile` gap goes from 28px to 16px, since cards need less air than loose groups.
   - `.identity`: flex, centered, 14px gap.
   - `.avatar`: 56px circle, `--surface-sunk` fill, `--brand-ink` letter at 1.375rem/650.
   - `.identity p`: 650 weight, `overflow-wrap: anywhere`.
   - `.profile-card`: `padding: 0 16px`.
     - Its `h2` matches `.day-card h2` (16px 0 8px, 1.25rem/1.3). Share the rule as `:is(.day-card, .profile-card) h2` and keep `text-transform: capitalize` on `.day-card` only.
     - `dl > div`: 12px vertical padding and a `--line` border-top.
     - `dt`: the same as Menu's `.slot`, so muted, 0.8125rem, 600.
     - `dd`: margin 2px 0 0, `overflow-wrap: anywhere`, tabular numbers.
     - `.chips`: margin-top 6px.
   - `.switch small`: block, muted, 0.8125rem.
   - `.profile > .button`: `justify-self: start` (the grid would stretch it).
   - Delete the rules nothing uses any more: `.facts*`, `.group*`, `.settings h2`, `.account*`. Keep `.settings .alert`'s spacing under the new class.
   - Replace the profile skeleton rules (`.facts.skeleton`, `.group.skeleton`) with `.profile-skeleton` ones of the same sizes.

5. **Docs step**
   - **`docs/design.md`:**
     - rewrite the **Profile** component section (header, the two cards, the switch row with its hint, sign-out last, no visible "Preferencias"/"Cuenta" headings);
     - **Typography hierarchy:** Title now also covers the Profile card titles; drop "profile section headings" from Label and "definition-list labels above profile values" from Meta (labels are caption now);
     - **Layout → Spacing:** "Profile cards are 16px apart";
     - **Skeletons:** "Profile has its two cards";
     - **Chips:** they now sit inside the "Tus gustos" card.
   - **`docs/adr/0038-profile-as-cards.md`** (short: context, decision, consequences), plus its row in `docs/adr/README.md`.

## Verification (before any commit)
- `npm run build` and `npm run lint` pass.
- The fixture server already running on **http://localhost:5199** serves this checkout (it's another chat's process, with HMR), so the edits show up there. Check:
  - `?profile=full`, `?profile=empty`, `?profile=error`, `?loading=data`, `?numbers=on`, `?numbers=error` (toggle it: it should roll back and show the alert);
  - at 360px, 390px and 1280px;
  - the end of the page clears the glass dock.
- Screenshots go to the user, and the user approves the look.
- Then reset the preview to desktop and light.
- **Only after the user's OK:**
  - `git switch -c feat/profile-redesign` (never push to `main`: every push there deploys);
  - commit the code, docs and plan;
  - push;
  - open the PR from the app.

## Skipped
- The Google name or photo in the header. The fixture user has no name to check it against.
- An edit button (the user declined it).
- Any change to how the profile is saved or loaded.
