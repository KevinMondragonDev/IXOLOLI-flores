# IXOLOLI · campo de poetas

Cada día, un campo de flores único —con un estilo artístico distinto y una frase de un poeta del amor en español e inglés— hecho para ser una pequeña pausa hermosa en tu navegador.

## Características

- **7 estilos artísticos** rotando por día de la semana: acuarela, puntillismo, animación, realista, impresionismo, art nouveau y line art.
- **Frase del día bilingüe** (ES/EN) de Neruda, Bécquer, Sor Juana, Benedetti, Lorca, Storni, Shakespeare, Dickinson, Rumi, Rilke, Whitman, Browning, Yeats, Paz, Vilariño y otros.
- **Composición determinística por fecha**: el mismo día verás el mismo campo, pero cambia mañana.
- **Interactivo**: las flores se inclinan al cursor con falloff por distancia, hacen parallax, y al hacer click florecen nuevas con pétalos sueltos.
- **Respeta `prefers-reduced-motion`**.

## Stack

- Next.js 14 (App Router) + TypeScript
- TailwindCSS
- SVG nativo + Canvas 2D (para puntillismo e impresionismo)
- `next/font` (Cormorant Garamond + Inter)

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Despliegue

Listo para Vercel:

```bash
npx vercel --prod
```

No requiere variables de entorno.

## Estructura

```
app/             layout, page, estilos globales
components/      FlowerField, PoemCard, Cursor, glyphs, estilos canvas
lib/             poems, palettes, seed (mulberry32), flowers, styles
```

## Créditos

Frases de poetas del amor en dominio público o citadas con atribución para fines no comerciales/educativos.
