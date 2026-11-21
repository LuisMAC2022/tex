---
type: decision
status: accepted
date: 2026-11-21
project: tex
tags: [latex, tipos]
---

# DEC-020 — Demostración como entorno predefinido

amsthm ya define proof y declarar newtheorem{proof} no compilaría. La marca
predefined excluye el tipo del preámbulo sin crear otro kind. Sigue siendo un
contenedor con apertura y cierre de entorno, y su título opcional reemplaza
al encabezado “Demostración”, como corresponde al contrato de proof.
