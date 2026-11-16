---
type: decision
status: accepted
date: 2026-09-14
project: tex
tags: [contrato, latex, escapado]
commit: b28949c
---

# DEC-004 — El contenido de un bloque no se escapa; los metadatos y títulos sí

## Contexto

La versión anterior escapaba la prosa y respetaba solo los tramos entre `$…$`.
Con esa regla, un `\begin{align}` pegado desde otro documento salía con sus `&`
escapados (`a \&= b`) y dejaba de compilar.

## Decisión

`contentToLatex()` no inserta **ni un solo** carácter de escape: ni en prosa, ni
en los entornos tipo teorema, ni en los elementos de lista, ni en los bloques
matemáticos. `escapeMetadata()` escapa por completo `#`, `$`, `%`, `&`, `_`,
`{`, `}`, `~`, `^` y `\`. Son dos funciones distintas con nombres distintos.

## Razones

- El contenido de un bloque **es LaTeX**, no prosa mecanografiada. La propia
  aplicación lo invita: el tablero de símbolos inserta `\forall` y `\mathbb{R}`
  en ese mismo campo.
- Escapar «solo algunos» reservados rompe justo lo que se invita a escribir.
  Media transparencia es peor que ninguna: falla precisamente en el caso que
  promete resolver.
- Los metadatos son distintos porque la aplicación los interpola dentro de un
  argumento que ella misma genera —`\title{}`, `\section{}`,
  `\begin{theorem}[…]`—, donde un reservado rompe el argumento y quien escribe
  no tiene forma de repararlo desde la interfaz.
- El coste es aceptable porque Overleaf es la copia maestra (DEC-001): el error
  se ve y se corrige donde ya se trabaja.

## Consecuencias

- Lo vigilan INV-002 e INV-003, en las dos direcciones.
- Los reservados son responsabilidad de quien escribe. El único caso que falla
  en silencio es `%`, que comenta el resto de su línea; los demás fallan de
  forma ruidosa al compilar.
- **Ni la documentación ni las pruebas ni la ayuda de la interfaz pueden volver
  a afirmar que el contenido se escapa.** `tests/check-site.mjs` lo comprueba
  sobre los textos de ayuda.
