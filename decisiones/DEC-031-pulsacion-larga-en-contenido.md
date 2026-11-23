---
type: decision
status: accepted
date: 2026-11-23
project: tex
tags: [android, gestos, menús radiales]
---

# DEC-031 — La pulsación larga dentro de «Contenido» se queda para Android

## Contexto

U2 dejó `LONG_PRESS_IN_FIELD = false` a la espera del diagnóstico del
teléfono. El 2026-11-23 la persona comprobó en su Android con Gboard que las
sugerencias de `\`, los menús radiales y la barra sobre el teclado funcionan.
Después decidió no completar la prueba de pulsación larga y dejarlo como
estaba.

## Decisión

Dentro de «Contenido», la pulsación larga sigue siendo del sistema: selecciona
palabras y muestra los tiradores y el menú de copiar y pegar. El menú radial se
abre ahí de tres formas:

- con el botón «Menú» de la barra, tocando o arrastrando;
- con la tecla Menú;
- con Mayús+F10.

## Razones

- Interceptarla quita la selección nativa de Android, que sirve para copiar y
  corregir texto.
- El botón «Menú» abre el mismo menú sin esperar 400 ms y ya queda bajo el
  pulgar.
- La persona prefirió conservar el comportamiento actual.

## Consecuencias

- `LONG_PRESS_IN_FIELD` queda en `false`. Activarlo exige una decisión nueva
  apoyada en la prueba 2 de `diagnostico/android.html`.
- La pulsación larga sigue abriendo menús en las tarjetas y en las zonas vacías.
