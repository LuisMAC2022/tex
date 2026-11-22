---
type: decision
status: accepted
date: 2026-11-22
project: tex
tags: [teclado, accesibilidad, android]
---

# DEC-022 — Tecla Menú en el campo Contenido

El 22 de noviembre de 2026 la persona usuaria autorizó una excepción puntual a [DEC-009](DEC-009-registro-de-atajos.md). Con el foco en el campo Contenido, la tecla Menú (`ContextMenu`) abre el mismo menú contextual que Mayús+F10. Ambas combinaciones se declaran en el registro común. La excepción permite abrir el menú mediante la convención de plataforma y recorrer sus sectores con teclado.

El manejador pertenece al campo. Los demás controles conservan su menú nativo y las restricciones existentes para teclas sin modificadores. [La prueba del registro](../tests/shortcuts.test.js) limita la excepción al identificador y al ámbito acordados.
