# 0009. The AI nutritionist uses judgment, not gatekeeping

- Status: Accepted
- Date: 2026-10-17

## Context
The first chat prompt asked for a full profile before helping, and refused an aggressive calorie deficit. In testing that felt slow and paternalistic, which breaks the product's main promise: convenience.

## Decision
- The chat asks only for the goal, what the user can't eat, and whether they follow a nutritionist's plan. It assumes the rest, says so, and proposes meals right away.
- The user chooses their goal, aggressive deficits included. The one hard limit is crash dieting: about 1200 kcal a day for women and 1500 for men, no multi-day fasting, no cutting whole food groups without reason.
- Pregnancy, medical conditions, minors and eating-disorder warning signs still go to a professional.

## Consequences
- Shorter chats; users correct proposals instead of answering questions.
- More responsibility on the model's judgment. Worth reviewing pilot chats for cases where it went too far.
