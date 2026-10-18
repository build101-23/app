# Default calories

Status: **done** in code; the function deploy is pending.

## Context
- Asked for: menus built with no calorie request came out low (one said 1600 kcal a day). By default a menu should aim at maintenance, about 2000 kcal a day, and go lower or higher only when the user asks for a cut or a surplus.
- The reference: 2000 kcal is the Nutrition Facts reference; the 2020–2025 Dietary Guidelines estimate about 2000–2200 kcal for moderately active adult women and 2400–2800 for men.
- The profile has no sex, weight or activity, and the menu is built to calories even when the numbers switch is off.

## Design
- **One rule in the chat prompt**, under the weekly menu, so it applies with numbers on or off: with no calorie target, the day adds up to about 2000–2200 kcal; a weight-loss goal is a moderate deficit, a gain goal a moderate surplus; a number from the user or their nutritionist's plan wins. Higher when the user says they're a man, very active or training hard.
- No new profile fields: asking sex or weight would break "ask only goal and what they can't eat".

## Steps
1. Save this plan.
2. `supabase/functions/chat/prompt.ts`: the rule.
3. Deploy the function and try it against the hosted project.
4. Docs: `docs/product.md`.
