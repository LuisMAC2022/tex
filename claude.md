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

| Medida | Al empezar | Al terminar |
| --- | ---: | ---: |
| Pruebas superadas | 252 | 271 |
| Tamaño de `app.js` (bytes) | 136 995 | 136 995 |
| Presupuesto (bytes) | 137 000 | 137 000 |

Las pruebas de interfaz pasan de 6 a 25. Los 25 recorridos tardaron 4,4 s en Chromium con contextos nuevos. Comprueban foco, anuncios, gestos, código LaTeX y persistencia a través de la interfaz. Pages ejecuta la suite con Chromium antes de publicar los archivos versionados. `app.js` empezó y terminó con 136 995 bytes (presupuesto de 137 000).

**Precisión autorizada.** Probé los 13 tipos en un Pixel 7 emulado. El botón Menú abrió texto con diez tipos, fórmula con dos e imagen con uno. El cuarto contexto se abrió con Menú general en Estructura. La persona autorizó cubrir esas dos rutas en A1.

Quedan fuera de esta medición Android físico, Gboard, TalkBack y el portapapeles del sistema en el teléfono.

## A2 — Registro de acciones y contexto

| Medida | Al empezar | Al terminar |
| --- | ---: | ---: |
| Pruebas superadas | 271 | 274 |
| Tamaño de `app.js` (bytes) | 136 995 | 123 064 |
| Presupuesto (bytes) | 137 000 | 123 500 |

Las tarjetas, los controles de escritura, los comandos de los anillos y los atajos consultan los identificadores de `actions.js`. La apertura radial y las operaciones de tarjeta tienen controladores propios. La prueba de coherencia contrasta el catálogo con los manejadores que registra la página. Las 25 pruebas de interfaz de A1 siguen pasando con los mismos casos.

`app.js` pasó de 136 995 a 123 064 bytes. Su presupuesto bajó de 137 000 a 123 500 bytes. Chromium verificó los controles en escritorio y Pixel 7 emulado. La prueba manual con teclados físicos de distintas distribuciones queda pendiente. La ejecución de A1 en GitHub Actions también pasó.

## N1 — Barra del pulgar

| Medida | Al empezar | Al terminar |
| --- | ---: | ---: |
| Pruebas superadas | 274 | 280 |
| Tamaño de `app.js` (bytes) | 123 064 | 117 321 |
| Presupuesto (bytes) | 123 500 | 117 500 |

La navegación ocupa 144 px (tres teclas de 48) frente a unos 207 px a 412 de ancho. Mi botón deshace y el modo central indica cursor, selección o sugerencias. Se probaron también el arrastre horizontal, la pulsación mantenida y la elección de categoría desde Símbolos. Las cuatro nuevas pruebas táctiles fallaron antes del cambio y pasaron después. A 320 px caben los siete objetivos de al menos 44 px.

Anexo A (Pixel 7, antes y después): altura 6094 → 6094 px, Contenido 2056 → 2056, Estructura 2838 → 2838, Generar 4307 → 4307, tarjetas 276/275/275 → 276/275/275. Los siete anchos finales son 67/48/48/48/67/67/67 px. `app.js` pasó de 123 064 a 117 321 bytes, con presupuesto de 117 500. Pasaron las 280 pruebas locales con Chromium. Los tiradores de Gboard, TalkBack y el alcance con una mano requieren un teléfono físico.

## N2 — Tipo de bloque y título

| Medida | Al empezar | Al terminar |
| --- | ---: | ---: |
| Pruebas superadas | 280 | 283 |
| Tamaño de `app.js` (bytes) | 117 321 | 115 109 |
| Presupuesto (bytes) | 117 500 | 115 500 |

En la pantalla táctil, el chip y el submenú Nuevo bloque comparten los siete tipos y Más…. El título o pie vacío se abre desde el chip. El selector nativo mantiene todas las opciones. Las tres pruebas nuevas fallaron antes del cambio. Verifican el borrador, las ayudas, la vista previa, los controles de escritorio, la activación de teclado para el selector y la alternativa cuando falta showPicker.

