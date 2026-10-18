# Plan: slide 10 becomes the business model, users and supermarkets

Date: 2026-10-18
Status: applied (checked in the browser: fits the safe area, 2 clicks, presenter thumbnail, 12-page PDF)

## Context

Slide 10 ("Construir sobre un hábito") was about the 10–15 person pilot. The user asked to replace it with the business plan: what it is for the user, and for supermarkets. For supermarkets the user put the value in customer insight, not stock: why their customers buy the chicken at another supermarket, and how to attract the customers they want.

## Copy

- Chapter: EL NEGOCIO. Title: "Ganan los dos lados."
- PARA VOS: "Menú, lista y el súper más barato, cada semana." Pays: "Gratis." (The user decided users don't pay; only supermarkets do.)
- PARA LOS SUPERMERCADOS: "Por qué sus clientes compran en la competencia." / "Qué categorías pierden, contra quién y qué promo las recupera." Pays: "Pagan por los insights y por cada venta." (The first draft used a chicken example; the user asked for a more professional, sellable wording.)
- Speaker note (replaces the pilot paragraph, about as long, with the two clicks marked): "El próximo paso es construir el negocio sobre ese hábito, y tiene dos lados. [clic] Para vos, gratis: cada semana tu menú, tu lista y dónde comprar más barato. [clic] Y para los supermercados, lo más valioso: entender a sus clientes. En qué categorías pierden ventas frente a la competencia, a qué precio, y qué promoción las recupera. Es intención de compra real, antes de que la compra ocurra, siempre agregada y anónima. El que paga es el supermercado: por esos insights y una comisión por cada venta. Eso es lo que vamos a validar."
- Aggregated and anonymous on purpose: Uruguay's personal data law (Ley 18.331) rules out selling identifiable data, and saying it up front answers the jury's first question.
- A "Modelo a validar" strip was tried under the cards and dropped: it repeated how each side pays and pushed the slide past the safe area. "A validar" stays in the note.

- Slides 06 and 07 speaker notes follow the user's latest script: "Se los muestro con un caso."; "VIVERI interpreta lo que necesito…"; "comida por comida, los 7 días de la semana."

## Design

Light slide. Two white cards (24 px corners, thin border), one per side, each ending in a green "how it pays" line at the same height. Between them, slide 04's dotted line runs through VIVERI's tangerine dot; it draws in with the first click (the user's side); the second click brings the supermarket side. Applied in the deck code; the approved `VIVERI_SLIDES` block stays as it is.

## Steps

1. Slide override and styles in the deck; rebuild; copy to `pitch/VIVERI_presentacion_v4.html`.
2. Check layout (no overflow), the clicks and back, the presenter thumbnail and print.
3. Docs: [pitch.md](../notes/pitch.md) mentions it.
