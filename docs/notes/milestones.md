# Milestones

Build order for the first version ([scope](../product.md#scope)). Each milestone gets its own plan in [plans/](../plans/) before coding. Tick it off when it's merged.

- [x] **1. Skeleton**: Vite React PWA, sign-in with Supabase's default magic link, an empty app shell with tabs (Chat, Menu, List, Profile).
- [x] **Hosting**: Cloudflare Worker, deploys on every push to `main` ([ADR 0005](../adr/0005-cloudflare-workers.md)).
- [x] **2. Chat** ([plan](../plans/2026-10-17-chat.md)): Supabase Edge Function `chat` → Claude (streaming). Chat UI, chats saved, likes and restrictions saved to the profile, the AI nutritionist rules in the system prompt.
- [x] **3. Plan and weekly menu** ([plan](../plans/2026-10-17-plan-and-menu.md)): the AI produces a structured plan and menu. A menu screen, and swapping a meal by chat or tap.
- [ ] **4. Shopping list**: a list built from the menu (units as sold, sections; amounts are already raw as bought, [ADR 0013](../adr/0013-menu-saved-by-a-chat-tool.md)), tick off items, share to WhatsApp, copy.
- [ ] **5. Prices (fake) and store rule**: seeded fake prices for 3 stores, the store rule and savings with tests, and CI on Tenki runners.
- [ ] **6. Pilot ready**: health-data consent, numbers switch, "Order it for me" button, events for the learning table, real app icons, our own SMTP sender and sign-in with an emailed code (a magic link opens Safari, outside an installed iOS app).
- [ ] **Later**: real prices from supermarket websites and SIPC ([ADR 0003](../adr/0003-price-sources.md)).
