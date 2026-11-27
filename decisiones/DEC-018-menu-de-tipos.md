---
type: decision
status: accepted
date: 2026-11-21
project: tex
tags: [teclado, edicion]
---

# DEC-018 — Menú / en lugar de atajos por tipo y de paleta

En Windows con dos distribuciones, Alt+Mayús puede cambiar de distribución y
Ctrl+Alt es AltGr (DEC-009). La barra / se escribe sin quitar las manos de la
fila central y no depende de la distribución. El menú actúa dentro del campo
vacío y cubre allí el caso de la paleta, que sigue fuera del alcance. El cambio
de tipo emite change explícitamente para actualizar todos los controles.
