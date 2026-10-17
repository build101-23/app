# 0014. The client only reads; the chat function writes, under a daily cap

- Status: Accepted
- Date: 2026-10-17

## Context
Every table had a `for all` owner policy, so any signed-in user could write their own `messages`, `profiles` and `menus` rows straight through the REST API with the publishable key. They could forge chat history, skip the `chat` function's 4000-character limit, and make the function replay a huge history to Claude on our key. Sign-up is open and nothing capped a user's turns ([plan](../plans/2026-10-17-lock-down-writes.md)).

We had to decide:
- **Who writes the AI's data.** Options: keep owner writes and validate in triggers, or let only the `chat` function write, with the service-role key.
- **How the browser keeps its two writes** (a new chat's `conversations` row, and `menus.confirmed_at` from the Confirm button). Options: a column-level grant, or a security-definer RPC.
- **How to cap use.** Options: count turns already in `messages`, or keep an atomic counter.

## Decision
- **Users only `select` `messages`, `profiles` and `menus`.** The `chat` function writes them with the service-role key, naming the `user_id` from the verified token. It still reads with the user's token, so row-level security scopes every read.
- **The browser still creates `conversations`** (their title never reaches Claude), and **may update only `menus.confirmed_at`**, through an owner update policy and a column-level grant. That's smaller than an RPC and needs no client change.
- **100 user turns in a rolling 24 hours**, counted from `messages`. Over the cap, `chat` answers 429 before calling Claude, and the Chat tab says so.

## Consequences
- A user can't put anything in front of Claude that didn't go through the function's checks.
- New tables follow the same rule: `select` only, unless the browser must write them ([development.md](../development.md#secrets)).
- A migration that takes away a write must ship after the function that stops making it. Here: deploy `chat`, then `db push`.
- The function holds a key that skips row-level security, so a bug in it can write another user's rows. Every write names its row explicitly.
- The cap is a speed bump, not a guarantee. Turns are stored when the reply ends, so parallel requests all pass the check, and anyone can sign up again. If that happens, add an atomic counter and limit sign-ups.
