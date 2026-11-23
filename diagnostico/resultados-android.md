# Resultados de Android

## Observaciones de la persona · 2026-11-23

Chrome con Gboard, en la aplicación principal (`index.html`):

- Las sugerencias de `\` se abren y funcionan al escribir con Gboard.
- Los menús radiales funcionan.
- La barra del pulgar queda por encima del teclado.

La página `diagnostico/android.html` es un registrador de eventos y no tiene esas
funciones; que no aparezcan ahí es lo esperado.

## Pendiente

El informe JSON de la página de diagnóstico. Solo hace falta para decidir si la
pulsación larga dentro de «Contenido» abre el menú radial (prueba 2). Sin él, sigue
desactivada y el botón «Menú» de la barra hace lo mismo.
