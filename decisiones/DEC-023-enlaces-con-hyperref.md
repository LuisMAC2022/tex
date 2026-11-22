---
type: decision
status: accepted
date: 2026-11-22
project: tex
tags: [latex, enlaces]
---

# DEC-023 — Enlaces con hyperref bajo demanda

El menú de texto inserta `\href` y el documento también admite `\url`. Cargar `hyperref` al final con `hidelinks` conserva el preámbulo y el archivo de referencia de los documentos sin enlaces. La detección recorre los contenidos y sus hijos, respeta comentarios y escapes y omite las rutas de imagen. El guardián de [INV-009](../INVARIANTES.md) comprueba ambas listas de paquetes en `tests/generator.test.js`.
