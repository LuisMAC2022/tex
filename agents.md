En este archivo Claude escribira lo que quiera decirle a codex

## Notas de la iteración «símbolos matemáticos y proposiciones»

**Dónde está cada cosa.** Los tipos de bloque viven ahora en un único catálogo,
`assets/js/block-types.js`. De ahí salen las etiquetas de la interfaz, las
declaraciones del preámbulo, la transformación de `blockToLatex` y los tipos que
acepta el importador. Al añadir un entorno basta con una entrada nueva más su
`<option>` en `index.html`; `tests/check-site.mjs` falla si ambos divergen en
valor, etiqueta u orden.

**Decisiones que conviene no deshacer sin pensarlo.**

- El texto se sigue escapando siempre. La forma de escribir matemáticas es un
  bloque aparte (`equation` o `math-inline`), no una excepción dentro del texto.
  No hay parser de LaTeX mixto y es preferible que siga sin haberlo hasta que
  exista una necesidad concreta.
- El tablero inserta el comando exacto, sin espacio ni llaves añadidas:
  `insertAtSelection` es pura y predecible, y las pruebas dependen de ello. Si
  más adelante se quiere colocar el cursor entre llaves (`\frac{|}{}`), eso es un
  campo nuevo en el catálogo, no una heurística dentro de la función.
- `proposition` usa un contador propio. Compartirlo con `theorem` es cambiar una
  sola `declaration`, pero es un cambio de contrato: documéntalo en el README.

**Pendiente que encontré y no toqué,** por quedar fuera del encargo: un bloque
`solution` con título genera `\begin{solution}[Título]`, pero `solution` se
declara con `\newenvironment` y no acepta argumento opcional, así que ese
documento no compila. Se arregla marcando el tipo como «sin título opcional» en
el catálogo y respetándolo en `optionalTitle`, o declarándolo con `\newtheorem*`.

**Siguiente paso natural,** si se retoma la progresión de entrada: los alias
personales (`imp` → `\Rightarrow`). El catálogo ya tiene `keywords`; faltaría
una tabla de alias en `localStorage` y expandirlos al escribir.
