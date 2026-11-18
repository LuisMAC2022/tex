---
type: decision
status: accepted
date: 2026-11-18
project: tex
tags: [bloques, accesibilidad]
commit: HEAD
---

# DEC-014 — Elegir el padre y la posición de un bloque

«Mover a…» abre un diálogo modal nativo para usar la navegación, el cierre con
Escape y la vuelta de foco del navegador. El diálogo parte del padre actual y
ofrece insertar al principio o al final. Elegir explícitamente otro padre
permite confirmar el cambio de nivel.

Las rutas posicionales pueden cambiar tanto por la retirada como por la
inserción de una rama. Al confirmar, se cancela la edición en curso y el
destino de alta vuelve a la raíz para evitar que el formulario apunte a otro
bloque por coincidencia de ruta. El foco en «Editar» identifica la ubicación
final de la rama movida.
