// Dev-only list of the color directions the picker offers. The first is the default (index.css), the next
// three the original v2 directions (CSS in directions.css); the rest come from the palette exploration and have their CSS in palettes.css.
export type Palette = { id: string; name: string; mood?: string }

export const palettes: Palette[] = [
  { id: 'naranja-zapallo', name: 'Naranja zapallo', mood: 'Naranja zapallo un poco más oscuro y negro: la elegida.' },
  { id: 'coral', name: 'Coral manda', mood: 'Coral, aguamarina y negro: la anterior.' },
  { id: 'aguamarina', name: 'Aguamarina manda', mood: 'Aguamarina en las burbujas, coral para lo activo.' },
  { id: 'tropico', name: 'Trópico', mood: 'Coral, amarillo sol y aguamarina.' },
  { id: 'petroleo-azafran', name: 'Petróleo y azafrán', mood: 'Sereno y con carácter: un mar oscuro de petróleo donde el azafrán se prende como un sol en lo que está activo.' },
  { id: 'cacao-mburucuya', name: 'Cacao y mburucuyá', mood: 'Cálida y golosa como un bombón de mburucuyá: tus mensajes en chocolate y el oro de la fruta marcando lo activo.' },
  { id: 'palta', name: 'Palta', mood: 'Directa y gráfica, como una palta abierta en la tabla: pulpa verde, cáscara negra y mucho contraste.' },
  { id: 'tannat-menta', name: 'Tannat y menta', mood: 'Adulta y elegante, bien uruguaya: un tannat a contraluz con un toque de menta fresca.' },
  { id: 'mandarina-petroleo', name: 'Mandarina y petróleo', mood: 'Enérgica y jugosa: mandarina sobre blanco limpio, asentada por un petróleo profundo.' },
  { id: 'sandia', name: 'Sandía', mood: 'Juguetona y de verano: verde cáscara y rosa sandía, con semillas negras poniendo orden.' },
  { id: 'verde-lechuga', name: 'Verde lechuga', mood: 'Limpia y sin vueltas, como un cartel de feria: blanco puro, negro y un verde lechuga recién lavado.' },
]
