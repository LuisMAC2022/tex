---
type: decision
status: accepted
date: 2026-11-21
project: tex
tags: [teclado, accesibilidad]
---

# DEC-015 — Tab en Contenido solo cuando hay algo que completar

Amplía DEC-009 sin reemplazarla. En un textarea Tab no tiene otro uso de edición
y es la tecla habitual de fragmentos. Si no hay sugerencia, hueco, cierre o
alias pendiente, Tab conserva la navegación nativa. Escape termina los huecos
sin mover el cursor; no hay trampa de teclado (WCAG 2.1.2). Los alias
predeterminados evitan palabras cortas del español para que salir del campo no
expanda “en”. Los caracteres se leen en beforeinput, sin confundir AltGr con
un atajo de modificadores ni interferir con composición o teclas muertas.
