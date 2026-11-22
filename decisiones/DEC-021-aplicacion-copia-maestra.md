---
type: decision
status: accepted
date: 2026-11-22
project: tex
tags: [alcance, persistencia, overleaf, versiones, android]
---

# DEC-021 — La aplicación es la copia maestra; Overleaf solo compila

Reemplaza a [DEC-001](DEC-001-overleaf-copia-maestra.md).

## Contexto

DEC-001 fijó Overleaf como copia maestra cuando la aplicación era un frente de
captura de ida. Desde entonces la aplicación pasó a ser una **herramienta
personal muy adaptada**: macros del documento, alias, plantillas, autocierre,
comprobación previa y, en adelante, menús contextuales para el teléfono. Nada de
eso existe en Overleaf. Con Overleaf como copia maestra, toda corrección hecha
allí se pierde en la siguiente exportación y obliga a elegir entre corregir en
un sitio o seguir escribiendo con las herramientas propias en el otro.

El dispositivo principal pasa a ser un teléfono Android. La aplicación no
compite con Overleaf: no compila LaTeX ni ofrece colaboración.

## Decisión

El documento vive en la aplicación. El `.tex` es un **producto derivado**: se
regenera cada vez que hace falta y no se edita a mano. Overleaf, o cualquier
instalación de LaTeX, solo compila. Si la compilación falla, el error se
localiza en Overleaf, pero **se corrige en la aplicación**.

## Consecuencias

- Antes de confiarle el documento, la aplicación necesita **versiones** y un
  **archivo de proyecto** que se pueda exportar e importar. Hasta que existan,
  el borrador de `localStorage` sigue siendo frágil: Android puede desalojar el
  almacenamiento no persistente y el teléfono puede perderse.
- **DEC-003 sigue vigente, por otra razón.** No hay reimportación desde el
  `.tex` porque el `.tex` es derivado, no porque el documento viva fuera. La ida
  y vuelta, cuando exista, se hace con el archivo de proyecto propio en JSON,
  nunca con el `.tex`. INV-001 se conserva sin cambios.
- **DEC-004 sigue vigente, pero su coste sube.** Su justificación decía que el
  error se ve y se corrige en Overleaf. Ahora se ve allí y se corrige aquí, así
  que la comprobación previa gana peso. Una mejora natural, cuando los bloques
  tengan identificadores estables, es pasar de «línea N del `.tex`» al bloque
  que la produjo.
- Se levanta la exclusión de «historial de versiones» del README. La
  **sincronización entre dispositivos sigue fuera**: el traslado entre teléfono
  y portátil se hace con el archivo de proyecto. No se añade servidor
  (INV-006).
- Overleaf deja de ser el lugar de las correcciones, no el de la compilación:
  la exportación, la comprobación previa y el archivo de referencia
  (`examples/calculo-3.tex`) mantienen su contrato.

## Alternativas descartadas

- **Mantener DEC-001.** Pierde la adaptación personal en cada corrección hecha
  en Overleaf.
- **Reimportar el `.tex` para conciliar correcciones.** Ya se intentó y se
  retiró (DEC-003). Un `.tex` corregido a mano no se puede reconstruir sin
  pérdidas en bloques, macros y opciones.
- **Sincronización con un servidor.** Infraestructura y mantenimiento para una
  sola persona, y contradice INV-006.
- **Git dentro del navegador.** Sería una dependencia grande para obtener lo que
  un historial de versiones local y un archivo exportable ya cubren.
