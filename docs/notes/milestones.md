# Milestones

Build order for the first version ([scope](../product.md#scope)). Each milestone gets its own plan in [plans/](../plans/) before coding. Tick it off when it's merged.

- [x] **1. Skeleton**: Vite React PWA, sign-in with Supabase's default magic link, an empty app shell with tabs (Chat, Menu, List, Profile).
- [x] **Hosting**: Cloudflare Worker, deploys on every push to `main` ([ADR 0005](../adr/0005-cloudflare-workers.md)).
- [x] **2. Chat** ([plan](../plans/2026-10-17-chat.md)): Supabase Edge Function `chat` → Claude (streaming). Chat UI, chats saved, likes and restrictions saved to the profile, the AI nutritionist rules in the system prompt.
- [x] **3. Plan and weekly menu** ([plan](../plans/2026-10-17-plan-and-menu.md)): the AI produces a structured plan and menu. A menu screen, and swapping a meal by chat or tap.
- [x] **4. Shopping list** ([plan](../plans/2026-10-17-shopping-list.md)): a list built from the menu (units as sold, sections; amounts are already raw as bought, [ADR 0013](../adr/0013-menu-saved-by-a-chat-tool.md)), what you have at home crossed out or reduced in the list or told to the chat, share to WhatsApp, copy.
- [x] **Price catalog** ([plan](../plans/2026-10-17-price-catalog.md)): real prices from Devoto, Géant, Disco and Ta-Ta in Supabase, read by the scraper ([ADR 0015](../adr/0015-price-scraper-python-job-with-time-budget.md), [ADR 0018](../adr/0018-gdu-listings-and-food-pages.md), [ADR 0016](../adr/0016-price-catalog-one-row-per-product-per-chain.md)).
- [x] **5. Prices and store rule**: the shopping list priced from the real price catalog, the store rule and savings with tests, and CI on Tenki runners.
  - [x] The store rule, savings and CI, on example prices for Disco, Géant and Ta-Ta ([plan](../plans/2026-10-17-prices-and-store-rule.md)).
  - [x] Price the list from the catalog: the chat agent searches `store_products` and builds the menu from real products, with an optional budget; the example prices are gone ([plan](../plans/2026-10-17-agent-builds-menu-from-products.md), [ADR 0024](../adr/0024-agent-builds-the-menu-from-real-products.md)).
- [ ] **Sign in with Google** ([plan](../plans/2026-10-17-google-sign-in.md)): Google's own button next to the magic link, so sign-in stays inside an installed iOS app. Code done; waiting on the Google Cloud and Supabase setup and an iPhone test.
- [ ] **6. Pilot ready**: health-data consent, numbers switch ([done](../plans/2026-10-17-numbers-switch.md)), "Order it for me" button, events for the learning table, real app icons, our own SMTP sender and sign-in with an emailed code (a magic link opens Safari, outside an installed iOS app).
- [ ] **Later**: SIPC prices, to fill gaps and check ours ([ADR 0003](../adr/0003-price-sources.md)).