El campo Contenido subió de 2056 a 1909 px (147 px). Anexo A: altura 6094 → 5947 px, Estructura 2838 → 2690, Generar 4307 → 4159 y tarjetas 276/275/275 px en ambas mediciones. `app.js` pasó de 117 321 a 115 109 bytes; presupuesto 115 500. Pasaron 283 pruebas locales. El selector del sistema y el anuncio del chip en TalkBack quedan para Android físico.

## N3 — Tarjetas y menú del bloque

| Medida | Al empezar | Al terminar |
| --- | ---: | ---: |
| Pruebas superadas | 283 | 287 |
| Tamaño de `app.js` (bytes) | 115 109 | 109 526 |
| Presupuesto (bytes) | 115 500 | 110 500 |

Las tarjetas del anexo A pasaron de 276/275/275 a 110/108/133 px. La ecuación integral medía inicialmente 165 px. Una prueba que reproducía esa altura pasó después de quitar el margen exterior de la fórmula en la tarjeta. La altura de la página bajó de 5947 a 5200 px; Contenido y Estructura quedaron en 1909 y 2690 px. Generar pasó de 4159 a 3412.

El botón ⋯ y la pulsación larga abren ocho acciones de bloque. La prueba táctil comprueba las posiciones, los estados deshabilitados, la bandeja y el foco tras duplicar y eliminar. La pulsación larga conserva lo que se escribe en el editor. [DEC-032](decisiones/DEC-032-menu-de-la-tarjeta.md) registra el cambio. Se actualizó la comprobación estructural de la ayuda plegable. `app.js` pasó de 115 109 a 109 526 bytes, con presupuesto de 110 500. Pasaron las 287 pruebas. Pendientes de comprobación física, el arrastre a una mano y el recorrido con TalkBack.

## N4 — Cuatro paneles en el teléfono

| Medida | Al empezar | Al terminar |
| --- | ---: | ---: |
| Pruebas superadas | 287 | 290 |
| Tamaño de `app.js` (bytes) | 109 526 | 108 898 |
| Presupuesto (bytes) | 110 500 | 109 000 |

Escribir, Estructura, Documento y Más conservan los campos y la posición de desplazamiento. Se probaron los cinco destinos de Ir a…, las teclas de las pestañas, Editar desde una tarjeta y el enlace desde un aviso. La vista matemática recuerda su estado al recargar. Las tres pruebas nuevas fallaron antes de crear los paneles y pasaron después.

En el anexo A la página única medía 5200 px. Las alturas de cada panel son 1520/871/1310/1093 px, respectivamente. Contenido empieza en 759 px de Escribir, frente a 1909. La estructura empieza en 100 px y Generar en 355 px dentro de sus paneles. Las tarjetas mantienen 110/108/133 px. También se comprobó el límite de dos pantallas con cinco bloques. La cabecera bajó de 183 a 33 px. `app.js` pasó de 109 526 a 108 898 bytes; presupuesto 109 000. Pasaron las 290 pruebas. Quedan pendientes del teléfono real el teclado virtual y el recorrido con TalkBack.

Al repetir N4 durante la extracción siguiente se reprodujo una carrera entre tocar el resumen y recargar la página. El control táctil ahora escribe la elección en el mismo clic. Se repitieron las pruebas de los paneles y la suite completa.

## A3 — Configuración portátil por partes

| Medida | Al empezar | Al terminar |
| --- | ---: | ---: |
| Pruebas superadas | 290 | 294 |
| Tamaño de `app.js` (bytes) | 108 898 | 107 901 |
| Presupuesto (bytes) | 109 000 | 108 000 |

El archivo de configuración v2 describe la versión y los datos de cada parte. La prueba compara los valores migrados con un archivo v1 exportado desde la interfaz de la rama de partida. Chromium también verificó una importación parcial, el aviso por una parte desconocida y la descarga posterior. Pasaron las 294 pruebas. `app.js` pasó de 108 898 a 107 901 bytes y su presupuesto bajó a 108 000. El traslado de archivos entre un teléfono físico y un portátil queda para la revisión manual.

## N5 — Menús personales

