# Prompt: presentación de VIVERI desde cero

Copiá todo lo que está debajo de la línea y pegalo en la herramienta que vayas a usar: Claude, ChatGPT, Gamma, Canva IA, Google Slides con Gemini u otra.

---

Sos un diseñador de presentaciones y un coach de pitch de startups. Armá una presentación de **11 slides en 16:9**, en **español rioplatense (voseo)**, para presentar en vivo **VIVERI** ante el jurado de un hackathon de IA. El tono es el de una ronda de inversión: seguro, concreto y vendedor, sin humo. Para cada slide entregame:
- el diseño;
- el texto exacto en pantalla;
- las animaciones;
- las notas del orador, con el guion palabra por palabra en dos versiones: **4:00** y **3:00**.

## 1. Contexto

**El producto: VIVERI.** Es una app web para el celular. Le contás en una frase cómo querés comer (tu objetivo, lo que no comés, tu presupuesto) y en unos 30 segundos:
1. arma tu menú para los días que pidas;
2. arma la lista de compras;
3. busca cada producto real en los supermercados de Montevideo (Disco, Géant y Ta-Ta);
4. te dice dónde comprar todo más barato.

Por dentro:
- Un agente de IA (Claude Sonnet 5.5) con 6 herramientas propias: busca productos, guarda el perfil, guarda el menú, muestra el menú, actualiza la lista y muestra la lista.
- Busca en un catálogo de más de 20.000 productos reales, leídos de las webs de los súper.
- Recuerda tus restricciones entre chats.
- Si no alcanza la plata, cambia por alimentos que tu plan permite. **Nunca achica porciones.**
- Las cuentas (totales, unidades de venta, súper más barato) las hace código con tests, no el modelo.

**La consigna del hackathon (build 101, FIUM/LATU, 17–18/10/2026):**
- Un producto cuya función principal dependa de la IA. La pregunta clave es “si le sacás la IA, ¿sigue funcionando?”.
- No califica un chat genérico.
- Lo simulado o pendiente hay que decirlo.
- Tiempo: **3 minutos de presentación y demo**, más 3 de preguntas. Preparamos una versión de 4:00 y otra de 3:00; la de 3:00 debe sumar como máximo 2:45.

**Rúbrica:**

| Criterio | Peso | Qué pide |
| --- | --- | --- |
| Producto funcionando | 35 % | El jurado puede cambiar el caso en vivo. |
| Problema y valor para el usuario | 25 % | Un caso concreto. |
| Calidad de la IA | 20 % | Justificar el enfoque y dar una comprobación sencilla de la calidad. |
| Experiencia de uso | 10 % | |
| Originalidad | 10 % | |

**El concepto:**
- **Promesa:** **“Comer bien, sin que te cueste.”** *Sin que te cueste* dice dos cosas: ni tiempo ni esfuerzo, y ni plata de más.
- **Categoría:** **“El end-to-end de tu comida: de tu dieta a tu compra.”**
- **El hilo del pitch:** comer bien hoy te cuesta tres veces (tiempo, plata y salud), pero es un solo problema: **nadie une tu dieta con tu compra.**
- **Lo pendiente, que se dice en voz alta:** el pedido automático no está construido. Se presenta como “lo próximo: que llegue sola a tu heladera”.

## 2. Identidad visual

**Paleta:**

| Uso | Color |
| --- | --- |
| Fondo oscuro | verde profundo `#0b3d2b` |
| Fondo claro | `#f3f6f2` |
| Texto sobre claro | `#14211b` |
| Texto secundario sobre claro | `#55645c` |
| Texto sobre oscuro | `#f3f6f2` |
| Texto secundario sobre oscuro | `#b6c5be` |
| Verde de marca | `#1e8a5e` |
| Etiquetas en verde | `#156b49` |
| Verde claro sobre oscuro | `#5cc495` |
| Acento | naranja `#e85d2a` |

El naranja se usa **solo para “lo uno”**: el número que importa, el punto que se une, el súper más barato. Para texto sobre naranja, `#0d1613`.

**Tipografía:**
- títulos y cifras: **Bricolage Grotesque**, peso 700–800, con interletra apretada;
- texto: **DM Sans**.

Escala de tamaños: 300 / 180 / 120 / 88 / 72 / 48 / 32 / 26 px. El mínimo es 24 px.

**Logo:** cinco o seis puntos verdes en forma de V que convergen en un punto naranja abajo, y al lado la palabra **VIVERI** en verde, geométrica. Si no tenés el archivo, dejá un marco vacío que diga “logo VIVERI”. No lo dibujes.

**Estilo:**
- Una idea por slide.
- Números gigantes.
- Fondos oscuros y claros que se alternan.
- Mucho aire y márgenes de 128 px.
- Tarjetas blancas con borde fino y esquinas de 24 px.
- Sin emojis, sin degradés ni ilustraciones de stock.

