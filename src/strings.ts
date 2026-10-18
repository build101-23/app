import type { CatalogKey, Section } from '../supabase/functions/_shared/catalog.ts'
import type { StoreKey } from '../supabase/functions/_shared/stores.ts'

// All user-facing text, in Rioplatense Spanish (ADR 0006).
export const t = {
  loading: 'Cargando…',
  retry: 'Reintentar',
  signIn: {
    title: 'Ingresar',
    hint: 'Te mandamos un link a tu email para entrar, sin contraseña.',
    email: 'Email',
    send: 'Enviame un link para entrar',
    sending: 'Enviando…',
    sent: 'Revisá tu email y tocá el link para entrar.',
    otherEmail: 'Usar otro email',
    error: 'No pudimos mandar el link. Probá de nuevo en unos minutos.',
    orEmail: 'o con tu email',
    googleError: 'No se pudo entrar con Google. Probá de nuevo o usá tu email.',
  },
  nav: 'Secciones',
  tabs: { chat: 'Chat', menu: 'Menú', list: 'Lista', profile: 'Perfil' },
  // A feature that exists in the product plan but not in the app yet.
  soon: 'Muy pronto',
  chat: {
    welcome: 'Hola. Contame un poco de vos: ¿qué querés lograr con tu alimentación?',
    // Only what the chat does today, in the user's own words. Tapping one sends it.
    starters: 'Para empezar',
    intents: [
      'Armemos mi plan desde cero',
      'Tengo un plan de mi nutricionista',
      'Hay cosas que no puedo comer',
      'Tengo poco tiempo para cocinar',
    ],
    placeholder: 'Escribí tu mensaje…',
    send: 'Enviar',
    listen: 'Hablar',
    micError: 'No pude usar el micrófono.',
    // The visible status line: before the chat function reports a step, then each step it reports (ADR 0029).
    waiting: 'Armando la respuesta…',
    steps: {
      thinking: 'Pensando…',
      typing: 'Escribiendo…',
      search_products: 'Buscando los mejores precios…',
      save_menu: 'Armando tu menú…',
      save_profile: 'Guardando lo que me contaste…',
      update_shopping_list: 'Actualizando tu lista…',
      show_menu: 'Preparando tu menú…',
      show_shopping_list: 'Sumando tu lista…',
    } as Record<string, string>,
    disclaimer: 'No reemplaza a tu nutricionista.',
    healthData: 'Tus datos de salud',
    loading: 'Cargando la conversación…',
    error: 'No se pudo enviar. Probá de nuevo.',
    limit: 'Llegaste al límite de mensajes por hoy. Probá de nuevo mañana.',
    loadError: 'No se pudo cargar la conversación.',
    listError: 'No se pudo cargar la lista de chats.',
    chats: 'Chats',
    newChat: 'Nuevo chat',
    noChats: 'Todavía no tenés chats.',
    noReply: 'No pude responder eso. Probá decirlo de otra forma.',
    openMenu: 'Ver menú',
    // The menu card in the chat: its title, and how long the menu is.
    menuCard: { title: 'Tu menú', length: (days: number) => (days === 1 ? '1 día' : `${days} días`) },
    // The list card in the chat: its title, how many products are left to buy, and where the total buys them.
    listCard: {
      title: 'Tu lista',
      count: (n: number) => (n === 1 ? '1 producto' : `${n} productos`),
      allAt: (store: string) => `Todo en ${store}`,
      splitAt: (a: string, b: string) => `${a} y ${b}`,
    },
    openList: 'Ver lista',
  },
  menu: {
    empty: 'Todavía no hay menú. Pedíselo al chat, para la semana o para los días que quieras.',
    loading: 'Cargando el menú…',
    loadError: 'No se pudo cargar el menú.',
    // The day strip's name for screen readers, and the headings inside an opened meal.
    dayPicker: 'Día del menú',
    ingredients: 'Ingredientes',
    how: 'Cómo se hace',
    changeThisDay: (day: string) => `Cambiar el ${day}`,
    changeThisMeal: 'Cambiar este plato',
    // Lowercase to fit inside a sentence; headings capitalize them with CSS.
    days: {
      monday: 'lunes',
      tuesday: 'martes',
      wednesday: 'miércoles',
      thursday: 'jueves',
      friday: 'viernes',
      saturday: 'sábado',
      sunday: 'domingo',
    },
    units: { g: 'g', ml: 'ml', un: 'u.', kg: 'kg', l: 'L' },
    // Drafts left in the chat box for the user to finish.
    changeDay: (day: string) => `Cambiar el ${day}: `,
    changeMeal: (slot: string, day: string) => `Cambiar ${slot.toLowerCase()} del ${day}: `,
    // With the numbers switch on. Amounts come in already formatted ("1.850").
    macros: (kcal: string, protein: string, carbs: string, fat: string) =>
      `${kcal} kcal · ${protein} g prote · ${carbs} g carbos · ${fat} g grasa`,
    dayTotal: 'Total del día',
    // After the macros when some foods have no values: "(sin contar espinaca, mayonesa)".
    without: (names: string) => `sin contar ${names.toLowerCase()}`,
  },
  list: {
    loading: 'Cargando la lista…',
    hint: 'Tachá lo que ya tenés en casa.',
    // The chat's list card when everything is crossed out.
    nothingLeft: 'No te falta comprar nada.',
    share: 'Compartir',
    copy: 'Copiar',
    copied: 'Lista copiada.',
    copyError: 'No se pudo copiar.',
    saveError: 'No se pudo guardar. Se guarda con tu próximo cambio.',
    reset: 'Restablecer lista',
    resetConfirm: '¿Desmarcar todo lo que tenés en casa?',
    // The first line of the shared or copied text.
    title: 'Lista de compras',
    // Next to what to buy when it differs from what the menu uses: "2 × 1 kg (menú: 1,1 kg)".
    menuNeeds: 'menú:',
    have: (name: string) => `Ya tengo ${name.toLowerCase()}`,
    less: (name: string) => `Comprar menos ${name.toLowerCase()}`,
    more: (name: string) => `Comprar más ${name.toLowerCase()}`,
    // In this order on the list.
    sections: {
      produce: 'Frutas y verduras',
      pantry: 'Almacén',
      meat: 'Carnes y pescado',
      dairy: 'Lácteos, fiambres y huevos',
      other: 'Otros',
    } satisfies Record<Section | 'other', string>,
  },
  stores: { disco: 'Disco', geant: 'Géant', tata: 'Ta-Ta' } satisfies Record<StoreKey, string>,
  // The List tab's price block. Amounts come in already formatted ("$ 1.937").
  prices: {
    where: 'Dónde comprar',
    cheaperThan: (amount: string, store: string) => `${amount} menos que todo en ${store}`,
    noOneStore: 'Ningún súper tiene toda la lista.',
    // The savings card on the recommended store's tab: this list against the stores' average, and over a month of it.
    saving: {
      title: (amount: string) => `Ahorrás ${amount}`,
      vsAverage: 'frente al promedio de los súper',
      perMonth: (amount: string) => `Unos ${amount} al mes`,
      perMonthNote: 'Si repetís este menú todo el mes, con los precios de hoy.',
    },
    // Under the chosen total, for menus of 2 days or more: "$ 277 por día · menú de 7 días".
    perDay: (amount: string, days: number) => `${amount} por día · menú de ${days} días`,
    missing: (n: number) => (n === 1 ? '1 producto no encontrado' : `${n} productos no encontrados`),
    notFound: 'No encontrado online',
    // Under a line the selected store doesn't sell (ADR 0034).
    notAt: (store: string) => `No está en ${store}`,
    // On the tab of the store the rule recommends: the cheapest that has the whole list.
    cheapest: 'Recomendado',
    checked: (date: string) => `Precios de las webs de los súper del ${date}, sin envío. Pueden variar.`,
    loading: 'Buscando precios…',
    loadError: 'No se pudieron cargar los precios.',
    // A menu saved before real products (ADR 0024).
    oldMenu: 'Pedile al chat que arme el menú de nuevo para ver precios reales.',
    none: 'No encontramos estos productos en los súper.',
    budgetFits: (budget: string, left: string) => `Entra en tu presupuesto de ${budget} (te sobran ${left}).`,
    budgetOver: (budget: string, missing: string) => `No alcanza tu presupuesto de ${budget}: faltan ${missing}.`,
    splitFits: (a: string, b: string) => `Entra si dividís la compra entre ${a} y ${b}.`,
    // Under a line, the product to buy at its store: "Arroz Blanco SAMAN 1 kg · Ta-Ta". The amount and the price have their own places.
    product: (name: string, store: string) => `${name} · ${store}`,
  },
  // The cart buttons at the bottom of "Dónde comprar" (docs/plans/2026-10-18-fill-cart.md).
  // The order button under the list (ADR 0034).
  cart: {
    order: (store: string) => `Comprar ahora en ${store}`,
    // On the button in the actions row, next to its siblings: the store's icon says where; the name is for screen readers.
    orderShort: 'Comprar',
    adds: (n: number, total: string) =>
      `Se ${n === 1 ? 'agrega 1 producto' : `agregan ${n} productos`} a tu carrito · ${total} estimado, sin envío. Lo que ya tenías en el carrito queda.`,
    // What the cart leaves out, one line per reason, worded so nothing has to agree with the names ("Ajo, Lentejas").
    left: {
      not_here: (store: string, names: string) => `${store} no tiene: ${names}.`,
      weighed: (_store: string, names: string) => `Agregar a mano (por peso): ${names}.`,
      not_found: (_store: string, names: string) => `Ningún súper tiene: ${names}.`,
    },
    // Disco and Géant, until the extension.
    byHand: (store: string) => `Por ahora, agregá los productos de ${store} desde el link de cada uno.`,
    // After the tap: the store's cart opens in another tab.
    opened: (store: string) => `Abrimos tu carrito de ${store} en otra pestaña. Revisalo y pagá ahí.`,
  },
  foods: {
    chicken_breast: 'Pechuga de pollo',
    chicken_leg: 'Pata y muslo de pollo',
    ground_beef: 'Carne picada',
    beef_round: 'Nalga',
    pork_loin: 'Lomo de cerdo',
    ham: 'Jamón cocido',
    egg: 'Huevo',
    canned_tuna: 'Atún en lata',
    hake_fillet: 'Filet de merluza',
    milk: 'Leche',
    yogurt: 'Yogur natural',
    cheese: 'Queso dambo',
    ricotta: 'Ricota',
    cream_cheese: 'Queso untable',
    butter: 'Manteca',
    rice: 'Arroz',
    pasta: 'Fideos',
    oats: 'Avena',
    flour: 'Harina',
    bread: 'Pan',
    sliced_bread: 'Pan de molde',
    polenta: 'Polenta',
    lentils: 'Lentejas',
    chickpeas: 'Garbanzos',
    beans: 'Porotos',
    crushed_tomato: 'Tomate triturado',
    tart_crust: 'Tapa de tarta',
    breadcrumbs: 'Pan rallado',
    sunflower_oil: 'Aceite de girasol',
    olive_oil: 'Aceite de oliva',
    sugar: 'Azúcar',
    peanuts: 'Maní',
    peanut_butter: 'Pasta de maní',
    rice_cakes: 'Galletas de arroz',
    crackers: 'Galletas al agua',
    potato: 'Papa',
    sweet_potato: 'Boniato',
    onion: 'Cebolla',
    carrot: 'Zanahoria',
    tomato: 'Tomate',
    lettuce: 'Lechuga',
    zucchini: 'Zapallito',
    pumpkin: 'Zapallo',
    bell_pepper: 'Morrón',
    chard: 'Acelga',
    broccoli: 'Brócoli',
    garlic: 'Ajo',
    banana: 'Banana',
    apple: 'Manzana',
    orange: 'Naranja',
    mandarin: 'Mandarina',
    lemon: 'Limón',
    canned_peas: 'Arvejas en lata',
    canned_corn: 'Choclo en lata',
  } satisfies Record<CatalogKey, string>,
  // The health-data consent doesn't exist yet (milestone 6): say so, and only what's true today.
  healthData: {
    title: 'Tus datos de salud',
    soon: 'Acá vas a poder leer y aceptar cómo usamos tus datos de salud.',
    now: 'Por ahora, tus mensajes y lo que le contás al chat (tu objetivo, tus gustos, lo que no podés comer) quedan guardados en tu cuenta.',
    close: 'Entendido',
  },
  profile: {
    loading: 'Cargando tu perfil…',
    loadError: 'No se pudo cargar tu perfil.',
    empty: 'Todavía no hay nada guardado. Contáselo al chat.',
    openChat: 'Ir al chat',
    // The two cards of what the chat saved: the facts, then the lists.
    about: 'Sobre vos',
    tastes: 'Tus gustos',
    goal: 'Objetivo',
    meals: 'Comidas por día',
    cookingTime: 'Tiempo para cocinar',
    plan: 'Plan de nutricionista',
    yes: 'Sí',
    no: 'No',
    cantEat: 'No puedo comer',
    dislike: 'No me gusta',
    like: 'Me gusta',
    want: 'Quiero comer',
    // The numbers switch (product.md: numbers are optional, hidden by default).
    numbers: 'Mostrar números',
    numbersHint: 'Calorías y macros en tu menú',
    numbersError: 'No se pudo guardar. Probá de nuevo.',
    signOut: 'Cerrar sesión',
  },
}
