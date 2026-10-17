# 0011. The saved profile travels into each chat

- Status: Accepted
- Date: 2026-10-17

## Context
Users can now have several chats. Until then the model only knew the profile from the one conversation's history. In a new chat it would ask everything again, and in an old chat it could call `save_profile` from a stale view and overwrite what another chat saved, since each call replaces the whole profile.

Options: put the profile in the system prompt (breaks the frozen, cached prompt from [ADR 0007](0007-sonnet-for-chat.md) on every change), add it to every message (wastes tokens), or add it only when it changed.

## Decision
- When the saved profile differs from the last copy a conversation has seen, the `chat` function puts it at the start of the new user message as a `<saved_profile>` text block. It is stored with the message, so the history still replays byte for byte.
- The system prompt explains the block once; the web app hides it.

## Consequences
- New chats start knowing the user; old chats catch up before saving.
- After a `save_profile` in the same chat, the next message repeats the profile once (a few hundred tokens). Not worth avoiding for now.