**Notas al pie:** cada número que es una estimación lleva una nota al pie chica que dice “Estimación” y la fuente. La voz suena segura; la letra chica queda honesta.

## 3. Las 11 slides

### Slide 1 · Hook (oscuro)

**En pantalla:**
- Etiqueta: “UNA PREGUNTA”.
- Título gigante: **“¿Quién labura de 9 a 6?”**
- [click] “Salís a las **18:00** (en naranja), y todavía te falta:”
- [click] “decidir qué comer · hacer la lista · ir al súper · comparar precios”
- [click] **“Todas las semanas.”** en naranja.

**4:00 (0:00–0:15) · 3:00 (0:00–0:12):** “Levanten la mano: ¿quién labura de nueve a seis?” [pausa] “Salís a las seis, cansado, y todavía te falta lo peor: decidir qué comer, hacer la lista, meterte al súper. Todas las semanas.”

### Slide 2 · Tiempo (claro)

**En pantalla:**
- Etiqueta: “TIEMPO”.
- Cifra enorme: **“104 h”**.
- Debajo: “por año entre decidir qué comer, hacer la lista, comparar y recorrer el súper.”
- [click] En naranja: **“Más de 4 días enteros de tu vida.”**

**Nota al pie:** “Estimación: 1 h por semana en el súper (Supermarket News) + 1 h planificando, haciendo la lista y comparando (Inmar 2024). 2 h × 52 = 104 h = 4,3 días.”

**4:00 (0:15–0:30) · 3:00 (0:12–0:22):** “Eso son ciento cuatro horas por año. Más de cuatro días enteros de tu vida. Por año. En el súper.”

### Slide 3 · Plata (oscuro)

**En pantalla:**
- Etiqueta: “PLATA · Y ENCIMA, PAGÁS DE MÁS”.
- Dos columnas: “Géant · **$ 863**” en blanco, y [click] “Ta-Ta · **$ 1.420**” en naranja.
- [click] Una pastilla naranja **“+65 %”**.
- Título: **“Es el mismo menú. Cambia el súper.”**

**Nota al pie:** “Menú de 2 días armado por VIVERI el 17/10/2026, con precios de las webs de los súper: Géant $ 863 · Disco $ 923 · Ta-Ta $ 1.420. En cada súper, el producto que eligió la IA, en unidades de venta enteras.”

**4:00 (0:30–0:45):** “Y encima pagás de más. El mismo menú: ochocientos sesenta y tres pesos en Géant. Mil cuatrocientos veinte en Ta-Ta. Sesenta y cinco por ciento más, y no lo sabés. Es un menú real que armó nuestra IA, con precios de esta semana.”

**3:00 (0:22–0:35):** “Y encima pagás de más: el mismo menú, ochocientos sesenta y tres o mil cuatrocientos veinte. Sesenta y cinco por ciento más.”

### Slide 4 · Salud: comer bien te cuesta tres veces (claro)

**En pantalla:**
- Título: **“Comer bien te cuesta tres veces”**.
- Tres tarjetas iguales, cada una con un punto verde arriba a la izquierda:
  - **Tiempo:** “104 h” · “por año: más de 4 días de tu vida”;
  - **Plata:** “+65 %” · “por el mismo menú, según dónde lo compres”;
  - **Salud:** “7 de 10” · “adultos en Uruguay con sobrepeso u obesidad”.

**Nota al pie:** “Salud: World Obesity Atlas 2025 (72 %, estimación); MSP, 2.ª ENFRENT 2013 (64,9 %).”

**4:00 (0:45–1:00):** “Y al final lo paga tu cuerpo: siete de cada diez adultos uruguayos tienen sobrepeso u obesidad. Tiempo, plata, salud: comer bien te cuesta tres veces.”

**3:00 (0:35–0:45):** “Y lo paga tu cuerpo: siete de cada diez uruguayos con sobrepeso.”

**Transición (wow nº 1):** los tres puntos verdes vuelan al centro de la slide siguiente y se funden en **un solo punto naranja grande**. Usá Morph, Magic Move o lo equivalente.

### Slide 5 · Uno solo (oscuro)

**En pantalla:**
- El punto naranja grande arriba, al centro.
- “Parecen tres problemas. Es uno solo:”
- En grande: **“nadie une tu dieta con tu compra.”**
- Chico: “El nutricionista te da un plan. Los súper, miles de productos. Lo del medio lo hacés vos, a mano, cada semana, después de laburar.”

**4:00 (1:00–1:10) · 3:00 (0:45–0:53):** “Parecen tres problemas. Es uno solo: nadie une tu dieta con tu compra. Ese trabajo lo hacés vos, a mano, después de laburar.”

**Transición (wow nº 2):** el punto naranja viaja y se vuelve el punto de abajo del logo de VIVERI, que aparece completo alrededor.

