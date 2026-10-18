# Roadmap

Ideas for after the first version ([scope](../product.md#scope)). Grouped by area; within each, closest first. Ordering comes right after the first version.

**Plan upload**
- Upload a nutritionist's plan as a PDF, a photo (even of a paper sheet) or pasted text.
- Works with plans that give exact amounts and with plans based on portions and swap lists ("1 portion of carbs = ...").
- Before using it, the app shows what it understood so you can confirm or fix it.

**Ordering**
- Fill the cart of the cheapest supermarket from the user's computer, weekly if they want, with a warning and a proposed substitute when a product isn't available ([ADR 0012](../adr/0012-fill-carts-from-the-users-computer.md)).
- Send the list on WhatsApp straight to a chosen store: grocery, butcher or produce shop.
- A deal with a supermarket chain or PedidosYa Market to fill the cart directly.
- Find nearby stores by address and what they sell.
- Pick the store using price and delivery cost together.
- Scheduled orders: the order repeats every few days already ([product](../product.md#8-recurring-order)); next, act on the date (start a new list, fill the cart), then same day and time every week.
- Two deliveries a week: dry goods once, fresh food twice.
- Replacements when something is out of stock, sticking to the plan.
- Repeat last week's order with one tap.
- Pay inside the app.

**Money**
- Cheaper options the plan allows: store brands, fruit and vegetables in season, another cut of meat that fits.
- Weekly promotions and bank-card discount days, counted in the price.
- A menu that leans toward what's on sale this week, inside the plan.
- Price history, to tell a real deal from a fake one.
- Show the saving against the store you usually shop at, not only the average.
- A cheaper mode, and choosing brands item by item (a budget per menu is in: [ADR 0024](../adr/0024-agent-builds-the-menu-from-real-products.md)).
- Product search with embeddings, if text search starts missing products; a cache of searches if a turn's time or cost grows.
- Macros from the picked products' labels instead of a table per food ([ADR 0021](../adr/0021-numbers-switch-in-the-profile.md)).
- Prices from local butchers and produce shops.
- Alerts when something you buy every week drops in price.

**Voice and chat**
- Live, hands-free voice conversation (for example, while cooking).
- Quick changes ("I ate out today") that rework the week and the next order.

**Tracking**
- Log what you ate by photo, voice or text.
- Adjust next week based on what you ate and liked.
- Optional weight and measurements, with simple charts.
- Connect with Apple Health and Google Fit.

**Cooking**
- Step-by-step recipes.
- A cooking plan for delivery day: what to cook and in what order.
- Use up leftovers during the week.

**Pantry**
- The app knows what you have and what's about to go bad, and plans around it.

**Household**
- Several people with different plans, one order.

**Nutritionists**
- Load plans straight into the patient's app.
- See if the patient follows the plan, with their permission.
- Messages between nutritionist and patient.

**Making money**
- Subscription for users.
- Commission from stores on each order.
- Paid plan for nutritionists.
