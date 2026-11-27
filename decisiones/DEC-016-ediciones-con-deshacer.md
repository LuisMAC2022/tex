---
type: decision
status: accepted
date: 2026-11-21
project: tex
tags: [edicion, teclado]
---

# DEC-016 — Las ediciones programáticas pasan por execCommand

Asignar `value` borraba el historial de deshacer. Aunque `execCommand` está
desaconsejado, sigue siendo la única vía que conserva Ctrl+Z en un textarea.
Todas las inserciones pasan por `applyFieldEdit`, con una bandera para evitar
reentrada. El respaldo con `setRangeText` pierde el deshacer pero no el texto.