### Slide 6 · Solución (claro)

**En pantalla:**
- Etiqueta: “LA SOLUCIÓN”.
- El logo de VIVERI grande, al centro.
- Título: **“El end-to-end de tu comida”**.
- Una fila de pastillas con flechas: “Tu objetivo → Menú de la semana → Lista de compras → **El súper más barato**”. La última en naranja.

**4:00 (1:10–1:20):** “Eso es VIVERI: el end-to-end de tu comida. Le decís cómo querés comer, y te arma el menú, la lista, y te dice dónde comprarla más barata. Miren.”

**3:00 (0:53–1:00):** “Eso es VIVERI: de tu dieta a tu compra, en el súper más barato. Miren.”

### Slide 7 · Demo en vivo (oscuro, wow nº 3)

**En pantalla:**
- Una pastilla naranja **“EN VIVO”**.
- Título: **“Una frase. Tu menú.”**
- Una caja grande con la frase. Las partes clave van en naranja: “*No como cerdo*, quiero *bajar de peso*. Armame el finde, tengo *$ 1.500*.”
- Debajo: “Tres pedidos en una sola frase: una restricción, un objetivo y un presupuesto.”
- Un **cronómetro** grande que corre mientras la IA trabaja. Al lado: “La IA busca en un catálogo de más de 20.000 productos reales de Disco, Géant y Ta-Ta, y arma tu menú.”
- **Sin capturas de pantalla en esta slide:** mostrarían el resultado antes de la demo.

**Guion, 4:00 (1:20–2:30) · 3:00 (1:00–1:55):**
1. Pasás al celular espejado y dictás: “No como cerdo, quiero bajar de peso. Armame el finde, tengo mil quinientos pesos.”
2. Mientras trabaja, de 25 a 35 s: “En una sola frase le di tres cosas: una restricción, un objetivo y un presupuesto. Ahora mismo VIVERI está buscando en un catálogo de más de veinte mil productos reales de Disco, Géant y Ta-Ta, eligiendo el producto en cada súper y armando el menú a mi objetivo. Nada de esto está precargado: lo arma ahora, en vivo.”
3. “Listo: el finde, sin cerdo, para bajar de peso.”
4. Pestaña Lista: “Y la respuesta que nadie te daba: dónde comprarlo. [SÚPER] entra en los mil quinientos, y si dividís entre dos súper, te ahorrás [MONTO].”
5. Solo en 4:00: “Debajo de cada cosa, el producto exacto, cuántos llevar, en qué súper y a qué precio, con el link a su página.”
6. Solo en 4:00: “En las preguntas, pídannos otra dieta: otra restricción, otro objetivo, otro presupuesto.”

**Plan B:** si a los 40 s no apareció el menú, decí “mientras termina, sigo” y pasá a la slide 8.

### Slide 7b · Respaldo (oculta, oscuro)

**En pantalla:**
- “Demo · capturas reales”.
- Dos capturas de celular, una al lado de la otra: el chat con el menú, y la pestaña “Dónde comprar”.
- Texto: “Turno real del 18/10/2026 en la app desplegada. Tardó unos 25 s.”

**Datos de esas capturas:** todo en Géant $ 1.491, entra en $ 1.500; Disco $ 1.553; Ta-Ta $ 1.746; dividiendo entre Disco y Ta-Ta, $ 1.130, o sea $ 361 menos.

### Slide 8 · La IA (claro)

**En pantalla:**
- Etiqueta: “POR QUÉ LA IA ES INDISPENSABLE”.
- Título: **“Sacale la IA: ¿qué queda?”**
- Dos paneles de la misma altura:
  - **Izquierdo, gris, “Sin IA”:** “Un comparador de precios.” · “Tenés que saber qué buscar, cuánto comprar y qué cambiar si no te alcanza. Ya existe, y nadie come mejor por usarlo.”
  - **Derecho, verde oscuro, “Con IA: un agente con 6 herramientas propias”.** Cuatro filas:
    - **Entiende:** “No como cerdo, quiero bajar de peso” se vuelve un menú a tu objetivo.
    - **Busca:** en un catálogo de más de 20.000 productos reales, elige el equivalente en cada súper.
    - **Decide:** si no alcanza la plata, cambia por alimentos que tu plan permite. Nunca achica porciones.
    - **Actúa:** guarda el menú, arma la lista y la recalcula con cada cambio.

**4:00 (2:30–2:55):** “La consigna pregunta: si le sacás la IA, ¿sigue funcionando? Sin IA, VIVERI es un comparador de precios: ya existe, y tenés que saber qué buscar, cuánto comprar y qué cambiar si no te alcanza. La IA sabe qué buscar: entiende tu objetivo, busca, decide y actúa. Es un agente con seis herramientas propias.”

