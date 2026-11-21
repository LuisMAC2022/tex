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
