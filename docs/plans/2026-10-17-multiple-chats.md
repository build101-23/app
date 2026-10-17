# Multiple chats

Status: **done**.

## Context
Until now each user had one ongoing chat. The user wants to start a new chat and go back to old ones and keep going. The profile stays one per user, shared by every chat.

Same commit: the system prompt only answers questions about food and the app, is more concise, and no longer asks whether the user follows a nutritionist's plan.

## Design
- **Table `conversations`**: `id uuid`, `user_id`, `title` (first message, cut to 60 characters), `created_at`, `updated_at` (last activity, for sorting). `messages` gets a `conversation_id` that is required. Existing messages move to one conversation per user.
- **The browser creates the conversation** (RLS allows it) when the first message of a new chat is sent, then calls `chat` with `{ text, conversation_id }`. If the first turn fails, the browser keeps the id and the retry reuses it.
- **Edge function**: loads only that conversation's history, stores the new rows with its id, and bumps `updated_at`.
- **The profile reaches every chat.** Before this change the model only knew the profile from the conversation itself. Now, when the saved profile differs from the last one this conversation has seen, the new user message starts with a `<saved_profile>` text block. Without it, a new chat would ask everything again, and an old chat would overwrite newer data with a stale `save_profile`. The system prompt stays frozen; it only explains the block. The UI hides those blocks.
- **UI** (Chat tab): a bar with "Chats" (list of chats, most recent first, tap to open) and "Nuevo chat". On open, the most recent chat is shown.

## Steps
1. Save this plan.
2. Prompt changes in `supabase/functions/chat/prompt.ts`.
3. Migration `supabase/migrations/<timestamp>_conversations.sql`.
4. `supabase/functions/chat/index.ts`: `conversation_id`, filtered history, profile block, `updated_at`.
5. `src/Chat.tsx`, `src/strings.ts`, `src/index.css`: chat bar, list, new chat, hidden profile blocks.
6. `npm run build`, `npm run lint`.
7. Release, in this order: `npx supabase db push`, `npx supabase functions deploy chat`, then push to `main` (Cloudflare deploys the web app).
8. Docs: `docs/architecture.md` (data model, flow), `docs/product.md` (chats, assistant behavior), ADR 0011 for the profile block.
