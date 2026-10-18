# Product

Living doc: how the product is *now*. Future ideas live in [notes/roadmap.md](notes/roadmap.md), open questions in [notes/open-decisions.md](notes/open-decisions.md).

## Problem

Following a diet means turning a plan into meals, a shopping list and a trip to the store, every week. It's tedious, and it's easy to overspend.

**VIVERI** is a phone app that turns your diet into food at home, with two promises: **it's convenient, and it saves you money.** You build the diet by chatting with an AI nutritionist, and if you already have a nutritionist's plan, you tell it about it in the chat. The app turns it into a weekly menu and a shopping list, finds those products in the supermarkets, tells you where the whole list is cheapest and puts it in the supermarket's cart (Ta-Ta for now). Later, it will order the food for you every week.

### What makes it different

Price comparison apps already exist in Uruguay. [Cabacua](https://www.elobservador.com.uy/ciencia-y-tecnologia/crean-una-app-que-compara-mas-40-mil-productos-supermercados-montevideo-n6036499), for example, compares around 40,000 supermarket products in Montevideo. But you have to know what to look for.

This app starts from your diet. It knows what you need, how much, and which swaps your plan allows, so it can save you money without breaking the plan.

## Users

- Regular people in Montevideo who want to eat to a plan: gym-goers, patients of a nutritionist, or anyone building their own diet.
- First group: 10 to 15 people, from the gym, patients of 1 or 2 nutritionists, and friends. If they ask for orders, we place them by hand.

## How it works

1. You chat with the AI nutritionist. If you have a nutritionist's plan, you describe it in the chat.
2. The app combines that with your likes and restrictions, looks for the products the supermarkets sell, and proposes a menu with them: for the week, or for the days you ask ("para el finde", "los 3 días que vienen"), from tomorrow unless you say otherwise. You change it as you like. Your plan is your profile plus that menu.
3. The menu comes with its shopping list, priced at each supermarket, with the cheapest way to buy it on top. Change the menu and the list follows.
4. You share the list on WhatsApp or copy it.
5. The app puts the list in the supermarket's cart (Ta-Ta for now), and you log in and pay there. *(Later)* It places the order for you.

## Scope

The first version goes from a chat to a priced shopping list and the supermarket's cart, in Montevideo only. Placing the order and paying stay with you.

### In

#### 1. Chat with the AI nutritionist

- Text chat, in normal language.
- Several chats: start a new one, or go back to an old one and keep going. Your profile is shared by all of them.
- Enter sends; Shift+Enter adds a new line.
- Voice as dictation: tap the mic, speak, and the text appears in the box for you to check and send. It uses the browser's speech recognition ([ADR 0010](adr/0010-browser-speech-recognition.md)); where that's missing, the keyboard's dictation still works. No live voice conversation.
- If you don't have a plan, it builds one from scratch.
- If you have a nutritionist's plan, it follows what you tell it about that plan.
- It asks as little as possible: your goal and what you can't eat. It doesn't ask whether you have a nutritionist's plan; if you mention one, it follows it. Everything else it assumes, tells you, and lets you correct. Then it builds your menu right away, a week unless you ask for fewer days ([§4](#4-menu)), and shows a preview of it in the chat, with a button to the Menu tab, and tells you the shopping list is ready too. Ask it to see the menu and it shows the same preview.
- Ask for the shopping list ("dale", "mostrame la lista") and it shows it in the chat: what's left to buy by section, the total and what it comes to per day ([§6](#6-save-money)) at the end, and a button to the List tab. Then it asks what you already have at home.
- Tell it what you already have at home ("tengo dos bananas", "tengo medio kilo de pollo"), to take something off the list or to buy less, and the list in the chat updates with its new total. That never changes the menu. "Arranco semana nueva" clears it.
- Ask from the list for something you'd eat differently ("cambiame la carne por pollo", "sacame el brócoli del menú") and it changes the menu in the background, says in one line what changed, and shows the updated list.
- It builds the menu only with products it found at Disco, Géant and Ta-Ta ([ADR 0024](adr/0024-agent-builds-the-menu-from-real-products.md)), and can tell you the total, what it comes to per day, where it's cheapest and whether it fits your budget: the same numbers as the List tab. Whenever it says the total, it says the per-day amount too. It never writes the list or makes up a price.
- Tell it a budget for the shopping ("tengo $ 1.500") and it builds to fit: the split between two stores if that does it, otherwise cheaper foods your plan allows, never smaller amounts. If it still doesn't fit, it says how much is missing. With room, it picks known brands.
- Ask it to order or fill your cart ("pedímelo", "armame el carrito") and it sends you to the cart buttons in the List tab ([§5](#5-shopping-list)). It never says it placed an order or filled a cart.
- If you ask for something the stores don't sell, or something it can't do, it says so in one line.
- Normal, everyday food you can buy at any supermarket in Montevideo.

#### 2. Likes and restrictions

| Type | Example | What the app does |
| --- | --- | --- |
| Can't eat | allergy, celiac, vegetarian | Never shows up |
| Don't like | broccoli, fish | Avoids it; warns you if there's no way around it |
| Like | chicken, oats | Uses it more |
| Want to eat | pizza on Fridays, more beans | Fits it into the plan |

- Say them in the chat or edit them in your profile. They stay saved.
- If the nutritionist's plan clashes with a restriction, the app tells you instead of deciding on its own.

#### 3. Numbers are optional

- Numbers are hidden by default: the app talks about meals, not numbers.
- A switch in your profile shows them: kcal, protein, carbs and fat per meal and per day in the Menu tab. They're estimates from a table per food; foods outside the catalog are left out of the totals, and the line says which ([ADR 0021](adr/0021-numbers-switch-in-the-profile.md)).
- Ask the chat to show or hide them. Talk in numbers or technical terms (calories, grams of protein, macros) and it turns them on by itself, says so in one line and offers to go back. Once you turn them off, it doesn't turn them on again unless you ask.
- With numbers on, give the chat a calorie or protein target and it builds the menu to it, with the same values the Menu tab adds up.
- With no target, on or off, a menu aims at maintenance: about 2000–2200 kcal a day, nearer 2500 for a man or someone very active; a moderate deficit or surplus only when your goal is to lose or gain weight ([plan](plans/2026-10-17-default-calories.md)).

#### 4. Menu

- A week by default. Ask the chat for fewer days ("planificame los 3 días que vienen", "para el finde") and it plans 1 to 7, from tomorrow unless you say otherwise ("desde hoy", "desde el lunes"). Ask for more than 7 and it builds the week and tells you a week is the most ([ADR 0028](adr/0028-menus-of-1-to-7-days.md)).
- Each day is named by its weekday, in calendar order from the first, and the chat says which days it's planning: asked on a Friday, 3 days are sábado, domingo and lunes. Changing a meal keeps the days; a new plan starts tomorrow again.
- Day by day, each meal with amounts and short instructions.
- Change a meal or a day ("swap Tuesday's dinner") by chat or by tapping it.
- A few recipes that repeat, fewer for a shorter menu, on purpose: too much variety makes the shopping list huge and expensive.
- Saved as soon as the AI proposes it, with its shopping list. There's no confirm step: "confirm" sounded like a payment, and every change updates the list anyway ([ADR 0022](adr/0022-list-follows-the-menu.md)).
- Ingredients come from a fixed list of everyday foods, with amounts raw as bought; anything else is named as is ([ADR 0013](adr/0013-menu-saved-by-a-chat-tool.md)). Each one comes with the product the AI picked at each supermarket, from what they sell ([ADR 0024](adr/0024-agent-builds-the-menu-from-real-products.md)).

#### 5. Shopping list

- Built from the saved menu as soon as there is one, and it follows every change to the menu. Also shown in the chat ([§1](#1-chat-with-the-ai-nutritionist)).
- Adds up the whole menu and groups it by section, in the order you walk the store: fruit and vegetables, pantry, meat and fish, dairy, cold cuts and eggs, and "Otros" for foods outside the catalog.
- Converts to how things are sold: "1,1 kg of rice" becomes "2 × 1 kg", with what the menu uses next to it. Meat, fish, ham, cheese, fruit and vegetables show a weight (or a count), since they're sold loose or by weight. It always rounds up, never down.
- Accounts for raw vs. cooked: the menu's amounts are raw as bought, and the chat converts cooked amounts you give it (plans often say cooked rice; you buy it dry).
- Cross out what you already have at home, or buy less of it with −; or tell the chat. Your marks stay when the menu changes, until you tap "Lista nueva" or tell the chat you're starting a new week.
- Under each item, what to buy at the store the list is bought in: "2 × Arroz Blanco SAMAN 1 kg · Ta-Ta · $ 118", with a link to the product's page.
- Share (the phone's share sheet, with WhatsApp) or copy as text, with only what's left to buy.
- Fill the supermarket's cart from the list ([ADR 0030](adr/0030-cart-filling-tata-link-gdu-team-extension.md)):
  - "Armar carrito en Ta-Ta", when the store or split you're buying in includes Ta-Ta. It opens Ta-Ta's cart in another tab with what's left to buy at Ta-Ta, in the units the list shows, and you log in and pay there. Under it: how many products, the estimated total without delivery, and what doesn't go in and why.
  - What that browser's Ta-Ta cart already had stays. A second tap doesn't add anything twice.
  - "Armar todo en Ta-Ta · $X" (with "faltan N" when something stays out), when that puts more of the list in a cart than the option you're buying in: you're buying at Disco or Géant, Ta-Ta sells more than its part of a split, or no store or split has the whole list.
  - Disco and Géant can't be filled for you yet: their part says to add those products from each one's link.

#### 6. Save money

- Prices the list at Disco, Géant and Ta-Ta with their real prices, read from their websites, for the products the AI picked ([ADR 0024](adr/0024-agent-builds-the-menu-from-real-products.md)). The prices are the default branch's or sales channel's, not your delivery zone's.
- Prices only what's left to buy: crossed-out items aren't priced, and partly-had ones are priced on what's left.
- Each store is costed on the whole units you'd add to the cart: packs, or pieces, trays and bags for food sold by weight ([ADR 0023](adr/0023-scraper-prices-for-the-unit-of-sale.md)). What's left over is paid for.
- Shows what the whole list costs at each supermarket.
- Under the chosen total (the recommended one, or the split if you picked it), what it comes to per day of the menu: "$ 277 por día · menú de 7 días". It's what's left to buy divided by the menu's days, so it drops as you cross things out. Not shown for a 1-day menu, or when neither one store nor two have the whole list.
- With a budget, it says whether the list fits and how much is left, or how much is missing, and when a split between two stores would fit.
- Prices are estimates and show the date they were checked. A menu saved before real prices asks you to rebuild it in the chat.
- A product the store stopped listing (not read in the 14 days before that store's latest read) counts as not sold there, in the price and in the cart ([ADR 0030](adr/0030-cart-filling-tata-link-gdu-team-extension.md)).

**Which store to buy at.** The app picks the cheapest way to buy the whole *list*, not the cheapest store for each item, so you never end up with an order at every store:

1. By default it recommends one store: the cheapest one that has the whole list. "The whole list" means every item at least one store sells.
2. It suggests splitting between two stores, each item at the cheaper of the two, only if that saves at least 10% of the one-store total, or if no single store has everything. It shows how much the split saves and you choose; one store stays the default.
3. It never suggests more than two stores. If neither one store nor two have the whole list, it shows each store's total and recommends nothing.
4. A store that is missing items shows "N items not found". Items no store has are marked "not found online" and left out of every total.

**How much you saved.** Each week the app shows the saving compared with the average price of the same list across the supermarkets it checks: each item's average over the stores that sell it, added up. It's rounded down and shown only when it's above zero.

#### 7. Basics

- User account; your plan, preferences and chats are saved.
- Clear consent for health data, which Uruguay's personal data law (Law 18.331) treats as sensitive.
- Foods and package sizes that exist in Uruguay.
- The cart buttons in the List tab (§5) take the place of an "Order it for me" button.

### Out

Left out so we can first check that people use the plan and the list every week, and actually save. See the [roadmap](notes/roadmap.md) for what comes after.

- Uploading a nutritionist's plan (PDF, photo or pasted text).
- Placing the order, payments and scheduled orders. Filling Disco and Géant carts: a team-only extension is planned ([ADR 0030](adr/0030-cart-filling-tata-link-gdu-team-extension.md)).
- Small local shops (butchers, produce shops) and finding stores near you. At first, only big supermarkets.
- Cities other than Montevideo.
- Weekly promotions and bank-card discount days.
- Live voice conversation.
- Logging what you ate and tracking progress.
- Tools for nutritionists.
- Several people per household.

## How the AI nutritionist behaves

It helps you follow a plan. It doesn't replace your nutritionist. It only talks about food, diets, cooking, groceries and the app; anything else it declines in one line. Replies are short: a few sentences; the meals go to the Menu tab.

1. If you follow a nutritionist's plan, the plan wins. The AI only swaps things the plan allows.
2. If you ask for something outside the plan, it tells you and suggests checking with your nutritionist.
3. To save money it only swaps foods within the plan. It never cuts amounts to make the list cheaper.
4. Foods you can't eat never show up, unless you change your profile.
5. If something important is missing, it asks. If it's minor, it picks and tells you what it picked.
6. You choose your goal, including an aggressive deficit. Its only hard limit is crash dieting: a calorie floor, no fasting for days. It mentions a risk once, without lecturing ([ADR 0009](adr/0009-judgment-not-gatekeeping.md)).
7. It doesn't build plans for pregnancy, medical conditions or minors; it sends those people to a professional.
8. If it sees warning signs, like extreme restriction or a lot of guilt around food, it drops the numbers and suggests professional help. Wanting to lose weight fast is not a warning sign by itself.
9. It never diagnoses or gives medical advice.

## What we want to learn

The key questions: do people come back every week to make their list, and do they save enough to notice? Each target is the bar for calling that answer a yes, set before the pilot so results can't be read whichever way suits us.

| Question | How we'll measure it | Target |
| --- | --- | --- |
| Do they come back weekly? | How many make a 2nd and a 4th list | 60% make a 2nd, 40% make a 4th |
| Do they actually save? | Estimated saving per week, and whether they bought at the suggested store (asked after shopping) | Average estimated saving of 10% or more; half of those who shop use the suggested store |
| Do they accept a split? | How many accept a two-store split when it's offered | 30% |
| Does the AI build plans people accept? | How many shop from their first plan with 2 menu changes or fewer (the event is [open](notes/open-decisions.md): there's no confirm step any more) | 70% |
| Is the list useful at the store? | A short survey after shopping, and how many items people edit | Average 4 out of 5; under 20% of items edited |
| Do they want ordering? | How many tap a cart button (not recorded yet) | 30% |
| Who signs up? | Gym, nutritionist patient or other, asked at sign-up | No target: tells us who to build for next |
