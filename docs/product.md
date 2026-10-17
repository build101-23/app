# Product

Living doc: how the product is *now*. Future ideas live in [notes/roadmap.md](notes/roadmap.md), open questions in [notes/open-decisions.md](notes/open-decisions.md).

## Problem

Following a diet means turning a plan into meals, a shopping list and a trip to the store, every week. It's tedious, and it's easy to overspend.

**VIVERI** is a phone app that turns your diet into food at home, with two promises: **it's convenient, and it saves you money.** You build the diet by chatting with an AI nutritionist, and if you already have a nutritionist's plan, you tell it about it in the chat. The app turns it into a weekly menu and a shopping list, finds those products in the supermarkets and tells you where the whole list is cheapest. Later, it will order the food for you every week.

### What makes it different

Price comparison apps already exist in Uruguay. [Cabacua](https://www.elobservador.com.uy/ciencia-y-tecnologia/crean-una-app-que-compara-mas-40-mil-productos-supermercados-montevideo-n6036499), for example, compares around 40,000 supermarket products in Montevideo. But you have to know what to look for.

This app starts from your diet. It knows what you need, how much, and which swaps your plan allows, so it can save you money without breaking the plan.

## Users

- Regular people in Montevideo who want to eat to a plan: gym-goers, patients of a nutritionist, or anyone building their own diet.
- First group: 10 to 15 people, from the gym, patients of 1 or 2 nutritionists, and friends. If they ask for orders, we place them by hand.

## How it works

1. You chat with the AI nutritionist. If you have a nutritionist's plan, you describe it in the chat.
2. The app combines that with your likes and restrictions and proposes a weekly menu. You change it and confirm it. Your plan is your profile plus that menu.
3. You get a shopping list, priced at each supermarket, with the cheapest way to buy it on top.
4. You share the list on WhatsApp or copy it.
5. *(Later)* The app places the order for you.

## Scope

The first version goes from a chat to a priced shopping list, in Montevideo only. Ordering comes next.

### In

#### 1. Chat with the AI nutritionist

- Text chat, in normal language.
- Several chats: start a new one, or go back to an old one and keep going. Your profile is shared by all of them.
- Enter sends; Shift+Enter adds a new line.
- Voice as dictation: tap the mic, speak, and the text appears in the box for you to check and send. It uses the browser's speech recognition ([ADR 0010](adr/0010-browser-speech-recognition.md)); where that's missing, the keyboard's dictation still works. No live voice conversation.
- If you don't have a plan, it builds one from scratch.
- If you have a nutritionist's plan, it follows what you tell it about that plan.
- It asks as little as possible: your goal and what you can't eat. It doesn't ask whether you have a nutritionist's plan; if you mention one, it follows it. Everything else it assumes, tells you, and lets you correct. Then it builds your weekly menu right away and shows a preview of the week in the chat, with a button to the Menu tab, and tells you to confirm it there to get the shopping list. Ask it to see the menu and it shows the same preview.
- Tell it what you already have at home ("ya tengo arroz", "tengo medio kilo de pollo") and the shopping list buys less. "Arranco semana nueva" clears it.
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
- If you want, you can set calories and protein yourself, or see the numbers per meal and per day.
- Turned on with a switch in your profile.

#### 4. Weekly menu

- Day by day, each meal with amounts and short instructions.
- Change a meal or a day ("swap Tuesday's dinner") by chat or by tapping it.
- A few recipes that repeat, on purpose: too much variety makes the shopping list huge and expensive.
- Saved as soon as the AI proposes it. A button at the top confirms it as your plan; any later change needs confirming again.
- Ingredients come from a fixed list of everyday foods, with amounts raw as bought; anything else is named as is ([ADR 0013](adr/0013-menu-saved-by-a-chat-tool.md)).

#### 5. Shopping list

- Shows once the menu is confirmed.
- Adds up the whole week and groups it by section, in the order you walk the store: fruit and vegetables, pantry, meat and fish, dairy, cold cuts and eggs, and "Otros" for foods outside the catalog.
- Converts to how things are sold: "1,1 kg of rice" becomes "2 × 1 kg", with what the menu uses next to it. Meat, fish, ham, cheese, fruit and vegetables show a weight (or a count), since they're sold loose or by weight. It always rounds up, never down.
- Accounts for raw vs. cooked: the menu's amounts are raw as bought, and the chat converts cooked amounts you give it (plans often say cooked rice; you buy it dry).
- Cross out what you already have at home, or buy less of it with −; or tell the chat. Your marks stay when the menu changes, until you tap "Lista nueva" or tell the chat you're starting a new week.
- Share (the phone's share sheet, with WhatsApp) or copy as text, with only what's left to buy.

#### 6. Save money

- Prices the list at Disco, Géant and Ta-Ta, with example prices for now ([ADR 0019](adr/0019-example-prices-until-matched.md)).
- Prices only what's left to buy: crossed-out items aren't priced, and partly-had ones are priced on what's left.
- Each store is costed on the whole packs the week needs, and loose food on the exact weight (the line rounds up). So a bigger pack only wins if it's cheaper even counting what's left over.
- Shows what the whole list costs at each supermarket.
- Prices are estimates and show the date they were checked.

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
- An "Order it for me" button that, for now, only records interest.

### Out

Left out so we can first check that people use the plan and the list every week, and actually save. See the [roadmap](notes/roadmap.md) for what comes after.

- Uploading a nutritionist's plan (PDF, photo or pasted text).
- Ordering from stores, payments and scheduled orders.
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
| Does the AI build plans people accept? | How many confirm their first plan with 2 changes or fewer | 70% |
| Is the list useful at the store? | A short survey after shopping, and how many items people edit | Average 4 out of 5; under 20% of items edited |
| Do they want ordering? | How many tap "Order it for me" | 30% |
| Who signs up? | Gym, nutritionist patient or other, asked at sign-up | No target: tells us who to build for next |
