# VIVERI visual redesign

Status: **built, in review** (isolated copy, not merged). Results are at the end.

## Context
The app works (magic-link sign-in, four tabs, streaming chat, read-only profile) but looks like a placeholder: GitHub Primer colors, a purple favicon, and "app" as the title, manifest name and iOS home-screen name. The name VIVERI and its seven-dot "Seven into One" mark are approved (source files: `C:\prompt-lab\assets\logo-app\v1\recommended-icon.svg` and `recommended-horizontal.svg`). This plan gives the app a visual system built on that identity and applies it to every current screen. Behavior, factual copy and product rules stay as they are; Menu and List stay visibly "not available yet".

Work happens in an isolated copy of commit `6bf25ae` (tracked files, `.env` excluded). The copy has its own git repository whose first commit is the untouched baseline, so `git diff` shows the whole redesign.

Workflow: the `impeccable` skill, Operate mode, code-led (no image generation available). Its context loader ran in the copy and read [product.md](../product.md) as the product context. The direction below was pinned by the brief (approved identity) and the approval of this plan, so the skill's direction roll did not run. Project rules win over skill defaults: the design system is documented in [design.md](../design.md), not a root `DESIGN.md`.

## Problems found (code and the deployed sign-in at 390 px)
1. No identity: Primer colors, purple favicon, `app` everywhere, a fixed `theme-color` even in dark mode.
2. Sign-in: no logo, no hint that the link replaces a password, Supabase's English error text in a Spanish UI, busy state shown only as 60% opacity.
3. Loading and errors: `App` renders nothing while the session loads; the chat shows its welcome before history loads, so it flashes for returning users; the profile renders nothing while loading and shows "nothing saved" when loading fails.
4. Shell: text-only tabs with a thin active state, no `:focus-visible` styles anywhere.
5. Chat: a fixed two-row textarea, a text send button, a literal "…" while streaming, bare red error lines; on Android the tab bar stays above the keyboard.
6. Profile: plain lists, "Cerrar sesión" styled as the screen's primary action, an empty state with no way to the chat.
7. Menu and List: the same "Muy pronto." line, nothing about what is coming.
8. Desktop: everything stretches across 1280 px.

## Direction contract

**THESIS.** The mark's idea becomes the interface's notation: seven dots (a week) converging on one tangerine point (the one list, the one next step). It refuses the category default: sage-and-cream wellness cards, AI gradients and sparkles.

**OWN-WORLD.** Restrained, with the shell committed. A green-tinted off-white ground (`#F3F6F2`) and white surfaces, green-black ink. The icon's deep green (`#0B3D2B`) owns the tab bar, the user's bubbles and primary buttons. Brand green (`#1E8A5E`) draws the mark and graphics. Tangerine (`#E85D2A`) is a graphic only, never text, and marks "the one": the active tab, the send button, the mark's apex. Matching dark theme. System sans, tight scale, 16 px body. Round shapes taken from the dots: pill controls, a circular send button, 16 px cards.

**STORY.** You sign in with your email, land in the chat, talk, see what the chat saved in Perfil, and can tell that Menú and Lista are on the way.

**FIRST VIEWPORT (390 px).** Sign-in: color logo top left, "Ingresar", a one-line no-password hint, a 52 px email field, a full-width deep-green button; a success panel replaces the form after sending. Shell: a header with the screen title, the chat column, an auto-growing composer with a circular tangerine send button, then a deep-green tab bar (icon and label, active item white with a tangerine dot) padded to the safe area. At 960 px and wider the tab bar becomes a left rail with the icon tile; content is capped at 720 px.

**FORM.** Operate mode, standard controls and a tab bar; the world lends palette, type, density and one signature move: the mark drawn as seven real circles is the state glyph (typing indicator, loading splash), the tangerine dot marks the active tab, and seven day dots stand for the week on the Menu placeholder. Static under reduced motion. Pinned direction, no seed key.

