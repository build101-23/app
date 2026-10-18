# Supermarket logos in "Dónde comprar"

Status: **done** in code (2026-10-18); PR after #19 merges. Branch `feat/store-logos`, stacked on `feat/fill-cart` (build101-23/app#19). Rebase it onto `main` once #19 merges, then open its own PR.

## Context
The List tab names the supermarkets as text (Disco, Géant, Ta-Ta). As a plus to the cart buttons ([fill-cart plan](2026-10-18-fill-cart.md)), the user asked for their logos.

## Decisions (made in chat, 2026-10-18)
- **Source:** each chain's official SVG from its own website, copied byte for byte. Checked on 2026-10-18; none has scripts, event handlers, embedded images or external references.

  | Chain | File on the site | Size | Notes |
  | --- | --- | --- | --- |
  | Disco | `https://www.disco.com.uy/img/Disco/logo.svg` | 3.3 KB | Only the red oval. `logo-header.svg` adds a "FRESH MARKET" seal, so it's not used. |
  | Géant | `https://www.geant.com.uy/img/Geant/logo-header.svg` | 2.0 KB | Green wordmark. |
  | Ta-Ta | `https://www.tata.com.uy/logoMobile.svg` | 1.9 KB | Red wordmark. `logo.svg` is all white, made for their red header, so it's not used. |

- **Where:** only in the "Dónde comprar" card:
  - next to the store name in the chosen option or the radio buttons;
  - in the per-store totals;
  - in the "Armar carrito en …" button.
  - The product lines under each item and the chat's list card keep the store's name as text.
- **Dark mode:** each logo sits on a small white pill with a 1px line border, in both themes, so the logos are never recolored.
- **The name stays for screen readers:** each logo is `alt` text or `aria-hidden` next to the visible name. A logo never replaces the only label.
- **Legal:** using the chains' logos to name them is a hackathon assumption, like the prices. It goes into the legal item in [open decisions](../notes/open-decisions.md).
- **Separate PR:** so #19 ships without waiting.

## Steps
1. Save this plan.
2. Copy the three SVGs into `src/assets/stores/{disco,geant,tata}.svg` and record their origin, date and size in `docs/design.md`, as is done for the VIVERI logo.
3. Add a `StoreLogo` component in `src/ui.tsx`: an `<img>` at a fixed height inside the white pill, with a `--store-logo-h` token. Use it in the three places in "Dónde comprar" (`src/List.tsx`, `src/Cart.tsx`).
4. Check with `npm run dev:fixture`, `cart=tata` and `cart=split`, at 360, 390 and 1280 px, light and dark, with the per-store totals wrapping. Then `npm test`, lint and build.
5. **Docs step:**
   - `docs/design.md`: the List card's logos, the pill, and the logo files and their origin;
   - `docs/notes/open-decisions.md`: the logo assumption in the legal item;
   - no ADR, since it's a visual detail inside ADR 0025's system.
6. Rebase onto `main` after #19 merges, then commit and open the PR after the user's OK.
