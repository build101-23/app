# 0026. Naranja zapallo colors

- Status: Proposed
- Date: 2026-10-17
- Supersedes the colors of [0024](0024-coral-identity-and-glass-dock.md); its dock, layout and logo geometry stay.

## Context
Seeing Coral manda (coral, aquamarine and black) in the running app, the user kept the floating glass dock but not the colors. They tried eleven palettes in the dev picker ([plan](../plans/2026-10-17-viveri-v2-palette-options.md)) and chose "Naranja zapallo", pumpkin orange and black, asking for it "un pelín más oscuro".

## Decision
- One color plus black. Orange #EA7402 (pure #FF7F00 lowered by 0.045 in OKLCH lightness, same hue) is the user's bubbles and "the one" (the active tab, send). Black #111111 is ink, the primary button in light mode and the mark's tile. The dark-mode primary is off-white.
- The brand field is all orange, #E96104 to #F09912. The mark's pairs go from darkest outside to lightest inside, with a white apex. The favicon, logo SVG, manifest and theme colors follow.
- Coral manda moves to the dev picker as one of the alternatives (`src/dev/directions.css`).

## Consequences
- Every text pair passes 4.5:1 and every UI graphic 3:1, in both themes, by calculation. Black on the orange is 6.3:1.
- Orange is never text: 3.0:1 on white and 2.7:1 on the ground.
- With one color doing both jobs, the active tab and send are told from the user's bubbles by shape, the ink ring and position, not by hue.
- Dock label contrast on real pixels was measured for Coral manda, not yet for the orange.
