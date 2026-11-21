---
type: decision
status: accepted
date: 2026-11-21
project: tex
tags: [persistencia]
---

# DEC-019 — Autoguardado separado del borrador explícito

El borrador es un punto de restauración elegido por la persona. Escribir en su
clave al abrir la página lo sobrescribiría con una sesión vacía. El
autoguardado utiliza una clave propia, conserva el bloque a medio escribir y
no guarda sesiones vacías. Antes del primer reemplazo guarda una copia de la
sesión anterior. La recuperación siempre se ofrece, nunca se aplica sola.
