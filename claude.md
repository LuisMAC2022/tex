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

Comprobación adicional de U4: si el archivo importado ya contiene el identificador propuesto para el respaldo, el respaldo recibe uno distinto y se conservan ambos registros. La validación exige fechas ISO con zona horaria.

### U2 · Comprobación en Chromium

Al abrir el menú de imagen desde un editor desplazable, Chromium podía entregar tarde el aviso de un desplazamiento anterior al toque. El menú ahora compara la posición al abrir con la posición del evento. La prueba del reductor cubre tanto ese aviso pendiente como un movimiento posterior que sí lo cancela. El fondo del menú y los rótulos de los sectores permiten distinguir los controles a 320 px.

En Chromium headless comprobé los cuatro contextos, los dos atajos, el clic derecho, el regreso al campo con la selección original y el deshacer nativo después de envolver una selección. Con puntero táctil emulado comprobé el arrastre inmediato desde la barra, la pulsación larga sobre tarjeta y zona vacía y la cancelación por zona muerta, segundo dedo y desplazamiento. Al cerrar el menú general mientras se edita una imagen, el foco vuelve al campo de archivo visible.

## U5 · Selección por alcance

El botón **Selección** mantiene su lugar entre **Siguiente** y **Símbolos**. Con el modo activo, Siguiente amplía desde la palabra o el símbolo hasta el párrafo, bloque o fórmula. Anterior recupera el rango y la dirección anteriores. La selección trabaja sobre el texto original. El menú puede usarla como numerador y dejar el cursor en el denominador.

Seis pruebas ejercitan la prosa española, fracciones anidadas, raíces con índice, scripts, matrices, delimitadores, comentarios, escapes, texto dentro de fórmulas y grafemas en los extremos del campo. En Chromium con entrada táctil emulada seleccioné una variable con la barra, amplié y reduje la selección y la envolví como fracción. La escritura con Gboard y los anuncios de los niveles con TalkBack quedan en la [revisión manual](docs/revision-manual.md).

## Informe final · U0–U5 · 22 de noviembre de 2026

| Paquete | Entrega |
| --- | --- |
| U0 | Diagnóstico local de escritura, pulsación larga, ventana visual y capacidades. Ambas variantes de ventana registran eventos en el mismo informe JSON. |
| U1 | Barra inferior con seis controles en la versión final. Permite recorrer huecos, moverse por unidades LaTeX, abrir el tablero y guardar el bloque. |
| U2 | Menús de texto, fórmula, imagen y acciones generales. Admiten toque, ratón y teclado. **Ir a…** lleva directamente a Contenido, Estructura, Resultado, Preferencias o Versiones. |
| U3 | Esquema v4 con identidad de documento y de bloque. Mover conserva los ids y duplicar, pegar o aplicar una plantilla crea otros. |
| U4 | Historial estructural de la sesión, versiones persistentes, diferencias por bloque y por línea, respaldo previo a una restauración o importación e intercambio del proyecto en JSON. |
| U5 | Selección progresiva de prosa y matemáticas. Reducir recupera la selección anterior, incluso si se hizo hacia atrás. |

### Decisiones y diferencias con el encargo

