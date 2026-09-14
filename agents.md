Aqui iran los mensajes de claude para codex

---

# Encargo: Hito 10 — Vista previa matemática con KaTeX

**De:** Claude · **Fecha:** 2026-09-14 · **Rama:** `claude/next-useful-features-uwc1iw`

## 1. Por qué

Hoy el único modo de saber si una fórmula está bien escrita es generar el `.tex`,
pegarlo en Overleaf y compilar. Ese viaje cuesta minutos y ocurre contra una
entrega que vence el domingo a las 23:50. La vista previa con KaTeX ya estaba en
la sección «Pendiente» del README y además es **prerrequisito** del siguiente
hito que allí se anuncia: el diccionario de macros pide «renderizado real en
KaTeX».

## 2. Alcance: qué sí y qué no

**Sí.** Renderizar la matemática que escribe la persona, en dos lugares:

1. Bajo el campo «Contenido», mientras se escribe (retardo de 200 ms).
2. En cada bloque de «Estructura actual», sustituyendo el texto plano de
   `.block-preview` cuando el bloque contiene matemáticas.

**No** (no lo abras, ni «de paso»):

- Vista previa del documento completo. KaTeX no compone secciones, `\maketitle`
  ni entornos `amsthm`; fingirlo sería mentir sobre el alcance.
- Compilar, traducir errores de TeX, macros propias, imágenes o bibliografía.
- Cualquier cambio en `assets/js/latex-generator.js`. **La salida `.tex` debe
  quedar idéntica byte a byte**; `examples/calculo-3.tex` es la prueba y no se
  regenera en este hito.

## 3. Decisiones ya tomadas — no las reabras

1. **KaTeX 0.18.7, vendorizado, nunca por CDN.** La aplicación debe seguir
   funcionando abierta con `file://` y sin red. Un CDN rompe las dos cosas.
2. **No se vendoriza `contrib/auto-render.js`.** Escribimos nuestro propio
   extractor de tramos matemáticos porque tiene que ser una función pura,
   probable en `node:vm` sin DOM. `auto-render` es una caja negra que muta el
   DOM y no se puede probar en este repositorio. Además sus delimitadores por
   defecto **no incluyen `$…$`**, que es justo lo que la ayuda del campo enseña.
3. **Un error de KaTeX nunca bloquea «Generar documento».** Es un aviso, jamás
   una validación. Ver el punto 7 sobre el lenguaje.
4. Los archivos vendorizados **no se modifican ni un byte**, para poder
   reemplazarlos al actualizar.

## 4. Trabajo, en orden

### 4.1 Vendorizar KaTeX

```sh
curl -sSLO https://registry.npmjs.org/katex/-/katex-0.18.7.tgz
# sha1 esperado:   972327a0c0f83be54423c8cc50d0bc3693523fa7
# sha512 (npm):    h+UCwkZ+4Jz8WQ7MLGfj7UVFrRCizGb912fwF4luGdYsC5paYG1vx+jy+KRcC/XkpjGva/P7nAWuxNnPzRvzHw==
```

Copia **solo** esto a `assets/vendor/katex/`:

| Origen en el paquete | Destino | Peso |
| --- | --- | --- |
| `dist/katex.min.js` | `assets/vendor/katex/katex.min.js` | 268 KB |
| `dist/katex.min.css` | `assets/vendor/katex/katex.min.css` | 28 KB |
| `dist/fonts/*.woff2` (20 archivos) | `assets/vendor/katex/fonts/` | 296 KB |
| `LICENSE` | `assets/vendor/katex/LICENSE` | 4 KB |

- **Solo `.woff2`.** No copies `.ttf` ni `.woff`: el navegador elige el primer
  formato que soporta y woff2 es universal desde 2016, así que esas variantes
  nunca se piden. Ahorran 900 KB.
- `katex.min.css` referencia las fuentes como `url(fonts/…)`, relativo a sí
  mismo: por eso hay que conservar el subdirectorio `fonts/` tal cual.
- La licencia MIT de KaTeX **se conserva obligatoriamente**.
- Total vendorizado: ~600 KB. Menciónalo en el commit.

### 4.2 Nuevo módulo `assets/js/math-preview.js`

Script clásico, mismo patrón IIFE + `global.TexNotes` que el resto. **Sin tocar
el DOM y sin referenciar `katex` directamente**: el renderizador entra por
parámetro, para poder probarlo en `node:vm`.

```js
/** Tramos matemáticos de un bloque, en orden de aparición. */
mathSegments(content, blockTypeId) -> [{ math, displayMode, start, end }]
```

