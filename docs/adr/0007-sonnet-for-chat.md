# 0007. Claude Sonnet 5.5 at medium effort for the chat

- Status: Accepted
- Date: 2026-10-17

## Context
[ADR 0004](0004-vite-react-supabase-claude.md) picked `claude-opus-5-5` for the AI nutritionist. The chat is a conversation: short turns, where latency and cost per message matter more than deep reasoning.

## Decision
- The `chat` Edge Function uses `claude-sonnet-5-5` with `effort: medium`, adaptive thinking and streaming.
- The server-side refusal fallback is on (`fallbacks: "default"`).
- The history is append-only: each message's content is stored exactly as sent or returned, thinking blocks included, and replayed as is. `prefix_mismatch_behavior: "drop_block"` keeps old chats working when the system prompt changes.

## Consequences
- Faster and cheaper replies than Opus.
- Harder tasks later (building a full plan and menu, milestone 3) may need a higher effort or a different model for that one call. That gets measured, not assumed.
