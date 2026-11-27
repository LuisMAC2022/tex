---
type: decision
status: accepted
date: 2026-11-27
project: tex
tags: [estructura, numeración, latex]
commit: ':/Añade el modelo de encabezados por profundidad'
---

# DEC-035 — La profundidad del texto determina su encabezado

LaTeX lleva contadores planos. El nombre del comando indica el nivel de
anidamiento. El generador emitía siempre `\subsection` para los bloques de
Texto con título, de modo que se perdía la jerarquía al exportar.

El árbol determina el nivel sin pedir a quien escribe que lo elija por
separado. El tema ocupa el primer nivel cuando está presente y cada Texto
con título abre un nivel para sus hijos. El generador y la interfaz deberán
leer los niveles y los números de `outlineEntries()` para que mover un bloque
produzca la misma numeración en la aplicación y en el PDF.
