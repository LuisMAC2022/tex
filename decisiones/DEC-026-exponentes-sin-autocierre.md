---
type: decision
status: accepted
date: 2026-11-23
project: tex
tags: [edicion, teclado, autocierre]
---

# DEC-026 — `^` y `_` no abren llaves si no hay selección

Precisa la regla de autocierre de P2 sin reemplazar ninguna decisión.

## Contexto

El autocierre convertía `^` en `^{}` con el cursor dentro, y lo mismo con `_`.
La llave solo se cerraba con Tab o tecleando `}`. Escribir de corrido, como en
cualquier editor de LaTeX, daba resultados equivocados sin aviso:

| Se tecleaba | Se obtenía |
| --- | --- |
| `x^2 + y^2 = r^2` | `x^{2 + y^{2 = r^{2}}}` |
| `Sea $x_1 + x_2$ con` | `Sea $x_{1 + x_{2$ con}}$`, que no compila |

Las pruebas puras comprobaban la regla tal como estaba especificada, no la
escritura real. Se detectó al teclear en Chromium con Playwright.

## Decisión

Sin selección, `^` y `_` se escriben tal cual. Quien necesite un grupo escribe
`{`, que sí se autocierra, o acepta un fragmento con huecos. Con texto
seleccionado en matemáticas, `^` y `_` lo envuelven como exponente o subíndice,
igual que las llaves envuelven la selección.

Desaparece la regla que se tragaba la `{` explícita tecleada tras un `^{`
automático, porque ese par ya no existe. Mantenerla habría hecho que `x^{{a}}`
perdiera una llave.

## Alternativas descartadas

- **Cerrar el grupo tras un solo símbolo**, como algunos editores visuales.
  Exige decidir qué es un símbolo (`2`, `\alpha`, `10`) y falla igual con
  `x^10`. Se puede reconsiderar con datos de uso.
- **Cerrar el grupo al teclear un espacio u operador.** Rompe `e^{-x^2}` y
  `x^{n+1}`, donde el operador va dentro del grupo.