| Medida | Al empezar | Al terminar |
| --- | ---: | ---: |
| Pruebas superadas | 294 | 300 |
| Tamaño de `app.js` (bytes) | 107 901 | 105 160 |
| Presupuesto (bytes) | 108 000 | 105 500 |

Mis menús permite sustituir un contexto o enlazar un anillo independiente. La prueba táctil crea dos sectores, inserta el fragmento en una ecuación, abre el anillo desde Mi botón y vuelve a importar la configuración en una sesión nueva. Otros recorridos comprueban el intercambio sin arrastrar, la restauración, los submenús enlazados y el aviso de KaTeX. Los dos primeros recorridos fallaron antes de implementar el editor. Las 300 pruebas pasaron con Chromium. Los ocho sectores cumplen 44 px de grosor y de arco en el radio medio. `app.js` pasó de 107 901 a 105 160 bytes. El presupuesto bajó a 105 500. El alcance con una mano, TalkBack y el traslado físico del archivo se mantienen en la revisión manual.

## A5 y N6 — Fuentes de sugerencias y listas táctiles

| Medida | Al empezar | Al terminar |
| --- | ---: | ---: |
| Pruebas superadas | 300 | 306 |
| Tamaño de `app.js` (bytes) | 105 160 | 97 706 |
| Presupuesto (bytes) | 105 500 | 98 000 |

Cada token conserva la fuente que lo reconoce y lo acepta. La lista se encarga de cerrarse y la sesión de barra diagonal se suscribe al cierre. Las tres listas se desplazaron con gestos CDP en Chromium. Una vez terminado el desplazamiento, ◀ y ▶ recorrieron las opciones y ≡ cerró la lista con el foco en Contenido. El selector de destinos medía una sola fila en la prueba inicial. En el teléfono emulado muestra hasta cinco filas y se verificó un traslado después de deslizar con el dedo. Pasaron las 306 pruebas. Se repasaron las anclas DEC-015 y DEC-016 al trasladar el estado de las sugerencias. `app.js` pasó de 105 160 a 97 706 bytes. Su presupuesto bajó a 98 000. La composición y la barra con Gboard en esta rama quedan pendientes de Android físico.

## A4 — Informe local de errores

| Medida | Al empezar | Al terminar |
| --- | ---: | ---: |
| Pruebas superadas | 306 | 310 |
| Tamaño de `app.js` (bytes) | 97 706 | 96 893 |
| Presupuesto (bytes) | 98 000 | 97 000 |

El aviso y el informe recogieron una excepción real y dos promesas rechazadas en Chromium. La prueba copió el informe, comprobó su contenido en el portapapeles, recargó la página y borró las entradas. Las dos pruebas de interfaz fallaron antes de añadir el informe. La prueba de formato conserva los veinte errores más recientes y tres líneas de pila por error. Pasaron las 310 pruebas y la comprobación estructural. `app.js` pasó de 97 706 a 96 893 bytes. El presupuesto bajó a 97 000. El permiso del portapapeles, su alternativa de selección y el aviso con TalkBack quedan para el teléfono físico.

Al revisar N5 con todos los paquetes integrados, una prueba mostró que Mi botón seguía habilitado para una acción de imagen en un bloque de texto. Ahora consulta el contexto del editor. Un anillo enlazado también conserva las acciones de tarjeta deshabilitadas cuando se abre desde otro contexto. Las dos regresiones quedaron cubiertas en la suite de 312 pruebas.

## Cierre de la rama codex/latexst

### Medición del anexo A

Chromium con un Pixel 7 emulado de 412 × 839 px CSS, título Prueba y los tres bloques del anexo. Todas las medidas son píxeles CSS. En N4 las coordenadas se miden desde el inicio del panel correspondiente.

