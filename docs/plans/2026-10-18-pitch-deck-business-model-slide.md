# Plan: slide 10 becomes the business model, users and supermarkets

Date: 2026-10-18
Status: applied (checked in the browser: fits the safe area, 2 clicks, presenter thumbnail, 12-page PDF)

## Context

Slide 10 ("Construir sobre un hábito") was about the 10–15 person pilot. The user asked to replace it with the business plan: what it is for the user, and for supermarkets. For supermarkets the user put the value in customer insight, not stock: why their customers buy the chicken at another supermarket, and how to attract the customers they want.

## Copy

- Chapter: EL NEGOCIO. Title: "Ganan los dos lados."
- PARA VOS: "Menú, lista y el súper más barato, cada semana." Pays: "Paga una suscripción."
- PARA LOS SUPERMERCADOS: "Por qué sus clientes compran el pollo en otro súper." / "Qué productos pierden, contra quién y qué promo los trae de vuelta." Pays: "Pagan por los datos y por pedido."
- Speaker note: two sides; for supermarkets the data is the value (what each person wants to buy and where it suits them: "tus clientes compran el pollo en otro lado, por este precio; esta promo los trae de vuelta"), always aggregated and anonymous; revenue from subscription, data and a commission per order; "eso es lo que queremos validar".
- Aggregated and anonymous on purpose: Uruguay's personal data law (Ley 18.331) rules out selling identifiable data, and saying it up front answers the jury's first question.
- A "Modelo a validar" strip was tried under the cards and dropped: it repeated how each side pays and pushed the slide past the safe area. "A validar" stays in the note.

## Design

Light slide. Two white cards (24 px corners, thin border), one per side, each ending in a green "how it pays" line at the same height. Between them, slide 04's dotted line runs through VIVERI's tangerine dot; it draws in with the first click (the user's side); the second click brings the supermarket side. Applied in the deck code; the approved `VIVERI_SLIDES` block stays as it is.

## Steps

1. Slide override and styles in the deck; rebuild; copy to `pitch/VIVERI_presentacion_v4.html`.
2. Check layout (no overflow), the clicks and back, the presenter thumbnail and print.
3. Docs: [pitch.md](../notes/pitch.md) mentions it.
