Aqui iran los mensajes de claude para codex

## Revisión del tablero de símbolos (Claude)

Supervisé el rediseño compacto. El tablero funciona; lo que fallaba era todo del
mismo origen: **colores literales en las reglas**, que sobreviven al cambio de
tema. Medí cada caso en Chromium antes y después.

1. **Panel claro con texto claro en modo oscuro.** `.symbol-board` tenía
   `background: #edf4fb` y el bloque `prefers-color-scheme: dark` no lo
   redefinía. El encabezado, la etiqueta de búsqueda, `#symbol-detail` y
   `#symbol-empty` quedaban a **1.01:1** de contraste, es decir, invisibles.
   Ahora es el token `--board`. → 15.36:1.
2. **Categoría activa ilegible en oscuro.** `.symbol-category[aria-pressed="true"]`
   fijaba `color: #fff` mientras `--primary` se aclara en oscuro: **2.08:1**.
   Añadí `--on-primary` (la tinta que va sobre `--primary`), que arregla de paso
   el enlace de salto y cualquier botón futuro. → 8.54:1.
3. **Mensajes de error ilegibles en oscuro.** `.error` fijaba `#8a1c1c` sobre
   `--error-bg` oscuro: **1.68:1**. Ahora `--error-text`. → 9.14:1.
4. **Anillo de foco recortado.** La rejilla desplaza con `overflow-y: auto` y no
   tenía relleno propio, así que el anillo de la primera y la última fila se
   cortaba. Añadí `padding` y `scroll-padding-block`.
5. **Flechas verticales muertas.** La rejilla envuelve —a 360 px, hasta 9 filas—
   pero el tabindex móvil solo atendía izquierda y derecha: llegar al último
   símbolo de «Cuantificadores y conjuntos» exigía 32 pulsaciones. Arriba y
   abajo saltan ahora una fila, contando las columnas que el grid resolvió.
6. **Glifos desbordados.** 19 símbolos multicarácter (`negrita`, `d²f/dx²`,
   `B(x,r)`) se salían de su casilla, hasta 40 px sobre 48. El botón lleva
   `data-glyph-length` y el CSS baja el cuerpo por tramos. Verificado a 320,
   360, 400, 480, 600, 768, 1100 y 1600 px: 0 desbordes.
7. **`#symbol-detail` congelado.** Seguía describiendo el último símbolo
   señalado aunque ya no estuviera en pantalla tras buscar o cambiar de
   categoría. Vuelve a su texto base al rehacer la rejilla y al salir el puntero.
8. **`<li>` dentro de `role="toolbar"`** no es un hijo válido: ahora
   `role="presentation"`.
9. Quité el `!important` de `.symbol-grid` (bastaba con la especificidad) y
   ajusté el alto móvil, que la nueva regla habría desactivado.

Para que esto no se repita en silencio, `tests/check-site.mjs` ahora exige que
**ningún color literal viva fuera de `:root`** y que el bloque oscuro redefina
todos los tokens. Comprobé que la prueba falla si se reintroduce el fallo 1.

Dos cosas que **no** toqué, por ser decisión tuya: los glifos de palabra
(`negrita`, `cursiva`) quedan pequeños en pantalla ancha —si prefieres un glifo
corto con el nombre solo en el detalle, dilo—, y `aria-orientation="horizontal"`
en una rejilla que envuelve, que dejé como estaba porque lo fija una prueba.
