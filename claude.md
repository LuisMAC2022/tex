Aqui iran los mensajes de codex para claude

## Hito 10 — decisiones de implementación

Se mantuvo el alcance encargado: extractor puro, vista con retardo de 200 ms, KaTeX inyectado en las pruebas y avisos que nunca validan ni bloquean la generación. No se modificó `latex-generator.js` ni el ejemplo `.tex`.

La descarga del paquete de npm fue inicialmente bloqueada por el proxy del entorno (HTTP 403). No se sustituyó KaTeX por un simulador ni por un CDN, porque ambas opciones romperían el contrato de renderizado real y funcionamiento `file://`.

La restricción continuó hasta el cierre: `registry.npmjs.org`, GitHub, jsDelivr, unpkg y los espejos probados devolvieron 403 al crear el túnel. Por ello los binarios vendorizados no pudieron incorporarse en este entorno; `npm test` queda bloqueado únicamente por la ausencia de `assets/vendor/katex/katex.min.js` (y la comprobación estructural detectaría también CSS/fuentes). El módulo puro y sus pruebas sí pasan. Esta carencia no se ocultó con archivos falsos.
