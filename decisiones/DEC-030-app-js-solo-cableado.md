---
type: decision
status: accepted
date: 2026-11-23
project: tex
tags: [arquitectura, app.js, pruebas, mantenimiento]
---

# DEC-030 — `app.js` es cableado y su tamaño solo baja

## Contexto

Veintidós de los veintitrés scripts propios son puros y tienen pruebas.
`app.js` concentra el resto: unas 2 540 líneas y 137 KB en un solo cierre,
con unas 57 variables `let` compartidas. Ocho secciones marcadas [A]–[H] y
otras tantas sin marca se comunican de dos formas:

- **Mutando variables del cierre.** Para saber quién cambia `blocks`, `prefs`
  o `snippetSession` hay que leer el archivo entero.
- **Ranuras de función declaradas antes y asignadas después.**
  `closeAssistMenu`, `setConfigMacros`, `specialCompletions` y
  `acceptSpecialCompletion` son ejemplos: una sección llama a algo que otra
  sección, más abajo, sustituye.

Así, cada funcionalidad nueva se añadía al final y podía romper otra lejana sin
que fallara ninguna prueba. Es la «caja negra» que señaló la persona usuaria.
Las restricciones siguen: scripts clásicos sin módulos (DEC-002), sin paso de
construcción y sin dependencias (INV-006).

## Decisión

1. **`app.js` solo cablea.** Lee el DOM, llama a funciones puras y aplica sus
   resultados. Una regla nueva va a un script propio con pruebas puras. Una
   interacción nueva que sea más que cablear va a un controlador propio. Ese
   controlador es un script clásico que se registra en `TexNotes` y recibe por
   argumento lo que necesita del estado, en vez de leer el cierre de `app.js`.
2. **El presupuesto en bytes de `app.js` solo baja** (INV-012). El commit
   que extrae una sección rebaja el presupuesto al nuevo tamaño. Subirlo exige
   una entrada nueva en `decisiones/` que diga por qué no cabía fuera.
3. La extracción es **gradual**. Antes de mover una sección, una prueba de
   interfaz (DEC-029) fija su comportamiento, para que mover no cambie nada.

## Alternativas rechazadas

- **Módulos ES con un empaquetador.** Rompen `file://` (DEC-002) y añaden un
  paso de construcción y dependencias.
- **Un framework de interfaz.** Es una dependencia de ejecución (INV-006) y
  obligaría a reescribir todo de una vez.
- **Reescribir `app.js` de golpe.** Sin pruebas de interfaz previas no hay
  forma de saber qué se rompió. Por eso la extracción va después de DEC-029.

## Consecuencias

- Una corrección pequeña que añade líneas a `app.js` tiene que compensarlas
  extrayendo algo. Esa fricción es intencionada.
- El orden de la extracción y la forma de los controladores están en el
  encargo vigente de `agents.md`. Lo que se consolide se describe en
  `docs/guia-de-desarrollo.md`.
