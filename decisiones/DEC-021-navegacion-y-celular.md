---
type: decision
status: accepted
date: 2026-11-21
project: tex
tags: [navegacion, celular, accesibilidad]
---

# DEC-021 — Barra de secciones con enlaces y no vistas por pestañas

## Contexto

En un celular de 390 px, la página medía unos 6 300 px con tres bloques. No
había forma de saltar entre los datos, el editor, la estructura y el resultado.
Los avisos de `#app-status` se escribían al final de la página, donde una
persona que no usa lector de pantalla no los ve. Una regla `flex: 1 1 8rem`,
pensada para una fila, se aplicaba en columna y daba a «Editar» y «Añadir
dentro» 128 px de alto por tarjeta.

## Decisión

- **Una barra de enlaces nativos** a cinco destinos con `tabindex="-1"`, igual
  que el enlace de salto. En pantallas estrechas va fija abajo y en las anchas,
  fija arriba. Marca con `aria-current` la sección que cruza un tercio de la
  ventana y muestra el número de bloques.
- **Se rechazó convertir las secciones en pestañas que ocultan el resto.**
  `app.js` mueve el foco entre secciones en muchos flujos: «Guardar cambios»
  vuelve a «Editar» en la estructura, los enlaces de la comprobación previa
  llevan a «Editar» del bloque, y «Generar documento» sin título vuelve a
  «Título de la nota». Un control oculto no puede recibir el foco, y cada uno de esos
  flujos fallaría en silencio. Desplazarse a un ancla conserva todos esos
  flujos sin tocarlos.
- **En pantallas estrechas, la barra se retira mientras un campo de texto tiene
  el foco.** Con el teclado en pantalla ocuparía casi una cuarta parte del
  espacio que queda. Se usa `:has()`. Sin `:has()`, la barra simplemente
  permanece visible.
- **La fila de «Añadir bloque» es `sticky` en la parte inferior** del editor, y
  la página declara `interactive-widget=resizes-content`. En Android, el
  teclado reduce el viewport de diseño y la fila queda justo encima. Se puede
  añadir sin cerrar el teclado, porque en un teclado táctil no hay Ctrl+Intro.
  iOS ignora esa clave: allí la fila queda detrás del teclado, como antes.
- **Los avisos se muestran también como aviso flotante.** Solo cambian la
  opacidad y la posición; nunca `display` ni `visibility`, para que la región
  siga en el árbol de accesibilidad y los anuncios de lectores de pantalla no
  cambien. No se muestran los anuncios que acompañan a la escritura o a un
  control con estado propio (sugerencias, recuento del tablero, sangría,
  ancho y giro de imagen): serían ruido sobre el texto que se escribe.

## Consecuencias

- La barra va en el DOM tras la cabecera, pero en el celular se dibuja abajo.
  Es la única excepción a que el orden del DOM coincida con el visual.
- Su tamaño vive en `html`, no en `:root`: `tests/check-site.mjs` empareja cada
  token de `:root` con su versión oscura, y una medida no es un color.
- Ninguna prueba automática verifica el teclado virtual, la barra ni el aviso
  flotante (DEC-007). Su revisión está en `docs/revision-manual.md`.
