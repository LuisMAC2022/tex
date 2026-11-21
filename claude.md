<!-- Buzón transitorio. Puede vaciarse en cualquier momento.
     Las reglas permanentes están en PROTOCOLO.md.
     Antes de vaciar: promueve lo durable (invariante → INVARIANTES.md,
     justificación → decisiones/, rasgo del sistema → README.md). -->

En este archivo codex escribira lo que quiera decirle a claude

## P1 — Captura sin fricción

Implementados diffEdit y applyFieldEdit (incluido respaldo y bandera),
Ctrl+Intro/⌘+Intro, protección frente a envío implícito, foco de captura,
acciones antes de la vista previa, ayuda plegable, caché de nodos y
análisis (máximo 1000; sin imágenes) y autoguardado del editor con recuperación
voluntaria y respaldo previo. La barra de sangría tiene una parada de Tab;
las flechas cambian entre sus dos controles. Se revisaron y bendijeron las
anclas de DEC-016 y DEC-019.

Medición: referencia del encargo 200–220 ms con 100 bloques. Se intentó ejecutar
el anexo A con Playwright ya instalado fuera del proyecto. Chromium no arranca:
`socket() failed: Operation not permitted` en process_singleton_posix. No hay
cifra posterior verificable ni afirmación de haber alcanzado ≤60 ms; queda
pendiente ejecutar el anexo en un navegador permitido. No se añadió dependencia.
Las pruebas de lógica, documentación y sintaxis pasan. No se verificó aún el
historial real ni un lector de pantalla; constan en la revisión manual.

## P2 — Autocierre y contexto matemático

Implementados contexto con aperturas incompletas y argumentos textuales,
lista única de entornos, autocierre por beforeinput, cierres a distancia del
final, Retroceso, entornos y preferencia local. Las reglas son puras y prueban
cada caso de la tabla, dobles barras y guion literal de listas. Los eventos de
composición, pegado y teclas muertas no activan reglas. Sin nueva dependencia.
No hay mediciones de teclado real ni NVDA; pendientes en revisión manual.
Se revisan y bendicen las anclas de distancia/captura bajo DEC-016.

## P3 — Sugerencias, huecos y alias

Implementados parseSnippet, sesiones a distancia del final, clasificación pura
con acentos y uso semanal (máximo 300), menú único con listbox y div espejo,
aceptación con teclado o puntero, envoltura matemática en prosa, alias
predeterminados y personales, gestión y configuración JSON validada antes de
confirmar. Tab tiene la prioridad acordada y salida nativa sin trabajo pendiente.
El tablero registra uso sin cambiar su historial de Recientes. Las pruebas de
lógica incluyen catálogo real, Unicode, fragmentos, ranking y configuración.
La integración de plantillas y macros queda para P4/P5; en esta etapa esos
arrays se exportan vacíos. No se añadió dependencia. Falta revisión de NVDA,
teclados físicos y posición visual del menú por la restricción de Chromium.
Revisadas y bendecidas las anclas DEC-015 y de captura DEC-016.

## P4 — Comandos /, Demostración y plantillas

Implementados slash en la tabla única, menú / reutilizando el componente de P3,
títulos tras espacio, change explícito y foco de imagen, proof predefinido, once
plantillas completas, cola relativa a las rutas insertadas, omisión/cancelación,
guardado de ramas y gestión/importación de plantillas personales. Omitir un
padre omite sus descendientes. Cambios estructurales cancelan la cola y lo anuncian.
Cada fórmula incluida se verifica con el KaTeX vendorizado y checkBlock. El
archivo de ejemplo se regeneró y no tiene cambios. Se revisó el comentario y
tramo de DEC-005 para predefined/slash y se bendijo su ancla junto con DEC-018.
No se han comprobado teclados físicos, NVDA ni la clase simulada en navegador;
quedan en la lista manual. Sin dependencias nuevas.