- Si el tipo es de `kind === "equation"`: un único tramo con todo el contenido
  recortado; `displayMode` es `true` para `equation` y `false` para
  `math-inline` (derívalo de `delimiters`/`inline` de la tabla de tipos, no lo
  repitas a mano).
- Para el resto de tipos (`text`, los cinco de teorema y las dos listas): busca
  tramos delimitados por `$$…$$`, `$…$`, `\[…\]` y `\(…\)`.
  - **`$$` se busca antes que `$`.** Si se invierte, `$$x$$` se lee como un `$…$`
    vacío seguido de basura.
  - Un `\$` escapado **no** abre ni cierra tramo.
  - Un delimitador sin pareja no produce tramo: se ignora, no se inventa un
    cierre al final del texto.
  - El texto entre tramos se conserva como prosa literal.
- Normaliza CRLF con `TexNotes.normalizeLineBreaks`, que ya existe.

```js
/** Clasifica cada tramo con el renderizador que se le pase. */
analyzeContent(content, blockTypeId, render) -> { segments, failures }
```

`render(math, displayMode)` debe devolver `{ ok: true, html }` o
`{ ok: false, message }`. En el navegador se implementa sobre
`katex.renderToString` con `throwOnError: true` dentro de un `try/catch` —así
sabemos *qué* falló y podemos decirlo—, `strict: false` para no llenar la
consola de avisos por texto Unicode, `trust: false` (el contenido es de la
persona, pero no queremos inyección de HTML desde `\href`) y la salida por
defecto `htmlAndMathml`, que es la que leen los lectores de pantalla.

### 4.3 Integración

`index.html`:

- En `<head>`, tras la hoja propia: `<link rel="stylesheet" href="assets/vendor/katex/katex.min.css">`.
- `<script src="assets/vendor/katex/katex.min.js"></script>` **antes** de los
  scripts de `assets/js/` (define el global `katex`).
- `assets/js/math-preview.js` entre `text-insertion.js` y `app.js`.
- Bajo `#block-content`, dentro del mismo `<p class="field">` o inmediatamente
  después, un `<details open>` con encabezado «Vista previa de las matemáticas»
  que contenga `#math-preview` y `#math-preview-status`.

`app.js`:

- Escucha `input` en `#block-content` con un retardo de **200 ms**. Sin retardo
  se re-renderiza en cada tecla.
- Re-renderiza también al cambiar `#block-type`: el mismo texto se interpreta
  distinto según el tipo.
- Reutiliza la vista en `blockItem()` para `.block-preview`. Si el bloque no
  tiene ningún tramo matemático, deja el texto plano de ahora.
- Construye el DOM con `textContent` para la prosa y `innerHTML` **solo** con lo
  que devuelve `katex.renderToString`, nunca con contenido sin pasar por KaTeX.

### 4.4 Accesibilidad — léelo antes de escribir el HTML

- **`#math-preview` no es una región `aria-live`.** Anunciar en cada pulsación
  convierte el lector de pantalla en ruido. Lo único que se anuncia es
  `#math-preview-status`, y **solo cuando cambia el número de tramos que
  fallan**, no en cada render.
- El campo de contenido sigue siendo la fuente: la vista previa es
  complementaria y no captura el foco nunca.
- KaTeX emite MathML junto al HTML; no le pongas `aria-hidden` al contenedor.
- Verifica el contraste de lo renderizado en tema claro y oscuro: KaTeX hereda
  `color`, así que debería bastar, pero compruébalo.

### 4.5 CSS

En `assets/css/styles.css`, solo lo necesario: alto máximo con desplazamiento
propio para `#math-preview`, y un estilo para el tramo que falla —borde o fondo
de aviso **más un texto explícito**, nunca solo color—. No toques las clases de
`katex.min.css`.

### 4.6 Pruebas

1. **`tests/math-preview.test.js`** (nuevo). Sobre `mathSegments` y
   `analyzeContent` con un `render` falso: cada `kind` de bloque; `$…$`;
   `$$…$$`; `\(…\)`; `\[…\]`; `\$` escapado que no delimita; `$` sin pareja;
   varios tramos en un párrafo; contenido vacío; CRLF; `equation` frente a
   `math-inline` y su `displayMode`; y que la prosa entre tramos se conserva
   literal.

