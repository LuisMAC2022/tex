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

## P5 — Macros del documento

Implementados macros del estado, saneado estructural del borrador v3,
migraciones v1/v2 con lista vacía y rechazo v4, preámbulo newcommand literal,
validación pura, interfaz y errores por campo, vista previa, predeterminadas y
configuración. Se conserva la clave histórica draft:v2 con sobre v3: la app
anterior lo rechaza en vez de perder macros. KaTeX recibe un objeto nuevo por
llamada; las definiciones explícitas consumen también argumentos que el cuerpo
no usa. Cambiar macros invalida vistas y avisos. Se implementa y prueba toda la
lista katex-only contra la copia local de KaTeX, con avisos aparte para empty/th.
El ejemplo sin macros se regenera sin cambios. La aserción de versión actual
de la prueba de listas se actualiza a DRAFT_VERSION; no cambia ningún guardián
literal. Revisada y bendecida el ancla DEC-017. Falta compilar manualmente en
Overleaf; el navegador y los teclados físicos siguen sin verificación.

## P6 — Interfaz

Implementadas dos columnas desde 75 rem, main hasta 110 rem, editor sticky con
altura máxima y desplazamiento propio, metadatos plegables con resumen,
tarjetas compactas y more en las extensiones, apertura del destino antes de
reenfocar y lista fija de teclas de edición. Se mantienen los límites del
tablero y los tokens de ambos temas. Las pruebas estructurales y de sintaxis
pasan y la lista manual recoge toda la revisión solicitada.

Límite de verificación: además del error de sockets al lanzar Chromium con
Playwright, el navegador compartido rechazó abrir el archivo local porque su
política no permite file://. No se intentaron vías alternativas al bloqueo.
No se afirma revisión visual, de NVDA, Windows, Overleaf ni el objetivo de
rendimiento de 60 ms. Estas comprobaciones quedan pendientes de un entorno
que las permita; no se añadieron dependencias al proyecto.

### P3 — Revisión de integración

Se añadió la regla pura pairsAfterReplacement: completar un entorno puede
consumir la llave automática de begin. Esa llave se descarta, mientras se
conservan los pares exteriores; de otro modo podría confundirse con la última
llave del nuevo cierre de entorno. Caso anidado cubierto por prueba. Suite e
inventario actualizados; no cambia el contenido generado ni los guardianes.

### P4 — Revisión de integración

La carga de un paso ahora entrega también su formato de lista al gancho de
lectura: una plantilla capturada de un borrador antiguo conserva flat hasta
editar el contenido. Se prueba captura → fragmento → conservación/cambio de
formato. Los demás ganchos, incluidas opciones de imagen, siguen compartidos.
Suite, documentación e inventario actualizados.

### P1 — Revisión de integración

Se precisó la detección de sesión vacía: el título de la nota también cuenta
como trabajo; curso/profesor/fecha precargados siguen sin contar. La prueba
cubre ambos títulos y el bloque sin incorporar. Una fecha de autoguardado
corrupta se presenta en español como fecha desconocida. No cambia la clave del
borrador ni el respaldo. Suite e inventario verificados.

## U0 · Diagnóstico Android

Añadí la página autónoma y el informe copiable, con cuatro pruebas y dos variantes de ventana. Los guardianes de recursos locales y rutas relativas revisan también el diagnóstico. No verificado en Android real: composición de Gboard, selección nativa, posición sobre el teclado y permisos del dispositivo. El procedimiento y el destino del informe están en `user.md`.

`npm test`: 198 pruebas y la comprobación estructural pasaron. El Chromium local abortó al crear su socket de instancia (`Operation not permitted`), antes de abrir la página. No obtuve medidas de pantalla.

## U1 · Barra de escritura

Añadí la barra al alcance del pulgar, navegación por huecos y unidades LaTeX, la hoja del tablero y posición según la ventana visual. El plegado según el título ya existía y se reutiliza. Amplié los objetivos táctiles. Las pruebas ejercitan acentos combinados, emoji, comandos, comentarios y recorridos tras editar dos huecos. No verificados la geometría con Gboard, el foco en TalkBack ni las posiciones en píxeles de Chromium; constan en la revisión manual.

`npm test`: 200 pruebas pasaron y `check:js` validó los scripts. El blob de `examples/calculo-3.tex` coincide con el de la rama base (`50cce790`).

## U2 · Duda que requiere decisión

