# Pitch: build 101

Notes for the VIVERI pitch at build 101 (17–18 Oct 2026). The current deck is `C:\prompt-lab\output\VIVERI_presentacion_animada.html` (the animated one, served on localhost:8080); `C:\prompt-lab\output\VIVERI_presentacion_v3.html` is the same deck with the visual pass of [the v3 plan](../plans/2026-10-18-pitch-deck-v3.md) (brand fonts, denser slides 5 and 10); `pitch/VIVERI_presentacion_v4.html` in this repo (how to run it: [development.md](../development.md#pitch-deck); [restart and repo plan](../plans/2026-10-18-pitch-deck-restart-and-repo.md)) is the keynote-level visual pass of [the v4 plan](../plans/2026-10-18-pitch-deck-v4-visual-polish.md) (same content, embedded fonts, new grid and motion), plus [a cover and the week on slide 01](../plans/2026-10-18-pitch-deck-cover.md) and [slides 02, 04 and 06 reworked](../plans/2026-10-18-pitch-deck-slides-2-and-4.md) (slide 06 now reads "Más tiempo para vos. / Más ahorro."). An earlier [Slides artifact](https://claude.ai/artifact/1bEnF95aVSiZ5rrau4em8f) holds the first version. Speaker notes and timings live in [guion-pitch.md](guion-pitch.md) (4:00 and 3:00 versions). This note holds what the deck doesn't: where each number comes from, the demo checklist, and answers for the jury's questions.

**Time.** The brief (`build101-consigna.pdf` at the repo root, p. 3) gives **3 minutes** for the pitch and demo, plus 3 for questions, in both the classification rooms and the final, whatever the format.
- The 4:00 version adds up to 4:00.
- The 3:00 version adds up to 2:45, which leaves 15 s for a slow AI turn in the demo.
- Rehearse the 3:00 version as the main one, unless the organizers confirm 4 minutes in writing.

## Message

- **Promise:** "Comer bien, sin que te cueste." *Comer bien* is health; *sin que te cueste* is both effort and money.
- **Category:** "El end-to-end de tu comida: de tu dieta a tu compra." Ordering, the last step to the fridge, comes next and isn't built yet.
- **One problem behind three costs (health, time, money):** "nadie une tu dieta con tu compra."
- **Voice:** spoken lines are assertive, with no "más o menos" or "estimamos". Every estimate is labeled in the slide's footnote.

## Numbers

| Number | How we got it | Source |
| --- | --- | --- |
| $ 863 / $ 923 / $ 1.420, +65 % | The first real chat turn, a 2-day menu priced at Géant, Disco and Ta-Ta: 1.420 ÷ 863 = 1.645. Each store is priced with the product the model picked there, in whole units of sale. Part of Ta-Ta's gap is its whole 1 kg meat units and the picks, so the deck says "el mismo menú", not "la misma comida". | [plan](../plans/2026-10-17-agent-builds-menu-from-products.md), Results |
| $ 21.000 a year, $ 405 a week | A real 7-day menu (high protein, no lactose or fish, $ 5.000 budget), priced on 17/10: Disco $ 2.376, Géant $ 2.287, Ta-Ta $ 2.273 (1 item not found); average $ 2.312. The app's cheapest option, splitting between Disco and Ta-Ta, costs $ 1.907: $ 405 less than the average (17.5 %), × 52 = $ 21.060. | List tab of the demo account, screenshot taken 18/10 |
| 104 h, more than 4 days a year | 1 h a week at the store, plus 1 h planning, making the list and comparing prices (Inmar's average per regular trip, assuming one regular trip a week). 2 h × 52 = 104 h = 4.3 days. VIVERI gives back the planning hour today (52 h, about 2 days). The full 104 h needs ordering. | [Supermarket News](https://www.supermarketnews.com/health-wellness/survey-consumers-too-busy-to-eat-healthy) (66 min a week shopping); [Inmar 2024 via Progressive Grocer](https://progressivegrocer.com/why-consumers-are-taking-time-plan-their-grocery-shop) (see below); [Prep Kitchen](https://prepkitchen.co.uk/blog/news/study-reveals-you-can-save-time-and-money-with-a-meal-prep-subscription) (60 min shopping) |
| 7 in 10 adults overweight or obese | World Obesity Atlas 2025, a modeled estimate: 72 % with high BMI (36 % obesity). The last official measurement is the MSP's 2nd ENFRENT (2013): 64.9 % with overweight or obesity (27.6 % obesity), which the MSP calls «casi 7 de cada 10». A 3rd ENFRENT was announced in May 2026 and has no results yet. | [El Observador](https://www.elobservador.com.uy/nacional/mas-del-30-los-adultos-uruguay-viven-obesidad-segun-informe-atlas-n5987980/amp), [MSP 2019](https://www.gub.uy/ministerio-salud-publica/comunicacion/noticias/dia-mundial-alimentacion-nuestras-acciones-son-nuestro-futuro), [MSP 2026](https://www.gub.uy/ministerio-salud-publica/comunicacion/noticias/uruguay-vuelve-medir-factores-riesgo-salud-despues-10-anos) |
| A catalog of more than 20.000 real products | All Disco, Géant and Ta-Ta rows in `store_products`: 21.769. The agent's search returns a subset (priced, in stock, with a size, read within 14 days), which nobody has counted yet. That's why the deck says "un catálogo de", not "busca entre". The 25.139 total includes Devoto, which the agent doesn't search. | [price-sources-research.md](price-sources-research.md) |
| $ 10 of AI a week, 40× | US$ 0.10 per 2-day menu, measured from the logged usage with Claude Sonnet 5.5. US$ 0.20–0.30 a week is ADR 0024's estimate, not yet measured, and it assumes one menu turn per user per week; other replies cost 1–3 cents each. At about $ 40 per dollar, that's $ 10. $ 405 ÷ $ 10 ≈ 40. | [plan](../plans/2026-10-17-agent-builds-menu-from-products.md), Results; [ADR 0024](../adr/0024-agent-builds-the-menu-from-real-products.md) |

Inmar 2024 surveyed US shoppers per regular grocery trip:
- 27 % spend 30–60 min planning meals, comparing prices and hunting for discounts;
- 25 % spend 1–2 h;
- 34 % spend under 30 min.

Weighting each bucket by its midpoint gives about 1 h. That average is our own calculation, not Inmar's.

**Rehearsal turn on 18/10.** The demo phrase took about 25 s on the deployed app. Result:
- Géant $ 1.491, which fits the $ 1.500 budget;
- Disco $ 1.553;
- Ta-Ta $ 1.746, with 1 item not found;
- splitting between Disco and Ta-Ta: $ 1.130, which is $ 361 less than Géant.

## Demo checklist

- **First, reload the app.** On 18/10 a page loaded before [PR #17](https://github.com/build101-23/app/pull/17) went live showed raw `{"step":"thinking"}`, `{"text":"D"}` lines in the chat bubble while the AI worked. The deployed `chat` function streams step events, and only the new web app reads them. PR #17 is live, so reload the app on the phone and check one turn: you should see the step labels, not JSON. [PR #20](https://github.com/build101-23/app/pull/20), still open, keeps the chat working if the old plain-text function is ever redeployed.
- **Two accounts.**
  - The stage account has never chatted. Its Profile and Menu tabs are empty.
  - A new chat gets the account's saved profile and menu in its first message. The List tab's marks also outlive new menus, and the app can't clear either.
  - Rehearse, warm up and take screenshots only on a second account.
  - If the stage account has anything saved, delete its rows in `profiles` and `menus` in the Supabase dashboard.
  - The account used on 18/10 already remembers "sin lactosa, no pescado, no cerdo".
- **Before going on stage:**
  - Run one warm-up turn on the second account 10 minutes before.
  - On the phone, sign in to the stage account and open a new chat.
  - Check that the phone mirror works on the projector.
- **Network:** the phone's hotspot, not the venue Wi-Fi.
- **Phrase:** dictate "No como cerdo, quiero bajar de peso. Armame el finde, tengo $ 1.500." Typing it takes about 20 s.
- **List:** open the List tab. Don't ask for the list in the chat: that's another AI turn, and the chat card shows grams and no saving.
- **Go/no-go:** in rehearsal, run 3 turns with different phrases on the second account. If any fails or takes more than 40 s, show the hidden slide with the real screenshots instead of the live demo.
- **On stage:** if the menu hasn't appeared 40 s after the phrase, say "mientras termina, sigo", move on to the AI slide, and come back to the phone during questions. Don't retry on stage.
- **Daily cap:** the `chat` function answers 429 after 100 turns a day per user.

### Backup video (optional, 60 s or less)

The hidden backup slide already holds two real screenshots from 18/10. A video can replace them:
1. Empty chat, then the dictated phrase (5 s).
2. The wait. If it runs past 20 s, speed it up 2× and show "×2" on screen.
3. The menu preview in the chat (5 s).
4. The List tab: where to buy, then the product line under one item (10 s).
5. That line's link to the product page at the store (3 s).

## Jury questions

Answers in the voice we'd use on stage.

- **¿Si le sacás la IA, sigue funcionando?** No. Queda un comparador de precios, y ya existe (Cabacuá compara unos 40.000 productos). Pero tenés que saber qué buscar. La IA convierte "no como cerdo, quiero bajar de peso, tengo $ 1.500" en productos concretos de cada súper, con cantidades y dentro del presupuesto.
- **¿Cómo saben que no alucina?**
  - `save_menu` valida cada producto elegido contra `store_products` antes de guardar.
  - Los precios salen del catálogo, con la fecha en que se leyeron. El modelo solo repite los totales que calcula el código.
  - Totales, unidades de venta y el súper recomendado los calcula código con tests (`supabase/functions/_shared/`).
  - En la pestaña Lista, cada producto tiene el link a su página: abran uno y comparen.
- **¿Es exactamente la misma comida en cada súper?** El mismo menú y las mismas cantidades. En cada súper la IA elige el producto que mejor encaja, y algunos se venden solo en paquetes grandes (Ta-Ta vende la carne en piezas de 1 kg o más). Esa diferencia también es plata que pagás.
- **¿Por qué no usar ChatGPT?** No tiene los precios de hoy de Disco, Géant y Ta-Ta, así que los inventaría. Tampoco arma la lista en unidades de venta, ni elige el súper con una regla, ni guarda el menú y lo recalcula cuando lo cambiás.
- **¿Qué modelo usan y cuánto cuesta?** Claude Sonnet 5.5 como agente con 6 herramientas. Un menú de 2 días cuesta unos US$ 0,10 y tarda entre 25 y 35 s. Una semana completa todavía no la medimos: calculamos entre US$ 0,20 y 0,30.
- **¿De dónde salen los precios? ¿Es legal?** Un scraper propio lee las webs públicas de los súper a una consulta por segundo. Hoy lo corremos a mano. La lectura legal de los términos está [abierta](open-decisions.md): para el hackathon lo asumimos y, antes de lanzar, consultamos a un abogado o buscamos un acuerdo con las cadenas.
- **¿Qué está pendiente o simulado?** Nada de la IA está simulado. Pendiente:
  - el pedido automático;
  - Devoto en el menú (está en el catálogo);
  - precios por zona de entrega (hoy son los de la sucursal por defecto, y el scraper se corre a mano);
  - el consentimiento de datos de salud (milestone 6).
  Los macros son estimaciones de una tabla por alimento.
- **¿Puedo pedirle cualquier dieta?** Otra restricción, otro objetivo u otro presupuesto, sí. Embarazo, condiciones médicas y menores no los arma, a propósito: los deriva a un profesional. Tiene un piso de calorías, y si ve señales de alerta deja los números y sugiere ayuda profesional ([product.md](../product.md#how-the-ai-nutritionist-behaves)).
- **¿Y si tengo plan de nutricionista?** Se lo contás en el chat y el plan manda: solo cambia lo que el plan permite. Subir el PDF del plan está en el [roadmap](roadmap.md).
- **¿Cómo ganan plata?** Suscripción del usuario, comisión de los súper por pedido y un plan para nutricionistas ([roadmap](roadmap.md)). La rúbrica no lo puntúa; contestalo en una línea.