**3:00 (1:55–2:08):** “Sin IA queda un comparador de precios: tenés que saber qué buscar. La IA entiende tu objetivo, busca, decide y actúa: es un agente con seis herramientas.”

### Slide 9 · Calidad (claro)

**En pantalla:**
- Título: **“Cómo sabemos que no inventa”**.
- Tres filas, cada una con un ícono de check verde:
  - **“Cada producto existe.”** Antes de guardar el menú, el código valida cada producto elegido contra el catálogo del súper.
  - **“Cada precio es real.”** Sale de la web del súper, con la fecha en que se leyó. El modelo nunca inventa un precio: solo repite los que calcula el código.
  - **“Cada cuenta es exacta.”** Totales, unidades de venta y súper más barato los calcula código con tests, no el modelo.

**4:00 (2:55–3:10):** “Y no inventa. Cada producto se valida contra el catálogo antes de guardarse, y cada precio viene de la web del súper, con fecha. Compruébenlo: en la pestaña Lista, cada producto tiene el link a su página.”

**3:00 (2:08–2:17):** “Y no inventa: cada producto se valida contra el catálogo, y los precios y las cuentas los pone el código, no el modelo.”

### Slide 10 · Impacto (oscuro)

**En pantalla:**
- Etiqueta: “IMPACTO POR PERSONA, POR AÑO”.
- Tres cifras grandes:
  - **Plata:** **“$ 21.000”** en naranja · “de vuelta en tu bolsillo”;
  - **Tiempo:** **“2 días”** · “de tu vida de vuelta hoy. 4 con el pedido automático.”;
  - **Salud:** **“7 de 7”** · “días con tu menú armado a tu objetivo. Lo sano pasa a ser lo fácil.”
- Debajo, una franja con borde: “Cada usuario nos cuesta **$ 10** de IA por semana. Ahorra **$ 405**.” y, a la derecha, en naranja gigante, **“40×”**.

**Nota al pie:** “Estimaciones. Plata: menú real de 7 días armado por VIVERI, precios del 17/10/2026: Disco $ 2.376, Géant $ 2.287, Ta-Ta $ 2.273; promedio $ 2.312; la opción más barata, Disco + Ta-Ta, $ 1.907: $ 405 por semana × 52. Tiempo: 52 h por año de planificar, hacer la lista y comparar; 104 h con el pedido automático, que todavía no está construido. IA: US$ 0,10 medido en un menú de 2 días con Claude Sonnet 5.5; la semana, unos US$ 0,25 (≈ $ 10), estimado.”

**4:00 (3:10–3:40):** “¿Qué significa para una persona? Con un menú real de una semana: veintiún mil pesos por año de vuelta en tu bolsillo. Más de dos días de tu vida de vuelta hoy, y cuatro cuando hagamos el pedido por vos. Y una dieta que se sostiene, porque lo sano pasa a ser lo más fácil. Y la IA rinde: cada usuario nos cuesta diez pesos por semana, y ahorra cuatrocientos. Cuarenta veces lo que cuesta.”

**3:00 (2:17–2:30):** “Por año: veintiún mil pesos de vuelta en tu bolsillo y más de dos días de tu vida. Y la IA rinde: diez pesos por semana para ahorrar cuatrocientos. Cuarenta veces.”

### Slide 11 · Cierre (claro)

**En pantalla:**
- El logo grande.
- “Hoy funciona de punta a punta: de tu dieta a tu compra, con precios reales. Lo próximo: que llegue sola a tu heladera.”
- [click] En grande: **“Comer bien,”** y, en naranja, **“sin que te cueste.”**
- Pie: “Equipo 23 · build 101”.

**4:00 (3:40–4:00):** “Hoy VIVERI funciona de punta a punta: de tu dieta a tu compra, con precios reales. Lo próximo: que llegue sola a tu heladera. Somos VIVERI. Comer bien, sin que te cueste.” [pausa] “Gracias.”

**3:00 (2:30–2:45):** “Hoy funciona de punta a punta, con precios reales; lo próximo es que llegue sola a tu heladera. Somos VIVERI. Comer bien, sin que te cueste. Gracias.”

## 4. Reglas

- **No inventes datos, citas ni logos.** Usá solo los números de arriba, con sus notas al pie.
- **El guion en voz alta es afirmativo:** nada de “más o menos” ni “estimamos”. La cautela va en la nota al pie.
- **No digas** que los precios son “de góndola”: son de las webs de los súper.
- **No digas** que la IA “nunca escribe un precio”: nunca lo *inventa*.
- **No digas** “la misma comida”: decí “el mismo menú”.
- **El pedido automático** siempre aparece como “lo próximo”, nunca como hecho.
- **El texto de cada slide** no repite el guion: el guion va en las notas.
- **Al final,** dame una tabla con los tiempos de cada slide en las dos versiones y el total: 4:00, y 2:45 o menos.