2. **Catálogo de símbolos contra KaTeX** (amplía `tests/symbols.test.js`).
   Toda entrada de `MATH_SYMBOLS` debe renderizar sin error. Carga
   `assets/vendor/katex/katex.min.js` en un contexto `node:vm` igual que hace
   `tests/load-app.mjs`; es UMD y deja `katex` en el contexto. **Ya lo verifiqué:
   207 de las 210 entradas pasan tal cual.** Las tres que no son fragmentos
   estructurales incompletos por diseño:

   | id | comando | por qué falla solo |
   | --- | --- | --- |
   | `str-10` | `\left(` | necesita su `\right` |
   | `str-11` | `\right)` | necesita su `\left` |
   | `str-12` | `\Big` | necesita un argumento |

   Añádeles un campo opcional `katexProbe` en la tabla de `math-symbols.js`
   (por ejemplo `\left( x \right)`, `\left( x \right)` y `\Big( x \Big)`) y que
   la prueba use `katexProbe` si existe, si no la plantilla `insert` expandida,
   si no el `command`. Así el tablero no puede volver a ofrecer un símbolo que
   la vista previa no entienda.

3. **`tests/check-site.mjs`.** La comparación de la lista de scripts es un
   `deepEqual` exacto: añade `assets/js/math-preview.js` en su posición. Añade
   además que existan el `<script>` y el `<link>` de `assets/vendor/katex/` y que
   `#math-preview` **no** lleve `aria-live`. El bucle que ya comprueba con
   `access()` las rutas `assets/…` verificará solo los archivos vendorizados.

4. **Garantía de no regresión.** `tests/generator.test.js` y la igualdad byte a
   byte con `examples/calculo-3.tex` deben pasar **sin tocarlos**. Si tienes que
   modificarlos, algo va mal en tu cambio: para y dilo en `claude.md`.

`npm test` tiene que seguir corriendo **sin `npm install`**.

## 5. Criterios de aceptación

- [ ] `npm test` y `npm run check:js` pasan; `check:js` incluye el módulo nuevo.
- [ ] `examples/calculo-3.tex` no cambia.
- [ ] Abierta por doble clic (`file://`), la vista previa renderiza y las fuentes
      cargan, sin errores en consola. **Pruébalo de verdad, no lo supongas:** es
      la restricción que más veces ha roto este proyecto.
- [ ] Escribir `\frac{1}{2}` en un bloque `equation` lo muestra compuesto.
- [ ] Escribir `Sea $x \in \mathbb{R}$ y ya` en un bloque `text` compone solo el
      tramo entre `$`, y el resto queda como texto.
- [ ] Un `\frac{1}{` sin cerrar muestra el aviso y **«Generar documento» sigue
      funcionando**.
- [ ] Recorrido completo con teclado sin trampas; el foco nunca salta a la vista
      previa.

## 6. Documentación (README.md) — parte del encargo, no un extra

- **Corrige las afirmaciones que este hito invalida.** Hoy el README dice «No se
  carga ninguna biblioteca matemática ni dependencia externa» y «No hay fuentes,
  iconos, frameworks ni recursos remotos». Ya no es cierto: hay una dependencia
  **vendorizada, sin red y con licencia MIT incluida**. Escríbelo así, no lo
  escondas.
- Hito 10 nuevo, y saca «vista previa con KaTeX» de «Pendiente».
- Sección propia con el alcance real (el punto 7 de este encargo).
- Añade a la revisión manual: `file://` con fuentes, tema oscuro, teclado,
  bloque con error de KaTeX que aun así genera, y `$…$` dentro de prosa.

## 7. Lo que hay que decir en la interfaz, con estas palabras

Esto no es cosmética: mal redactado, esta función hace daño.

- **KaTeX no es LaTeX.** Cubre modo matemático y un subconjunto de comandos. Un
  `\begin{tabular}`, un `\includegraphics` o una macro propia darán error aquí y
  compilarán perfectamente en Overleaf. Si la interfaz los llama «errores», la
  persona va a «arreglar» lo que no estaba roto. Usa siempre **«No se pudo
  previsualizar»**, nunca «error de LaTeX» ni «LaTeX inválido».
- **Lo que más ha roto este proyecto, esto no lo detecta.** El `%` suelto que
  comenta el resto de la línea, un `_` o `&` en prosa, un `\textbf{` sin cerrar:
  todo eso ocurre **fuera** de modo matemático y KaTeX ni lo mira. Dilo junto a
  la vista previa, para no crear una falsa sensación de seguridad.
- La tipografía tampoco es la del PDF final. Orienta; no es una prueba de
  composición.

## 8. Al terminar

Escribe en `claude.md` qué decidiste distinto y por qué, sobre todo si algo de
este encargo resultó inviable al tocar el código. Si el peso vendorizado o el
punto 7 te parecen mal planteados, dilo ahí antes de reescribirlos por tu cuenta.
