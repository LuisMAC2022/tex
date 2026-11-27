---
type: decision
status: accepted
date: 2026-11-21
project: tex
tags: [edicion, latex, persistencia]
---

# DEC-017 — Alias y macros, las dos cosas

Los alias son personales, viven en el navegador y se expanden al teclear: el
.tex nunca depende de ellos. Las macros son del documento y viajan en el
borrador v3 y en el preámbulo. Se usa newcommand porque falla de forma visible
si existe un nombre; providecommand fallaría en silencio. La exportación de
configuración permite trasladar preferencias personales entre computadoras.
