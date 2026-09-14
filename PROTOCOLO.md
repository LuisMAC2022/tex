# Protocolo de documentación de diseño

Reglas permanentes para cualquier agente que trabaje en este repositorio —Codex,
Claude o quien venga—. Este archivo casi no cambia. Los buzones `agents.md` y
`claude.md` son transitorios y **no** son fuente de reglas (DEC-006).

## Qué se lee, y cuándo

| Siempre | Al tocar un archivo | Solo cuando algo parece arbitrario |
| --- | --- | --- |
| `INVARIANTES.md` | los bloques `@decision` que ya están en él | `decisiones/` |

`README.md` se lee al empezar un trabajo sobre el contrato del documento
generado. `docs/` no se lee de entrada: son listas de trabajo y material
derivado. **`decisiones/` nunca se carga completo**: se abre la entrada que
responde a la pregunta que se tiene. Por eso puede crecer sin coste.

## Dónde va cada cosa que se aprende

La pregunta no es «¿esto es importante?» —eso es un juicio y se responde
distinto cada vez—, sino **«¿puedo escribir una prueba que falle si esto se
viola?»**:

1. **Sí, y vale para todo el repositorio** → entrada en `INVARIANTES.md` *más* su
   guardián real. Sin guardián no entra: `tests/invariantes.test.js` lo rechaza.
2. **No es comprobable, pero vale para todo el repositorio, o gobierna algo que
   se rechazó y por tanto no tiene código** → entrada nueva en `decisiones/`.
3. **En cualquier otro caso** → bloque `@decision` sobre el código que gobierna.

Un rasgo del sistema que simplemente *describe* cómo funciona hoy —qué hace un
módulo, qué forma tiene el `.tex`— no es ninguna de las tres: va al `README.md`,
que se sobrescribe.

## Reglas de escritura

- **`README.md` se sobrescribe.** Describe el estado actual: contrato, forma del
  documento, uso. No lleva justificaciones («se hizo así porque…»): esas van a
  `decisiones/`. No lleva inventarios de pruebas: los genera
  `npm run inventario`. No lleva listas de revisión: viven en `docs/`.
- **`decisiones/` y los bloques `@decision` son de solo añadir.** Para invalidar
  una decisión se pone `status: superseded` y `superseded-by: DEC-NNN` en la
  entrada vieja, y se escribe la nueva. **Nunca se reescribe ni se borra una
  justificación existente**: explica por qué se intentó algo, que es lo que evita
  repetirlo.
- **Al cambiar código bajo un bloque `@decision`**: o se actualiza el bloque, o
  —si la justificación sigue vigente— se ejecuta `npm run bendecir` y se dice en
  el commit que se revisó. Dejar el ancla derivada rompe `npm test`.
- **Lo derivado se regenera, no se edita.** `docs/pruebas.md` sale de la suite
  con `npm run inventario` y `examples/calculo-3.tex` de `npm run build:example`.
  Editarlos a mano rompe `npm test`.
- **`npm test` tiene que pasar** antes de terminar. Incluye las pruebas de
  invariantes, de anclas y de documentación.

## Formato de un bloque `@decision`

Comentario de bloque cerrado con la marca del lenguaje (`*/` en JS y CSS,
`-->` en HTML), inmediatamente encima del código que gobierna:

```js
/* @decision DEC-004 ancla:nueva tramo:6
 * El contenido no recibe ningún escape. Escapar «solo algunos» reservados
 * rompía un \begin{align} pegado desde otro documento: fallaba justo en el
 * caso que prometía resolver. Los metadatos sí se escapan, en escapeMetadata().
 */
function contentToLatex(value = "") {
  return normalizeLineBreaks(value);
}
```

- `DEC-NNN` tiene que existir en `decisiones/` y no estar `superseded`.
- `tramo` cuenta **líneas no vacías** después del `*/`. Se cuentan las del tramo
  que la decisión gobierna: la función, el bloque, la regla CSS.
- `ancla:nueva` se escribe a mano y se resuelve con `npm run bendecir`. Dejarla
  sin resolver rompe `npm test`.
- La huella colapsa cada tramo de espacios en uno solo: **reindentar no la
  altera**. Cambiar los espacios *dentro* de una línea sí —`f(x)` y `f( x )`
  dan huellas distintas—, así que un formateador automático la movería.

## Comandos

```sh
npm test               # todo, incluidas invariantes y anclas
npm run bendecir       # recalcula anclas tras revisar la justificación
npm run bendecir -- --listar   # informa sin escribir
npm run inventario     # regenera docs/pruebas.md desde la suite (hay prueba que lo exige)
npm run check:js       # sintaxis de los siete archivos del navegador
```

## Lo que este protocolo no hace

No garantiza que una justificación sea *correcta*, solo que no se ha quedado
callada mientras el código cambiaba debajo. Y `bendecir` puede usarse como
trámite: si un commit bendice muchas anclas a la vez, es la señal de que se pasó
por encima sin leer. Esa es la única parte que ninguna prueba puede vigilar.
