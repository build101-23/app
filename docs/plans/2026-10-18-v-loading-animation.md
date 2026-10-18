# The V assembles while a reply loads

Status: **done** (2026-10-18). Branch `feat/v-loading-animation`, from `main`. Checked frame by frame in headless Chrome without reduced motion (splash and the waiting bubble at 360px), and static with reduced motion.

## Context
While a reply hasn't started, the chat's waiting bubble shows the mark with `converge`: the seven dots dim and brighten in turn, without moving. The user asked for the V's animation there, the motion explored in the VIVERI motion preview (`C:\prompt-lab\previews\viveri-motion\v1`): the dots arrive in pairs along the V's arms and converge on the orange point.

## Decisions (made in chat, 2026-10-18)
- Replace `converge` with an assembling loop, `assemble`, on the same `Mark` component. It's used wherever the mark is animated: the waiting bubble and the splash.
- Each cycle, 1.6s:
  - the pairs arrive from the outer pair inward, 80ms apart, each sliding 6 units toward the point along its arm while fading in;
  - the orange point arrives last, scaling from 0.85;
  - the whole V holds, then fades out before the next cycle starts, so cycles never overlap.
- `transform` and `opacity` only, with the existing `--ease` token on the arrival. A CSS animation, so it keeps running smoothly while the page is busy with the stream.
- Reduced motion: unchanged. The global rule turns animations off, and the mark shows all seven dots, static.

## Steps
1. Save this plan.
2. `src/ui.tsx`: mark each arm dot as `left` or `right`, so the CSS can slide it along its own arm.
3. `src/index.css`: replace `converge` with `assemble` (dots) and `assemble-point` (the point), with the timings above.
4. Check with the fixture (`reply=slow` for the waiting bubble, `loading=session` for the splash) at 360 and 1280 px, by stepping the animation's frames. Then lint, tests and build.
5. **Docs step:** `docs/design.md`, the mark component and the Motion table. No ADR: it's a motion detail inside ADR 0025's system.