| Medida | Base y A2 | N1 | N2 | N3 | N4 |
| --- | ---: | ---: | ---: | ---: | --- |
| Altura de la página o de sus paneles | 6094 | 6094 | 5947 | 5200 | Escribir 1520, Estructura 871, Documento 1310, Más 1093 |
| Altura de la cabecera | 183 | 183 | 183 | 183 | 33 |
| Inicio del editor | 1502 | 1502 | 1512 | 1512 | 362 en Escribir |
| Inicio del campo Contenido | 2056 | 2056 | 1909 | 1909 | 759 en Escribir |
| Inicio de Estructura | 2838 | 2838 | 2690 | 2690 | 100 en Estructura |
| Generar documento | 4307 | 4307 | 4159 | 3412 | 355 en Documento |
| Versiones | 5062 | 5062 | 4914 | 4168 | 112 en Más |
| Preferencias de escritura | 5643 | 5643 | 5495 | 4749 | 691 en Más |
| Altura de texto, definición y ecuación | 276/275/275 | 276/275/275 | 276/275/275 | 110/108/133 | 110/108/133 |
| Anchos de los botones de la barra | 6 × 69 | 67/48/48/48/67/67/67 | Igual a N1 | Igual a N1 | Igual a N1 en Escribir |

La repetición sobre la rama completa midió 1137 px en Más al incorporar el informe de errores. Las demás medidas de N4 coincidieron. Otro recorrido añadió cinco bloques de una línea y verificó el máximo de dos pantallas en cada panel.

### Comprobaciones de cierre

La suite local pasó de 252 a 312 pruebas. Las 50 pruebas de interfaz tardaron 10,1 s en una ejecución independiente de Chromium. La suite completa incluyó las compilaciones con `pdflatex`, la comprobación estructural y la comparación byte a byte de `examples/calculo-3.tex`. También pasó `npm run check:js`.

El presupuesto de `app.js` pasó de 137 000 a 97 000 bytes. El archivo ocupa 96 893 bytes frente a los 136 995 de la rama de partida. DEC-032 documenta la pulsación larga en tarjetas. INV-013 registra la posición estable de los sectores con guardianes para las tarjetas y para los menús personales.

### Precisiones al contrastar el encargo

En la rama original, el botón Menú de la barra ofrecía tres contextos según el campo. El menú general tenía su propio botón. A1 caracteriza esas dos rutas con autorización de la persona. La línea de base reproducida aquí difiere ligeramente de las cifras de partida en `agents.md`. La tabla emplea las mediciones tomadas con el mismo guion y el mismo navegador en cada etapa. La lista original de Mover bloque era un selector de una fila. El modo táctil presenta hasta cinco filas para que el desplazamiento y la elección de destino se puedan comprobar.

### Pendiente de verificación manual

- En Android físico, abrir Gboard y probar composición, tiradores nativos, selección por alcance, posición de la barra y conservación del teclado al cambiar de panel. Probar el arrastre y la vibración con una mano. La observación de la persona el 23 de noviembre de 2026 corresponde a la rama de partida.
- Con TalkBack, comprobar los nombres y anuncios del chip, los modos, las tarjetas, las cinco pestañas de edición de sectores, el foco entre paneles y el informe de errores. Con un teclado físico y NVDA, recorrer esos mismos controles.
- En Chrome de Android, probar el selector de tipos del sistema, el portapapeles con permiso denegado, la persistencia tras cerrar la aplicación y la transferencia del proyecto y de la configuración a un portátil.
- Verificar los recorridos en Firefox y Safari/WebKit y compilar el documento en Overleaf. Las compilaciones de esta ronda se hicieron con `pdflatex` local.

Los pasos de dispositivo están en la [revisión manual](docs/revision-manual.md).

## Arranque, importación y formato del documento · 24 de noviembre de 2026

### R1 · Publicado y validado en GitHub Actions

Sobre `921422a` se aplicó el parche de arranque, lectura del almacenamiento bloqueado y menú táctil. Se añadió la regresión de almacenamiento y se regeneró el inventario. `app.js` pasó de 95 180 a 95 193 bytes, dentro del presupuesto de 95 300. Pasaron `npm run inventario`, `npm run check:js`, la comprobación estructural independiente y `git diff --check`.

