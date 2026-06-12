# IXOLOLI · campo de poetas

Cada día, un campo de flores único —con un estilo artístico distinto y una frase de un poeta del amor en español e inglés— hecho para ser una pequeña pausa hermosa en tu navegador.

## Características

- **7 estilos artísticos** rotando por día de la semana: acuarela, puntillismo, animación, realista, impresionismo, art nouveau y line art.
- **Frase del día bilingüe** (ES/EN) de Neruda, Bécquer, Sor Juana, Benedetti, Lorca, Storni, Shakespeare, Dickinson, Rumi, Rilke, Whitman, Browning, Yeats, Paz, Vilariño y otros.
- **Composición determinística por fecha**: el mismo día verás el mismo campo, pero cambia mañana.
- **Interactivo**: las flores se inclinan al cursor con falloff por distancia, hacen parallax, y al hacer click florecen nuevas con pétalos sueltos.
- **Respeta `prefers-reduced-motion`**.

## Stack

- Next.js 14 (App Router) + TypeScript + TailwindCSS
- `next/font` (Cormorant Garamond + Inter)
- **Una librería distinta por estilo / día** (cargadas con `next/dynamic`):

| Día | Estilo | Librería |
|---|---|---|
| Domingo | Trazo a mano | [`roughjs`](https://github.com/rough-stuff/rough) |
| Lunes | Acuarela | SVG + filtros (`feTurbulence` + `feDisplacementMap`) |
| Martes | Puntillismo | [`pixi.js`](https://pixijs.com) v8 |
| Miércoles | Cartoon | [`@lottiefiles/dotlottie-react`](https://github.com/LottieFiles/dotlottie-web) |
| Jueves | Realista (3D) | [`@react-three/fiber`](https://github.com/pmndrs/react-three-fiber) + `drei` + `postprocessing` |
| Viernes | Girasoles | [`@tsparticles/react`](https://particles.js.org/) (corazones) + [`gsap`](https://gsap.com/) |
| Sábado | Art Nouveau | [`paper.js`](http://paperjs.org) |

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