**FINISH.** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance. (Here DESIGN.md is `docs/design.md`.)

## Steps
1. Save this plan.
2. Brand assets: `public/favicon.svg` becomes the approved icon (byte for byte); `src/assets/viveri-logo.svg` is the approved horizontal logo (byte for byte); `public/icons/icon-180.png`, `icon-192.png`, `icon-512.png` are rendered from the icon SVG with headless Edge. `index.html`: title and iOS title "VIVERI", `apple-touch-icon`, a light and a dark `theme-color`, `interactive-widget=resizes-content`. Manifest: name, `lang`, colors, SVG and PNG icons, a maskable 512.
3. `src/index.css`: tokens (color, space, radius, type, motion, safe areas), themed browser surfaces (focus ring, selection, caret, scrollbars), buttons, field, cards, chips, status pill, inline alert, skeletons, the shell grid (bottom bar, left rail at 960 px), chat column and composer. The tab bar hides while the on-screen keyboard is up and the composer has focus (changed from "while the composer has focus" after the finish review). One `prefers-reduced-motion` block turns all motion off.
4. `src/ui.tsx`: the `Mark` component (seven circles with the icon's exact geometry, optional typing animation) and authored 24 px stroke icons.
5. `src/App.tsx`: a delayed splash instead of a blank screen; sign-in with logo, hint, busy label, success panel and a Spanish error with the provider detail below; tab bar with icons; Menu and List placeholders; the profile can switch to the chat.
6. `src/Chat.tsx`: skeleton until history loads, then the welcome only if empty; the mark as the typing indicator; `role="log"`; inline alert for errors; auto-growing textarea; icon send button. Streaming, rollback and limits unchanged.
7. `src/Profile.tsx`: loading skeleton, a real error state, facts and lists as cards with chips, an account section with a secondary sign-out button, an empty state that links to the chat. Same query and display rules.
8. `src/strings.ts`: the new Spanish strings. No price, savings or medical claims.
9. Dev fixture: `npm run dev:fixture` swaps `./supabase` for `src/dev/fixture.ts` (synthetic data, query-string scenarios, simulated safe areas). Never part of the production build.
10. Verify: `npm run build`, `npm run lint`, no fixture code in `dist/`; screenshots at 360, 390 and 1280 px in light and dark across every state; keyboard focus; computed contrast; reduced-motion rules; the impeccable detector; one fresh finish review and one fix batch.
11. Docs: new [design.md](../design.md); ADR 0008 and the ADR index; the stack line in [architecture.md](../architecture.md); the fixture in [development.md](../development.md); the name in [product.md](../product.md) and [open-decisions.md](../notes/open-decisions.md); the README heading.

## Results
- `npm run build` passes; `npm run lint` (oxlint) finds 0 warnings and 0 errors on 11 files; no fixture code ends up in `dist/`; `impeccable detect` reports no findings.
- Screens were captured with headless Edge driven over the DevTools protocol, from the dev fixture: 360×640, 390×844 and 1280×800, light and dark, every state listed in step 10, plus keyboard focus, simulated safe areas, a simulated on-screen keyboard (viewport shrunk while typing), and emulated reduced motion. The captures and measured notes are in `.impeccable/review/` (local review evidence, not part of the app).
- Computed contrast: every text pair ≥ 4.5:1 and every UI graphic ≥ 3:1, in both themes.
- Finish review: a fresh reviewer returned `fix` with seven findings (Menu dots read as radio buttons, Menu copy implied the user's plan wasn't ready, load errors had no retry, the tab bar stayed hidden after the keyboard closed, a double focus ring, the busy button looked disabled, desktop alignment). All seven were fixed. Its second verdict scored them resolved and found one regression (the scrollbar gutter narrowed the chat's composer on desktop), which was fixed and confirmed by measurement, without a third review round.
- Not verified: a real on-screen keyboard, iOS standalone mode, real device safe areas, and real Supabase sign-in (the copy has no `.env`).