Con `TEX_UI_TESTS=required npm test` se registraron 318 pruebas, 259 aprobadas, 59 fallidas y cero omitidas. Las 55 de interfaz fallaron antes de validar el comportamiento. Al configurar un directorio temporal escribible y el ejecutable local, Chromium abortó al intentar crear un socket. El entorno rechazó la solicitud para ejecutar la suite con ese permiso. Las cuatro de compilación encontraron el binario de pdfLaTeX, pero falta el formato pdflatex.fmt. El gestor de paquetes carece de acceso al bloqueo de dpkg para completar la instalación.

R1 se publicó como `5b12815` en `design/jerarquia-espaciado`, con el mismo árbol que el commit local `e1eda5d`. El flujo [Pruebas](https://github.com/luismac2022/tex/actions/runs/45495230650) terminó en verde con la interfaz obligatoria y la revisión de sintaxis. La compilación con pdfLaTeX sigue pendiente. Para ese mismo commit terminó en verde [pages build and deployment](https://github.com/luismac2022/tex/actions/runs/45495229909) en la rama de diseño. Es el flujo automático de Pages, distinto de `pages.yml`. La consulta pública de la configuración de Pages devolvió 404.

### R2 · Alcance del respaldo de una sesión pendiente

Se autorizó añadir los nuevos scripts a la lista ordenada del guardián de INV-004. La prueba de importación en un navegador limpio espera hoy el mensaje «Proyecto importado con respaldo». El criterio 4 cambia ese comportamiento y pide comprobar que la lista de respaldos queda vacía.

Al contrastar el criterio 1 con el modelo apareció un caso de pérdida de datos. Una sesión cuyo único contenido es el texto del editor satisface `sessionHasContent` en `assets/js/block-tree.js`. Las versiones creadas con `addVersion` pasan por `documentSnapshot` en `assets/js/versions.js`, que excluye el editor. Restaurar ese respaldo produciría un documento vacío. El criterio 2 cubre el editor visible al importar, que puede contener texto distinto del editor de la sesión pendiente. ¿Debe restaurarse el texto pendiente en su editor original o debe recuperarse como un bloque nuevo? La elección cambia el contenido de la versión restaurada.

R2 está detenido en esa decisión. F1, F2, F3 y F4 quedan pendientes. El tamaño de `app.js` sigue en 95 193 bytes.

## Paquete G — referencia y densidad del portátil

Se agruparon los tokens, la disposición y los componentes de la hoja de estilos. Desde 64 rem con puntero fino, el mínimo de los controles pasa de 44 a 36 px, los botones secundarios tienen borde de 1 px y la clase disponible `.tertiary` subraya el texto al pasar el puntero o recibir el foco. El HTML conserva sus clases. `assets/js/app.js` mide 95 193 bytes antes y después.

Mediciones locales en Chromium con «Derivadas parciales» y 25 bloques de texto. Coordenadas en píxeles CSS, desde el origen del documento salvo indicación. Las medidas iniciales son la referencia para A–F.

| A 1366 × 768 | Antes | Después |
| --- | ---: | ---: |
| Altura de página con Revisión cerrada | 6963 | 6835 |
| Borde superior de #block-content | 545,09 | 536,09 |
| Borde superior de #add-block | 810,84 | 801,84 |
| Borde superior de #math-preview-panel al abrir Revisión | 4338,59 | 4278,59 |
| scrollY al abrir Revisión | 3990 | 3926 |
| #app-status tras añadir el último bloque, arriba en el documento | 6795,31 | 6667,31 |
| #app-status, arriba en la ventana | 6608,31 | 6489,31 |
| #app-status, izquierda | 16 | 16 |
| Altura de la primera tarjeta | 139,83 | 137,83 |

| Ancho de ventana | Izquierda de #structure-panel antes / después | Ancho de .block-editor antes / después |
| ---: | ---: | ---: |
| 1280 | 746,25 / 746,25 | 673,25 / 673,25 |
| 1366 | 796,25 / 796,25 | 723,25 / 723,25 |
| 1440 | 49 / 49 | 938,25 / 938,25 |
| 1536 | 49 / 49 | 1006,58 / 1006,58 |
| 1920 | 113 / 113 | 1188,83 / 1188,83 |

Con Revisión cerrada, las cinco anchuras mantienen sus columnas. Frente a la auditoría del 26 de noviembre con 25 bloques, la altura inicial y el desplazamiento inicial difieren en 2 px. La referencia de cinco bloques corresponde a otra muestra.

Se compararon las propiedades de `getComputedStyle` de 133 elementos por ventana, incluidos cabecera, secciones, controles, listas, tablero de símbolos y navegación. La reorganización dio cero diferencias tanto a 1366 × 768 como en Pixel 7 emulado a 412 × 839. Con la densidad aplicada, el teléfono siguió sin diferencias. En escritorio cambiaron los mínimos, los bordes y las dimensiones calculadas a partir de ellos.

Se regeneró el inventario y pasó la comprobación de JavaScript. Las pruebas de interfaz se ejecutaron localmente. Cuatro pruebas de compilación LaTeX fallaron en este entorno porque falta el formato pdflatex.fmt. La prueba estructural independiente pasó. La emulación no verifica un teléfono físico.

## Paquete A — marco de escritura del portátil

Desde 64 rem con puntero fino, la barra fija reúne el título de la nota, el estado de la sesión, los tres modos de escritura y los accesos a Documento y Exportación. El título de la barra refleja el campo editable de Datos. El destino del bloque y el aviso de recuperación se sitúan después del campo Contenido para que el aviso de una sesión pendiente no empuje el campo hacia abajo. Datos, Resultado, Versiones y Preferencias siguen debajo del marco. El aviso de error se sitúa abajo a la izquierda para compartir la ventana con el anuncio de la aplicación.

Mediciones en Chromium con una ventana de 1366 × 768, la nota «Derivadas parciales» y 25 párrafos. La referencia es el cierre del Paquete G (`d15afb8`). Las coordenadas y alturas están en píxeles CSS.

| Medida | Antes | Después |
| --- | ---: | ---: |
| Altura de la cabecera | 67 | 48 |
| Altura de la sección de edición con 25 párrafos | 4282 | 720 |
| Altura total de la página con Revisión cerrada | 6835 | 3158 |
| Borde superior de `#block-content` en la ventana al cargar | 536,09 | 149 |
| Borde superior de `#block-content` en la ventana después del bloque 25 | 358,09 | 149 |
| Bordes superior e inferior de `#app-status` en la ventana después del bloque 25 | 6489,31 / 6545,31 | 704 / 760 |
| Bordes izquierdo y derecho de `#app-status` después del bloque 25 | 16 / 1350 | 1104,39 / 1358 |
| Desplazamiento de la estructura con 300 px de rueda sobre ella | 0 | 300 |
| Desplazamiento de la página con la misma rueda | 300 | 0 |
| Cambio de la coordenada superior del editor con la misma rueda | −300 | 0 |
| Tamaño de `assets/js/app.js` en bytes | 95 193 | 95 193 |

Al recargar con la sesión pendiente, Contenido empieza a 149 px. Se recuperaron los 25 bloques y la barra mostró «Derivadas parciales» y «Sesión recuperada». Se verificaron con Chromium el orden de Tab desde el enlace de salto, el foco y el contorno en el contenido principal, los destinos de Documento y Exportación, la posición de la barra al bajar y la ausencia de superposición entre avisos. El anuncio se oculta a los cuatro segundos y conserva su texto y `aria-live="polite"`. Se compararon coordenadas, visibilidad y ubicación en el DOM de siete elementos en emulación de puntero grueso a 412 y 1366 px.

Pasaron `TEX_UI_TESTS=required npm test` con 319 pruebas y ninguna omitida, la comprobación estructural, `npm run check:js` y `npm run inventario`. Se completaron las cuatro compilaciones de la suite con pdfLaTeX al preparar su formato, el paquete de español y las fuentes en el entorno de pruebas. Las pruebas de interfaz existentes conservan sus aserciones y se amplió la prueba de portátil. El inventario regenerado coincide con el anterior porque la prueba conserva su nombre.

Quedan pendientes las comprobaciones en dispositivos físicos, con lectores de pantalla y con Firefox y Safari.

## Paquete B — orden estable de las columnas del portátil

Desde 64 rem con puntero fino, la estructura queda a la izquierda y el editor
mide como máximo 46 rem. Con Revisión cerrada, el editor se centra en el
espacio libre. Por debajo de 80 rem, Revisión se integra debajo de Contenido
en el desplazamiento del editor. Desde 80 rem, tiene su propia columna cuando
se abre. El botón de estructura plegada permite usar ambas disposiciones.
[DEC-033](decisiones/DEC-033-columnas-estables-en-portatil.md) registra la
retirada del cambio a 88 rem.

Mediciones antes (`1bc9ec6`) y después en Chromium, en píxeles CSS. Para las
cinco anchuras se usó una ventana de 768 px de alto con Revisión cerrada.

| Ancho de ventana | Izquierda de la estructura antes / después | Ancho del editor antes / después |
| ---: | ---: | ---: |
| 1280 | 746,25 / 49 | 673,25 / 736 |
| 1366 | 796,25 / 49 | 723,25 / 736 |
| 1440 | 49 / 49 | 938,25 / 736 |
| 1536 | 49 / 49 | 1006,58 / 736 |
| 1920 | 113 / 113 | 1188,83 / 736 |

Con 25 párrafos y un borrador de 11 líneas a 1366 × 768, abrir Revisión dio
estas coordenadas verticales en la ventana.

| Medida | Antes | Después |
| --- | ---: | ---: |
| Bordes de `#block-content` | 149–394,75 | 149–394,75 |
| Borde superior del panel de Revisión | 513,25 | 53 |
| Bordes de `#math-preview` | 658,25–914,25 | 330–586 |
| Ancho del editor con Revisión abierta | 723,25 | 612 |
| Cambio de `scrollY` al abrir Revisión | 0 | 0 |
| Tamaño de `assets/js/app.js` en bytes | 95 193 | 95 193 |

El marco del Paquete A ya mantenía fijo `scrollY` en esta muestra. La vista
previa quedaba recortada por el panel en la segunda fila. Ahora el campo y la
vista caben enteros a la vez. La rueda sobre la estructura sigue desplazando
su columna 300 px con un cambio de 0 px en el editor y en la página.

Las pruebas existentes se conservaron íntegras. Se añadieron comprobaciones
del orden y ancho con Revisión abierta y cerrada, la visibilidad simultánea
con 25 bloques y la transición entre 1279 y 1280 px con la estructura plegada.
Se comprobó también la vista integrada para imágenes, la recuperación del foco
al cerrar Revisión y la equivalencia de la cuadrícula y sus cajas con puntero
grueso emulado a 412, 1280, 1366, 1440 y 1920 px.

En local pasaron `TEX_UI_TESTS=required npm test` con 322 pruebas aprobadas y
cero omitidas, incluidas las cuatro compilaciones con pdfLaTeX, además de
`npm run check:js`, `npm run inventario` y `git diff --check`.

Quedan pendientes las comprobaciones en dispositivos físicos, con lectores de
pantalla y con Firefox y Safari.

## Paquete C — campo de escritura y acción principal

Desde 64 rem con puntero fino, los controles nativos de tipo y título
comparten una fila de 14 rem y el espacio restante. El destino se muestra
junto a la leyenda del bloque. La bandeja y el progreso de plantilla
conservan sus avisos. La ayuda de listas se pliega junto a la de Contenido.
La fila de acciones queda adherida al borde inferior del área de
desplazamiento del editor cuando el espacio se agota. El botón principal
muestra el atajo del panel de teclado y conserva su nombre accesible. El
tablero de símbolos empieza plegado inmediatamente debajo de las acciones.

Mediciones en Chromium a 1366 × 768, con una sesión vacía y sin desplazamiento
de la página ni del editor. La referencia es el cierre del Paquete B
(`6351abf`). Las coordenadas y dimensiones están en píxeles CSS.

| Medida | Antes | Después |
| --- | ---: | ---: |
| Borde superior de `#block-content` al cargar | 149 | 139 |
| Bordes superior e inferior de `#add-block` al cargar | 443,75–495,75 | 404,75–440,75 |
| Bordes de `#add-block` al elegir Lista con viñetas | 594,42–646,42 | 458,75–494,75 |
| Altura de `#block-content` en Concentración | 399,36 | 461,80 |
| Bordes de `#add-block` en Concentración | 597,36–649,36 | 620,80–656,80 |
| Borde superior del destino del bloque | 402,75 | 55 |
| Ancho de los campos de tipo y título | 362 / 362 | 224 / 500 |
| Distancia de la fila de acciones al tablero de símbolos al cargar | 12 | 0 |
| Tamaño de `assets/js/app.js` en bytes | 95 193 | 95 193 |

Se confirmó en el árbol de accesibilidad de Chromium que la descripción de
Contenido incluye la ayuda con el desplegable cerrado, también al editar una
lista heredada. Se comprobó el destino al editar, el atajo junto a Guardar
cambios, el progreso de una plantilla y la restauración de la ayuda al
cruzar el umbral de 64 rem. Las cajas, la visibilidad y las referencias de
descripción de los controles comparados coincidieron con la referencia en
puntero grueso emulado a 412 y 1366 px, tanto al cargar como al elegir una
lista.

Pasaron `TEX_UI_TESTS=required npm test` con 323 pruebas aprobadas, cero
omitidas y la comprobación estructural, además de `npm run check:js`,
`npm run inventario` y `git diff --check`. Se conservaron las pruebas de
interfaz existentes y se añadió una prueba a `tests/interfaz-portatil.test.js`.

Quedan pendientes las verificaciones en dispositivos táctiles físicos, con
lectores de pantalla y en Firefox y Safari.

## Paquete E — tarjetas compactas de la estructura en el portátil

Desde 64 rem con puntero fino, el encabezado ocupa una fila y la vista previa
se recorta a dos líneas. «Ver todo» aparece junto a la vista previa cuando
hay recorte. El clic con ratón en el cuerpo activa «Editar». Tab llega al
botón «Editar» desde la búsqueda. La fila de acciones conserva su espacio y
aparece al pasar el puntero o al entrar el foco. La vista Esquema conserva
las acciones y el plegado. Al editar, guardar o cancelar se mantiene visible
el mismo bloque mediante el desplazamiento de la columna de estructura.

Mediciones en Chromium 151 a 1366 × 768 con la nota «Derivadas parciales» y
25 bloques. La muestra incluye texto breve, texto largo, una integral
destacada y 22 párrafos con fórmulas en línea. La referencia es `84d6a5c`.
Las alturas están en píxeles CSS.

| Medida | Antes | Después |
| --- | ---: | ---: |
| Tarjeta de texto breve | 186,61 | 85,80 |
| Tarjeta de texto largo | 284,61 | 106,59 |
| Tarjeta con la integral | 193,22 | 106,59 |
| Rango de alturas de las 25 tarjetas | 186,61–284,61 | 85,80–106,59 |
| Altura total de la lista de tarjetas | 5084,66 | 2357,80 |
| Altura de la primera fila de Esquema | 154 | 61 |
| Altura total de Esquema | 3919 | 1621 |
| Tamaño de `assets/js/app.js` en bytes | 95 193 | 95 193 |

En Pixel 7 emulado a 412 × 839, la tarjeta breve midió 109 px y la primera
fila de Esquema midió 81 px en ambas revisiones. Las alturas de las listas
completas también coincidieron. En el portátil, el bloque 20 y Contenido
quedaron dentro de sus columnas y `scrollY` se mantuvo en 0 al editar,
guardar y cancelar. Se repitió la comprobación simulando que el navegador
ignora la opción `container` de `scrollIntoView`.

Pasaron `TEX_UI_TESTS=required npm test` con 325 pruebas aprobadas, cero
omitidas y la comprobación estructural, además de `npm run check:js`,
`npm run inventario` y `git diff --check`. Se conservaron las pruebas de
interfaz existentes y se añadieron dos en `tests/interfaz-portatil.test.js`.

Quedan pendientes las verificaciones en Firefox y Safari, con lectores
de pantalla y en dispositivos táctiles físicos.
