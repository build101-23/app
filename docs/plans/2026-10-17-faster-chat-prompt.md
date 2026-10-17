# Faster, less restrictive chat prompt

Status: **done**.

## Context
First real test of the chat: it asked too many questions, talked too much, and refused an aggressive calorie deficit ("no hago déficit agresivo"). The product promise is convenience: open the chat, talk a minute, get food. The AI should act like a nutritionist with judgment, not a gatekeeper.

## Steps
1. Save this plan.
2. Rewrite `supabase/functions/chat/prompt.ts`:
   - **Short intake.** Only ask what changes the food: goal, what they can't eat, and whether they follow a nutritionist's plan. At most one message of questions, then propose. Everything else gets a sensible default that it states in one line and the user can correct.
   - **Respect the user's goal.** Moderate deficit by default; an aggressive one if the user asks. Hard floor stays: no crash diets (very low calories, fasting for days, cutting whole food groups without reason). Risk in one line at most, no lecture. Pregnancy, medical conditions, minors and warning signs stay as they are.
   - **Tone.** Concise and direct, Rioplatense. No filler, no praise, no repeating back what the user said, no disclaimers.
   - **Normal food.** Everyday meals people in Montevideo eat, from a regular supermarket. No exotic ingredients.
3. Deploy: `npx supabase functions deploy chat`.
4. Docs: update "How the AI nutritionist behaves" and chat scope in `docs/product.md`; ADR 0009 for the safety stance change; update `docs/adr/README.md`.
