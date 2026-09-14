---
type: decision
status: accepted
date: 2026-09-14
project: tex
tags: [documentacion, capas, guias]
commit: c2718b7
---

# DEC-008 — Seis documentos, seis vidas medias, y una regla para mantenerlos

## Contexto

El repositorio tenía un README de 288 líneas para 1 400 de aplicación, con un
churn (450 añadidas, 164 borradas) del orden del de `app.js`. Dentro convivían
cuatro cosas con vidas medias distintas: el contrato del `.tex`, que se
sobrescribe; las justificaciones, que no deberían reescribirse nunca; una lista
de revisión de 28 casillas, que crece de forma monótona; y un inventario de
pruebas en prosa que ya mentía, porque narraba que `content-literal.test.js`
sustituye a `mixed-math.test.js`, un archivo que hoy no existe.

Al añadirse las capas de diseño (DEC-001…DEC-007) y las dos guías, el árbol pasó
a tener seis documentos de propósito distinto. Sin una regla escrita, «actualizar
la documentación» vuelve a significar «escribir en el README».

## Decisión

Cada documento tiene un propósito y una forma de cambiar, y no se mezclan:

| Documento | Contiene | Cómo cambia |
| --- | --- | --- |
| `INVARIANTES.md` | reglas con guardián real | se lee siempre; sin guardián no entra |
| `decisiones/` | el porqué | **solo se añade**; para invalidar, `superseded` |
| bloques `@decision` | el porqué de un tramo | anclados; derivan y rompen `npm test` |
| `README.md` | el estado actual del sistema | se sobrescribe |
| `docs/guia-de-uso.md` | cómo se usa | se sobrescribe |
| `docs/guia-de-desarrollo.md` | cómo se extiende | se sobrescribe |

Más dos derivados que **no se editan**, se regeneran: `docs/pruebas.md`
(`npm run inventario`) y `examples/calculo-3.tex` (`npm run build:example`).
`docs/hitos.md` y `docs/revision-manual.md` son listas: la primera no cambia, la
segunda solo crece.

Y la regla de actualización, que es lo que esta entrada añade de nuevo: **al
cambiar algo, se actualiza en el mismo commit lo que esa fila nombra.**

| Si cambias… | …actualizas también | Lo exige |
| --- | --- | --- |
| un rótulo o un texto de ayuda | `docs/guia-de-uso.md` | `tests/documentacion.test.js` |
| la tabla de tipos de bloque | ambas guías, el `tramo` del ancla y `npm run build:example` | anclas + ejemplo byte a byte |
| el formato del `.tex` | `README.md` y `npm run build:example` | ejemplo byte a byte |
| una prueba | `npm run inventario` | `tests/documentacion.test.js` |
| el porqué de algo | `decisiones/` o su bloque `@decision` — **nunca** una guía | nadie |

## Razones

- **Dos documentos con vidas medias distintas no deben compartir archivo.** El
  que más crece termina enterrando al que más se lee, y el lector paga el coste
  cada vez.
- **La pregunta que decide el destino no es «¿esto es importante?»** —eso es un
  juicio y se responde distinto cada vez— **sino «¿puedo escribir una prueba que
  falle si se viola?»**. Es mecánica, y por eso sobrevive al desgaste.
- **Tres de las cinco filas de la regla las hace cumplir una prueba.** Eso es lo
  que la distingue de una convención: no depende de acordarse. Las otras dos
  están escritas precisamente porque son las que dependen de mirar.
- **Las guías no llevan justificaciones.** Una justificación en un documento que
  se sobrescribe se pierde en la siguiente reescritura, y es lo único que no se
  puede recuperar leyendo el código.

## Consecuencias

- El README pasa de 324 a 248 líneas y describe el estado, no la historia ni el
  porqué. Es proporcional al sistema, sin necesidad de un tope de líneas.
- Añadir un documento nuevo obliga a decidir su vida media y su forma de cambiar,
  o no entra en esta tabla.
- La fila que ninguna prueba vigila —«el porqué de algo»— es la que más fácil se
  incumple, escribiendo la explicación en la guía porque es donde se estaba
  mirando. Si ocurre, la señal es una guía que empieza a contener frases del tipo
  «se hizo así porque…».
- `docs/guia-de-uso.md` fija una convención comprobable: `«…»` es siempre un
  rótulo copiado de la pantalla. La guía de desarrollo la hereda. Abandonarla
  rompe `npm test`, incluso si se sustituye por algo que parece equivalente.