U0 y U1 están completos. Antes de implementar los menús, contrasté las dos entradas de teclado solicitadas en U2 con [DEC-009](decisiones/DEC-009-registro-de-atajos.md) y su [prueba de atajos](tests/shortcuts.test.js). El encargo pide registrar Menú y Mayús+F10 en `shortcuts.js`. Para una tecla sin modificadores, el guardián admite Escape, flechas y Re Pág/Av Pág dentro de un widget. `ContextMenu` queda excluida incluso si solo se escucha en «Contenido».

Lo reproduje en una copia temporal añadiendo únicamente `{ id: "radial.menu", code: "ContextMenu", scope: "content-widget" }` al registro. La prueba «los atajos respetan AltGr, las teclas de los widgets y las combinaciones del navegador» falla en la aserción que enumera las teclas permitidas. Las otras cuatro pruebas del archivo pasan. Mayús+F10 por sí sola sí cabe en el registro actual.

¿Se autoriza una excepción de DEC-009 para `ContextMenu` exclusivamente con foco en «Contenido»? La prueba podría exigir ese ámbito y mantener las restricciones en todos los demás. Se aplicó la regla 0.4 de `agents.md`: U2 quedó en pausa y U3–U5 pendientes por el orden de los paquetes.

No se ejecutaron pruebas de los menús ni compilación de sus fragmentos con KaTeX, `pdflatex` u Overleaf. La comprobación en Android, Gboard y TalkBack continúa en la [revisión manual](docs/revision-manual.md).

### Resolución de la duda de U2

El 22 de noviembre de 2026 la persona usuaria autorizó la excepción para la tecla Menú solo con foco en Contenido. Se registró en [DEC-022](decisiones/DEC-022-menu-contextual-en-contenido.md) y en el guardián de atajos. Se reanuda U2.

## U2 · Menús contextuales

Implementé cuatro menús, los dos anillos, la navegación por toque, arrastre y teclado, la preferencia de vibración y el comando adicional **Ir a…**. Se usan los catálogos de bloques y símbolos. [DEC-022](decisiones/DEC-022-menu-contextual-en-contenido.md) fija el ámbito de Menú y [DEC-023](decisiones/DEC-023-enlaces-con-hyperref.md) registra `hyperref` bajo demanda. Ajusté los radios del semicírculo a 86–146 px: con ocho sectores el arco medio supera 44 px. La confirmación existente de eliminación solo aparecía con hijos; el menú de una imagen también pide confirmación antes de invocar la eliminación de esa hoja.

Pasaron 208 pruebas, incluida la compilación real de los fragmentos y el enlace con `pdflatex -no-shell-escape`. Se prepararon el formato, babel español y las fuentes en el entorno temporal. KaTeX y `checkBlock` pasaron. El `.tex` regenerado coincide byte a byte. En un DOM simulado comprobé los cuatro contextos, el foco inicial, la fracción sobre una selección y el menú desde la tarjeta. No verificados en un navegador gráfico el dibujo y los gestos: Chromium abortó al crear su socket. Android, TalkBack y Overleaf quedan en la revisión manual.

## U3 · Identificadores estables

El sobre v4 conserva `documentId` y un id por bloque. Las copias, los pegados y los pasos de plantilla crean identidades nuevas. Los movimientos y las ediciones conservan las existentes, y el editor vuelve a localizar por id el bloque que debe recibir el foco. [DEC-024](decisiones/DEC-024-identidad-de-bloques.md) y [INV-010](INVARIANTES.md) registran la regla y su guardián. Las pruebas de formatos anteriores comprueban por separado el esquema resultante y la versión de origen en `migratedFrom`.

Pasaron 211 pruebas, incluida la compilación con `pdflatex`, y el ejemplo con ids generó exactamente el `.tex` de referencia. No verificado el recorrido del foco con TalkBack; está en la revisión manual.

## U4 · Historial, versiones y proyecto

Implementé deshacer y rehacer hasta cien cambios estructurales, versiones manuales y de exportación, respaldos previos a restaurar o importar, comparación por id y por líneas, y el traslado en JSON con configuración opcional. Las escrituras en IndexedDB se confirman en una transacción. El respaldo en localStorage conserva ocho automáticas y se incorpora a IndexedDB cuando vuelve a estar disponible. Las manuales se conservan en ambos almacenes. La migración del antiguo borrador es idempotente. Se documentó [DEC-025](decisiones/DEC-025-versiones-y-proyecto.md).

Pasaron 216 pruebas, incluida la compilación. En un DOM simulado recorrí ambos adaptadores desde los controles: duplicar, deshacer/rehacer, guardar, generar dos veces, comparar, restaurar, exportar, importar y volver al documento anterior. No verificadas la concesión real de persistencia, la expulsión de datos ni la reapertura en Chrome Android. Estos puntos y el traslado entre equipos están en la revisión manual.
