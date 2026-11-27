---
type: decision
status: accepted
date: 2026-11-22
project: tex
tags: [persistencia, historial, proyecto]
---

# DEC-025 — Versiones del documento y proyecto portátil

[DEC-021](DEC-021-aplicacion-copia-maestra.md) sitúa el documento en la aplicación. Para recuperar un estado elegido y trasladarlo entre dispositivos se guardan versiones y se exporta un proyecto JSON. El código LaTeX sigue siendo una salida de ida según [DEC-003](DEC-003-sin-reimportacion.md). El autoguardado de [DEC-019](DEC-019-autoguardado-separado.md) conserva además el formulario en curso para recuperarlo después de cerrar.

El historial estructural en memoria cubre cien pasos. Las versiones manuales permanecen hasta su eliminación. IndexedDB limita las automáticas a treinta por documento y el respaldo en localStorage a ocho por su menor capacidad. Los registros previos a una importación se pueden restaurar aunque el archivo importado tenga otra identidad. La clave de borrador histórica se retira después de confirmar la transacción de migración.
