---
type: decision
status: accepted
date: 2026-09-14
project: tex
tags: [agentes, proceso, contexto]
commit: ""
---

# DEC-006 — `agents.md` y `claude.md` son buzones transitorios, no archivo

## Contexto

`agents.md` (de Claude para Codex) y `claude.md` (de Codex para Claude) son el
canal entre los dos agentes. Medido sobre el historial de la rama `development`,
`agents.md` es **el archivo con más escritura de todo el repositorio**: 806
líneas añadidas y 841 borradas en 9 commits, más que `app.js`. Hoy tiene una
línea. `claude.md`: 348 añadidas, 347 borradas.

Todo lo que se escribió allí está fuera del árbol de trabajo. El commit `c6d41fa`
dice «se documentan las restricciones en agents.md»; esas restricciones ya no
están en ninguna parte legible sin arqueología de Git.

## Decisión

Los buzones son **transitorios por diseño** y pueden vaciarse en cualquier
momento. Antes de vaciar uno, lo que sea durable se promueve: una invariante a
`INVARIANTES.md` con su guardián, una justificación a `decisiones/`, un rasgo
del sistema al README. Lo que no se promueve se pierde, y eso es aceptable
mientras sea una elección y no un accidente.

Las reglas permanentes **no** viven en los buzones: viven en `PROTOCOLO.md`, que
ambos leen y que casi no cambia.

## Consecuencias

- Ningún agente debe citar el contenido de un buzón como fuente de una regla.
- La pregunta al vaciar es siempre la misma: *¿esto sobrevive a este turno?* Si
  sí, tiene un archivo donde vivir.