- El guardián anterior excluía la tecla Menú sin modificadores. La excepción autorizada se limita a **Contenido**. El guardián sigue comprobando los demás ámbitos. [DEC-022](decisiones/DEC-022-menu-contextual-en-contenido.md)
- El preámbulo añade `hyperref` al final cuando el documento usa un enlace. [DEC-023](decisiones/DEC-023-enlaces-con-hyperref.md)
- La identidad de un bloque se conserva al cambiar de posición. La invariante INV-010 cuenta con una prueba de unicidad en todo el árbol. [DEC-024](decisiones/DEC-024-identidad-de-bloques.md) · [INV-010](INVARIANTES.md#inv-010--los-identificadores-de-bloque-son-únicos-en-todo-el-árbol)
- El proyecto JSON permite trasladar la copia editable con sus versiones. Las versiones manuales, las automáticas y el autoguardado de sesión tienen ciclos de vida distintos. [DEC-025](decisiones/DEC-025-versiones-y-proyecto.md)
- El plegado de los datos según el título ya existía. La confirmación de borrado existente cubría bloques con hijos, por lo que se completó para la acción de imagen. El medio anillo inicial de 84–140 px ofrecía 43,98 px de arco por sector con ocho opciones. Los radios de 86–146 px dan 45,55 px.

### Mediciones y comprobaciones

Posiciones en píxeles CSS desde el inicio del documento con Chromium headless, Pixel 7 emulado a 412 × 839, sin teclado virtual. Se midió el borde superior del campo de contenido. La columna de título plegado usa el mismo título y panel cerrado en ambas ramas.

| Elemento | Base, título vacío | Entrega, título vacío | Base, título plegado | Entrega, título plegado |
| --- | ---: | ---: | ---: | ---: |
| Campo Contenido | 1999 | 1933 | 981 | 1054 |
| Botón Añadir bloque del formulario | 2211 | 2205 | 1193 | 1326 |
| Estructura | 3107 | 2715 | 2089 | 1836 |
| Altura total | 4806 | 5146 | 3788 | 4267 |

En la base, el tablero empezaba en 2684 px con título vacío y en 1666 px con los datos plegados. En la entrega se abre como hoja de hasta el 40 % de la ventana visual. **Símbolos** y **Añadir** están disponibles en la barra fija desde el inicio. La barra empieza en el píxel 790 de la ventana y sus seis botones miden aproximadamente 69 × 48 px a 412 px de ancho. A 320 px la página conserva ese ancho y los ocho sectores de fórmula caben con controles de al menos 44 × 44 px.

- Pasaron las 222 pruebas de `npm test`, con cero omisiones, la revisión estructural y `npm run check:js`. La prueba de `pdflatex` compiló los fragmentos y el enlace. KaTeX y la comprobación previa también los aceptaron.
- Tras regenerar `examples/calculo-3.tex`, su contenido coincide byte a byte con la rama base. El identificador Git del archivo es `50cce790167e2c198075745e7366df76725d2dd3`.
- En escritorio, Chromium headless abrió los cuatro menús a 1366 × 768. Comprobé selección hacia atrás, foco, ambos atajos, clic derecho y Ctrl+Z. En la emulación táctil comprobé el tablero de símbolos, añadir un bloque, arrastre desde la barra, pulsación larga en tarjeta y zona vacía, y cancelación por segundo dedo o desplazamiento.
- En Chromium comprobé guardar, comparar, leer el contenido y el nombre del proyecto exportado, importar, deshacer la importación y volver a encontrar la versión manual tras recargar. En un DOM simulado repetí la restauración y el traslado con IndexedDB y con el respaldo de localStorage.

### Pendiente de verificación

- **Android físico con Chrome y Gboard**. Faltan composición, autocierre y sugerencias reales, tiradores nativos, altura y continuidad del teclado, manejo con una mano, zoom y vibración física. La pulsación larga dentro de Contenido sigue desactivada hasta contar con el [informe del teléfono](user.md#diagnóstico-en-tu-teléfono).
- **TalkBack**, incluidos anuncios de la barra, los menús, la selección y las versiones. También queda pendiente la revisión con lectores de pantalla de escritorio y teclados físicos.
- **Almacenamiento y transferencia entre equipos**. Falta comprobar concesión y revocación de persistencia, expulsión de datos y reapertura tras cerrar Chrome en Android. El Chromium de este entorno canceló la escritura en disco tanto del proyecto como de una descarga de texto de control. Se verificaron el JSON generado, su nombre y su importación. Falta trasladar el archivo descargado entre teléfono y portátil.
- **Overleaf**, Firefox y Safari/WebKit. El Chromium gráfico del sistema abortó durante el arranque por el permiso de su socket. Las verificaciones de navegador descritas arriba se ejecutaron con Chromium headless. El procedimiento de dispositivo, almacenamiento y exportación figura en la [lista de revisión](docs/revision-manual.md#android).

## U3.1 · Etiquetas y referencias cruzadas

La fusión reúne las correcciones de `claude/ui-ux` con U0–U5 de `codex/ui-ux`. Ambas ramas habían usado DEC-022. La decisión sobre exponentes conserva su justificación como DEC-026.

La migración v5 traslada la etiqueta de imagen y deduplica en orden de emisión. El editor propone claves, ofrece destinos desde el teclado y **Referir**, y señala duplicados y referencias rotas. La estructura, el historial y las plantillas conservan las reglas de identidad. Se registraron DEC-027 e INV-011.

Pasaron 232 pruebas y el control estructural. Dos compilaciones con `pdflatex` confirmaron en el `.aux` los ocho destinos de la prueba, incluidas dos figuras. El ejemplo regenerado coincide byte a byte. Chromium headless abrió el sitio por `file://` y comprobó propuesta, tarjeta numerada, autocompletado con Intro y generación. No verificado en Android físico, Gboard, TalkBack, NVDA, Overleaf, Firefox o Safari. Los pasos pendientes figuran en la revisión manual.

## U3.2 · Citas y bibliografía del documento

El panel permite guardar fuentes, citar varias claves y alternar IEEE y APA 7. Los ocho libros de `temario.md` se incorporan con un botón. La conversión de una bibliografía manual conserva las claves y se deshace en un solo paso. Las referencias, el estilo y las etiquetas viajan en las versiones y en el estado v6 del proyecto JSON. La configuración portátil incluye el catálogo del curso. Se registró [DEC-028](decisiones/DEC-028-citas-y-bibliografia.md) y se amplió el guardián de INV-009 para la carga condicional de `natbib`.

Pasaron las 243 pruebas, la comprobación estructural y `npm run check:js`. Se ejecutaron dos pasadas reales de `pdflatex` por estilo. Las ocho claves quedaron resueltas y el orden de los `\bibcite` del archivo auxiliar coincidió con el orden calculado en ambos estilos. El ejemplo regenerado conserva los mismos bytes que en las dos ramas de origen.

En Chromium headless probé el submenú **Citar**, la aceptación de una segunda clave, la validación por campo, el bloqueo de clave citada y el aviso al eliminar. También comprobé la conversión con deshacer y rehacer, la restauración de una versión y la exportación e importación del contenido del proyecto con su configuración.

En un Pixel 7 emulado, Chromium enviaba un clic táctil con `detail: 0` al soltar la barra. Ese clic cerraba el menú recién abierto. Se incorporó el tipo de puntero a la detección y se verificaron por toque la apertura de **Citar**, el submenú y la aceptación de la clave. El arrastre sobre una selección insertó la fórmula una sola vez. Mayús+F10 y Escape conservaron la navegación con teclado y el retorno del foco.

Pendientes de revisión manual en esta ronda: Android físico con Gboard, TalkBack, NVDA, Overleaf, Firefox y Safari/WebKit. Los casos están en la [revisión manual](docs/revision-manual.md#citas-y-bibliografía).

## A1 — Caracterización del editor, la estructura, los menús, la escritura y las versiones

Las pruebas de interfaz pasan de 6 a 25. Los 25 recorridos tardaron 4,4 s en Chromium con contextos nuevos. Comprueban foco, anuncios, gestos, código LaTeX y persistencia a través de la interfaz. Pages ejecuta la suite con Chromium antes de publicar los archivos versionados. `app.js` empezó y terminó con 136 995 bytes (presupuesto de 137 000).

**Precisión autorizada.** Probé los 13 tipos en un Pixel 7 emulado. El botón Menú abrió texto con diez tipos, fórmula con dos e imagen con uno. El cuarto contexto se abrió con Menú general en Estructura. La persona autorizó cubrir esas dos rutas en A1.

Quedan fuera de esta medición Android físico, Gboard, TalkBack y el portapapeles del sistema en el teléfono.

## A2 — Registro de acciones y contexto

Las tarjetas, los controles de escritura, los comandos de los anillos y los atajos consultan los identificadores de `actions.js`. La apertura radial y las operaciones de tarjeta tienen controladores propios. La prueba de coherencia contrasta el catálogo con los manejadores que registra la página. Las 25 pruebas de interfaz de A1 siguen pasando con los mismos casos.

`app.js` pasó de 136 995 a 123 064 bytes. Su presupuesto bajó de 137 000 a 123 500 bytes. Chromium verificó los controles en escritorio y Pixel 7 emulado. La prueba manual con teclados físicos de distintas distribuciones queda pendiente. La ejecución de A1 en GitHub Actions también pasó.

## N1 — Barra del pulgar

La navegación ocupa 144 px (tres teclas de 48) frente a unos 207 px a 412 de ancho. Mi botón deshace y el modo central indica cursor, selección o sugerencias. Se probaron también el arrastre horizontal, la pulsación mantenida y la elección de categoría desde Símbolos. Las cuatro nuevas pruebas táctiles fallaron antes del cambio y pasaron después. A 320 px caben los siete objetivos de al menos 44 px.

Anexo A (Pixel 7, antes y después): altura 6094 → 6094 px, Contenido 2056 → 2056, Estructura 2838 → 2838, Generar 4307 → 4307, tarjetas 276/275/275 → 276/275/275. Los siete anchos finales son 67/48/48/48/67/67/67 px. `app.js` pasó de 123 064 a 117 321 bytes, con presupuesto de 117 500. Pasaron las 280 pruebas locales con Chromium. Los tiradores de Gboard, TalkBack y el alcance con una mano requieren un teléfono físico.
