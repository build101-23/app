# 0037. The List shows the cheapest split

- Status: Accepted
- Date: 2026-10-18

## Context
[ADR 0034](0034-list-shows-one-store-at-a-time.md) gave the List one tab per supermarket and dropped the two-store split from it. Buying at two stores, Géant and Ta-Ta say, meant flipping tabs and adding it up by hand. The user wanted the split back as one more option: the cheapest possible between two stores ([plan](../plans/2026-10-18-split-tab.md)).

The store rule already finds that pair ([product.md](../product.md#6-save-money)), but keeps it only when it saves at least 10%, the bar for the chat to suggest it.

## Decision
- **A fourth tab, under the three:** the cheapest pair of stores, each item at the cheaper of the two, never three stores. Full width, with both icons, "Géant y Ta-Ta" and its total.
- **Shown whenever it costs less than the cheapest store that has the whole list, by any amount,** or when no store has the whole list. A pair that buys everything at one store isn't a split, so it isn't shown.
- **On that tab:** the total, per day, budget line and savings card are the split's. Each line shows its product at the store it goes to. One order button per store, each with only what goes there.
- **One store stays the recommendation.** The list opens on it, the "Recomendado" pill stays on it, and the split has no pill.
- **The chat doesn't change.** Its list card and what the model reads still suggest a split only at 10%. `planStores` returns the pair as `pair`, and `split` is still the one the chat offers.

## Consequences
- The two-store buy is one tap away, with its own total and carts.
- The List can show a split the chat doesn't suggest, when it saves under 10%. Its total sits next to the stores', so the user can judge whether two trips are worth it.
- Crossing items can make the split go away; a List open on it then falls back to the recommended store.
- The learning-table question on splits ([product.md](../product.md#what-we-want-to-learn)) can be measured in the List again, as taps on the split's tab and its order buttons.
