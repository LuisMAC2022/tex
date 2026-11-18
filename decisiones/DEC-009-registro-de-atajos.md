---
type: decision
status: accepted
date: 2026-11-18
project: tex
tags: [teclado, accesibilidad]
commit: HEAD
---

# DEC-009 — Atajos de teclado con un registro y sus reglas

El registro común mantiene sincronizadas las combinaciones, la ayuda del
formulario y los nombres para tecnologías de asistencia. La comparación usa
el código físico de la tecla para admitir eventos con caracteres compuestos
por Opción. Cada combinación tiene un ámbito y una acción visible.

Ctrl+Alt se reserva para AltGr en teclados españoles. Tab conserva la
navegación nativa y las combinaciones del navegador quedan disponibles. Las
teclas sin modificador se reservan para navegación dentro de un widget.
