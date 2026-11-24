# Inventario de pruebas

> Archivo **generado**. No se edita a mano: `npm run inventario`.
> Su versión de referencia es la suite; si discrepan, manda la suite.
> `tests/documentacion.test.js` comprueba que esté al día.

## `tests/actions.test.js` — 3 pruebas

- los identificadores de acciones son únicos y todo control remite a un contexto conocido
- el contexto de acción distingue tarjeta, documento, imagen, texto y matemáticas
- el menú del bloque conserva sus ocho posiciones cuando cambian los sectores habilitados

## `tests/anclas.test.js` — 5 pruebas

- decisiones/ declara un status válido en cada entrada
- ningún bloque @decision quedó sin bendecir
- cada bloque @decision sigue anclado a su tramo de código
- cada decisión citada en el código existe en decisiones/
- ningún código vivo se apoya en una decisión reemplazada

## `tests/arquitectura.test.js` — 2 pruebas

- app.js no supera su presupuesto de bytes
- cada script propio se carga en index.html y lo revisa check:js

## `tests/block-tree.test.js` — 42 pruebas

- la ausencia de children equivale a una lista vacía y el estado plano sigue siendo válido
- solo los tipos declarados como contenedores admiten hijos
- los hijos de un tipo que no los admite se conservan como hermanos, no se pierden
- la normalización sanea datos corruptos a cualquier profundidad sin lanzar
- una ruta identifica el nodo y sobrevive a hermanos con el mismo texto
- insertar admite raíz, hijo y posición concreta, y devuelve la ruta creada
- actualizar conserva la descendencia y rechaza un tipo que no la admite
- eliminar retira el nodo con toda su descendencia
- mover se limita a los hermanos y nunca cambia de nivel
- una operación inválida devuelve null y deja el árbol intacto
- las operaciones son puras: devuelven un árbol nuevo
- el recorrido aporta ruta, nivel, padre y número de hermanos
- los hijos de un entorno se emiten antes de su \end, en orden
- la anidación de tres niveles conserva el orden y cierra cada entorno
- los hijos de un bloque de texto se emiten tras su contenido, como nodos propios
- el contenido del padre no absorbe a sus hijos y un padre vacío no rompe la salida
- una fórmula no anida: unos hijos heredados se emiten tras el cierre, nunca dentro
- el documento combina matemática mixta y anidación en un mismo bloque
- un borrador plano de la versión 1 se migra sin reescribirlo a mano
- un borrador del esquema nuevo se restaura con su árbol completo
- un borrador corrupto o de una versión futura se rechaza sin lanzar
- una anidación mal formada se sanea en lugar de romper la restauración
- duplicar una hoja la coloca inmediatamente después, en el mismo nivel
- duplicar una rama de tres niveles conserva el orden exacto de toda la rama
- la copia es profunda: editar o eliminar una rama no toca a la otra
- duplicar por una ruta inválida devuelve null y no muta el árbol
- el duplicado de un bloque generado produce la misma salida dos veces
- copiar entrega un bloque suelto e independiente, y cada pegado es otro más
- copiar sanea lo que entra y rechaza lo que no es un bloque
- guardar y restaurar después de duplicar mantiene ambas ramas
- mover a otro padre rechaza rutas inexistentes, ciclos y destinos sin hijos
- mover una rama ajusta la ruta profunda de un destino desplazado y conserva sus hijos
- al mover entre ramas solo se ajusta el índice de un hermano del origen
- mover a la raíz elige por ruta entre hermanos idénticos
- mover al mismo padre reordena entre hermanos como subir y bajar
- mover un bloque a un teorema emite su contenido literal dentro del entorno
- las opciones de imagen sobreviven a duplicar, copiar, pegar y restaurar la versión 2
- editar normaliza las opciones de imagen y las descarta al cambiar a otro tipo
- restaurar listas antiguas de ambas versiones mantiene los prefijos literales y la lista plana
- listas nuevas y antiguas conservan su propio formato al copiar, duplicar, mover, guardar y restaurar
- una sesión vacía no borra el autoguardado y el bloque en curso cuenta como trabajo
- la fecha inicial es la local del día, con ceros, no la UTC

## `tests/completion.test.js` — 12 pruebas

- los fragmentos ordenan marcadores numéricos, preservan escapes y encuentran llaves vacías
- los huecos permanecen estables al escribir y Tab termina en la posición final
- aceptar matemáticas en prosa envuelve el fragmento y registra su cierre pendiente
- el ranking usa el catálogo real, acentos, cuatro niveles y desempates deterministas
- sin historial, el comando más corto encabeza las sugerencias del mismo nivel
- el uso decae por semanas, se limita a 300 y descarta datos corruptos
- solo una barra sin escapar y letras abren sugerencias, también los nombres de entorno
- los alias solo coinciden con un token Unicode completo que no sea un comando
- los alias predeterminados son válidos y no invaden palabras cortas del español
- la configuración se valida completa antes de aplicar cambios
- completar un entorno descarta el cierre consumido y conserva los pares exteriores
- la lista de sugerencias queda junto al cursor y por encima de la barra y el teclado

## `tests/config-parts.test.js` — 3 pruebas

- el archivo v1 exportado por el navegador migra sin pérdida e intercambia cada parte
- una parte ausente conserva el valor local y una desconocida produce un aviso
- los errores señalan la parte y el campo sin aplicar valores inválidos

## `tests/content-check.test.js` — 14 pruebas

- detecta llaves desparejadas y respeta las escapadas
- detecta los cuatro delimitadores matemáticos sin pareja
- las parejas matemáticas de listas y bibliografías se cierran dentro de cada elemento
- detecta entornos abiertos, cierres sueltos y cierres con otro nombre
- el porcentaje sin escapar es un aviso y el resto de su línea se ignora
- detecta guiones bajos y circunflejos fuera del modo matemático
- detecta el signo & fuera de matemáticas y tablas
- detecta un signo # suelto y respeta el signo escapado y un parámetro
- señala el séptimo entorno literal y respeta seis niveles
- la profundidad de un entorno literal suma los niveles efectivos de su elemento
- conserva la posición de un entorno literal en un elemento recortado
- cuenta los entornos emitidos por el árbol y omite ancestros de texto
- agrupa por ruta y ordena avisos por línea y columna en español
- el estado de referencia no produce avisos y una ruta de imagen se revisa aparte

## `tests/content-literal.test.js` — 8 pruebas

- la barra invertida y las llaves se conservan en todo tipo de prosa
- un elemento de lista conserva comandos, llaves y llaves sueltas
- ningún carácter reservado se escapa en el contenido
- una tabla o un align pegados desde otro documento no se corrompen
- la matemática delimitada sigue intacta, incluida la que no cierra
- los bloques matemáticos no cambian de comportamiento
- los metadatos y los títulos conservan el escapado completo, barra y llaves incluidas
- el contenido se emite igual dentro de un bloque anidado

## `tests/cross-references.test.js` — 6 pruebas

- las etiquetas de bloque son únicas en todo el árbol
- la normalización y la propuesta de etiqueta usan prefijos, acentos y sufijos libres
- las etiquetas se emiten tras el título y solo numeran ecuaciones etiquetadas
- los contadores siguen la emisión de entornos, ecuaciones y figuras flotantes o anidadas
- las sugerencias de referencia respetan el contexto, la palabra previa y los cierres
- la comprobación de etiquetas localiza referencias rotas, duplicadas y de tipo incorrecto

## `tests/documentacion.test.js` — 4 pruebas

- docs/pruebas.md está al día respecto de la suite
- ningún enlace de la documentación apunta a un archivo inexistente
- ningún índice apunta a una sección que ya no existe
- cada rótulo que citan las guías sigue existiendo en la interfaz

## `tests/editing-assist.test.js` — 14 pruebas

- el contexto matemático incluye aperturas incompletas, escapes, entornos y comentarios
- autocierra llaves literales y escapadas, delimitadores y left en su contexto
- el autocierre respeta prosa, comentarios, escapes y el carácter siguiente
- un segundo dólar convierte un par vacío en fórmula destacada y el siguiente salta
- los exponentes y subíndices escritos de corrido no abren llaves
- ^ y _ envuelven la selección como exponente o subíndice
- el autocierre envuelve selecciones y conserva el texto seleccionado
- las dobles barras de un salto no abren delimitador matemático en prosa
- el guion literal de lista se escribe con llaves automáticas y salto del cierre
- los cierres conservan su distancia, se validan y se descartan al salir
- Retroceso elimina un par vacío pendiente y no toca un par con contenido
- Intro completa entornos con argumentos y no actúa en listas, bibliografía ni pares cerrados
- Anterior recorre los huecos después de escribir en dos argumentos
- el cursor recorre comandos, escapes y grafemas completos y respeta los comentarios

## `tests/error-report.test.js` — 2 pruebas

- el informe conserva veinte errores, tres líneas de pila y los más recientes primero
- acepta rechazos sin pila, un valor ilegible y un almacén antiguo ilegible

## `tests/generator.test.js` — 37 pruebas

- los metadatos y los títulos escapan todos los caracteres reservados
- el contenido de un bloque no recibe ningún escape
- normaliza CRLF y CR
- omite bloques vacíos y tolera título vacío
- preserva ecuaciones multilínea sin escapar
- conserva párrafos y no toca el texto
- el ejemplo genera exactamente el archivo de referencia
- el nombre descargable es portable y tiene alternativa
- la tabla declara los tipos del temario en el orden de la interfaz
- un tipo desconocido no rompe la generación y cae en texto
- el bloque nota usa su propio entorno
- el preámbulo deriva un \newtheorem por cada tipo declarado
- el preámbulo solo carga paquetes de la lista blanca
- no repite \theoremstyle al agrupar entornos del mismo estilo
- el documento es autocontenido y no lleva sobre de reimportación
- las opciones de index.html coinciden con la tabla de tipos
- una proposición usa su entorno, con y sin título
- una proposición escapa su título, conserva su contenido y omite el cuerpo vacío
- la proposición se declara con contador propio, junto a los entornos de estilo plain
- una proposición se combina con fórmulas en línea y destacadas
- la matemática en línea se conserva literalmente y en una sola línea
- las listas toman un elemento por línea y conservan su texto
- una lista anidada cierra sus subniveles antes de emitir los bloques hijos
- la profundidad de lista sigue los entornos abiertos al atravesar bloques de texto y teoremas
- una lista completamente recortada conserva sus elementos y sus bloques hijos
- la bibliografía genera claves predecibles y conserva literalmente cada referencia
- la bibliografía admite una referencia y omite el entorno vacío
- la bibliografía recorta líneas y ajusta el ancho para diez o más referencias
- una imagen conserva la ruta literal y escapa el pie de figura
- una imagen sin opciones ni pie usa el ancho por defecto y omite los campos vacíos
- la imagen ordena los límites de escala antes del giro y admite alineación lateral
- una imagen anidada en un teorema permanece junto al texto y usa un pie como párrafo
- una imagen a la derecha en una lista acota su alineación y no abre un flotante
- una imagen con etiqueta y sin pie establece la referencia de figura
- los hijos de una imagen con ruta vacía se emiten aunque se omita la imagen
- Demostración usa proof predefinido y su título opcional sin redeclararlo
- hyperref se carga al final de la lista blanca únicamente con enlaces activos en el contenido

## `tests/identificadores.test.js` — 3 pruebas

- los identificadores de bloque son únicos en todo el árbol
- los borradores anteriores migran al esquema vigente y conservan su identidad al volver a abrir
- los identificadores del estado de ejemplo no alteran un byte de LaTeX

## `tests/image-options.test.js` — 5 pruebas

- las opciones de imagen tienen valores por defecto sin altura ni etiqueta
- las opciones de imagen redondean y limitan los valores numéricos
- las opciones de imagen sanean alineación, posición y etiqueta de forma idempotente
- los avisos de ruta distinguen espacios, mayúsculas y formatos incompatibles
- avisa si el nombre contiene caracteres reservados de LaTeX

## `tests/interfaz-acciones.test.js` — 1 pruebas

- cada acción del catálogo tiene un manejador en la página

## `tests/interfaz-barra.test.js` — 4 pruebas

- la barra alterna cursor, selección y sugerencias conservando el foco
- Mi botón deshace el texto y a 320 píxeles los siete objetivos caben
- arrastrar navega por unidades y mantener Siguiente amplía una vez
- arrastrar desde Símbolos elige la categoría que abre la hoja

## `tests/interfaz-configuracion.test.js` — 1 pruebas

- importar una parte conserva los alias y avisa de una parte desconocida

## `tests/interfaz-editor.test.js` — 3 pruebas

- Añadir bloque y Ctrl+Intro conservan el orden, el LaTeX y el foco de captura
- editar, cancelar y guardar respetan el texto del bloque original
- los cambios de tipo muestran las ayudas y los campos de figura llegan al documento

## `tests/interfaz-escritura.test.js` — 4 pruebas

- el autocierre y Tab completan delimitadores, alias y huecos sucesivos
- la lista de barra diagonal selecciona un tipo y actualiza el formulario
- las sugerencias de referencias y citas insertan los destinos del documento
- Selección amplía y reduce el alcance y la hoja de símbolos devuelve el foco

## `tests/interfaz-espacio.test.js` — 4 pruebas

- el esquema localiza y edita un bloque entre cincuenta y recuerda su vista
- plegar una rama conserva su estado y buscar un hijo muestra su ruta
- el modo de concentración y los paneles estrechos conservan borrador y selección
- una integral doble marcada como favorita se inserta desde la hoja táctil

## `tests/interfaz-estructura.test.js` — 4 pruebas

- editar y añadir dentro sitúan el foco en el tipo y conservan el nivel de los hijos
- duplicar, subir y bajar conservan la identidad visible y el foco de la acción
- copiar y pegar usan la bandeja y el foco pasa a la copia
- eliminar un padre pide confirmación, mueve el foco y permite deshacer y rehacer

## `tests/interfaz-informe.test.js` — 2 pruebas

- un error real ofrece copiar el informe y Más permite consultarlo y borrarlo
- una promesa rechazada se registra en la misma sesión y conserva un único aviso

## `tests/interfaz-listas-tactiles.test.js` — 4 pruebas

- la lista de barra diagonal se desplaza con el dedo y se recorre con la barra
- la lista de referencias se desplaza con el dedo y se recorre con la barra
- la lista de citas se desplaza con el dedo y se recorre con la barra
- Mover bloque permite recorrer destinos con el dedo y trasladar al elegido

## `tests/interfaz-menus-personales.test.js` — 4 pruebas

- un anillo de fórmula, Mi botón y el intercambio conservan las posiciones
- el editor intercambia posiciones sin arrastrar y permite restaurar el menú
- el submenú admite un enlace a otro anillo y el aviso de KaTeX permite guardar
- Mi botón habilita una acción de imagen solo en su contexto

## `tests/interfaz-menus.test.js` — 5 pruebas

- la barra abre texto, fórmula e imagen y Menú general abre acciones generales
- mantener una tarjeta abre sus acciones y mantener la estructura vacía abre el menú general
- clic derecho y Mayús+F10 abren el anillo y Griegas inserta el símbolo elegido
- el arrastre desde Menú envuelve la selección en el primer argumento
- un segundo dedo cancela el anillo antes de aplicar una acción

## `tests/interfaz-paneles.test.js` — 3 pruebas

- las cuatro pestañas alternan con flechas, Inicio y Fin y recuerdan la vista matemática
- Ir a, el editor de una tarjeta y los avisos revelan y enfocan su destino
- los cuatro paneles caben en dos pantallas con cinco bloques de una línea

## `tests/interfaz-tarjetas.test.js` — 3 pruebas

- la tarjeta de una línea cabe en 140 px y presenta ocho acciones en posiciones fijas
- Ver todo expande una vista de más de tres líneas y pegar dentro respeta la bandeja
- una ecuación de una línea conserva sus límites de integral en la tarjeta compacta

## `tests/interfaz-tipo.test.js` — 3 pruebas

- el chip de tipo conserva el borrador y sincroniza ayudas, título y vista previa
- Más tipos usa activación de teclado y ofrece el selector si no hay showPicker
- el escritorio mantiene el selector y el título y el teléfono ahorra al menos 140 píxeles

## `tests/interfaz-versiones.test.js` — 3 pruebas

- guardar, comparar y restaurar una versión conserva el respaldo
- un proyecto exportado se importa en un navegador con almacenamiento vacío
- recuperar tras recargar devuelve los bloques y el texto a medio escribir

## `tests/interfaz.test.js` — 6 pruebas

- la página abre sin errores en escritorio y en el teléfono
- añadir un bloque y generar deja su contenido literal en el código LaTeX
- el dedo desplaza las sugerencias de la barra invertida sin elegir ninguna
- Anterior y Siguiente recorren las sugerencias y tocar una la inserta
- la lista de sugerencias queda por encima de la barra del pulgar
- el botón Menú de la barra abre el menú del contexto y Escape devuelve el foco

## `tests/invariantes.test.js` — 4 pruebas

- INVARIANTES.md declara invariantes con identificadores únicos
- cada invariante nombra al menos un guardián
- cada guardián existe y sigue afirmando lo que se le atribuye
- INV-006: ni el sitio ni el proyecto cargan nada remoto

## `tests/list-outline.test.js` — 10 pruebas

- la sangría acepta espacios y tabuladores, recorta saltos e ignora líneas vacías y CRLF
- los marcadores fijan el tipo de un subnivel al abrirlo y se consumen en todos los niveles
- las posiciones opcionales apuntan al texto en listas planas y anidadas, incluso al recortar niveles
- la salida de una lista mixta sangra solo los subniveles y preserva el contenido literal
- hay como máximo cuatro listas del mismo tipo y se conservan los elementos recortados en orden
- el límite total cuenta las listas mixtas y los entornos que ya rodean al bloque
- sangrar conserva una selección invertida con Unicode y excluye la línea tras su extremo
- quitar sangría ajusta cursores dentro del prefijo, respeta líneas planas y retira espacios o tabulador
- Intro conserva el prefijo, aumenta marcadores numerados y reemplaza una selección invertida con Unicode
- Intro quita un nivel en elementos vacíos y deja un salto normal en la raíz

## `tests/macros.test.js` — 8 pruebas

- el borrador vigente conserva macros desde v3, migra v1/v2 sin macros y rechaza versiones futuras
- el preámbulo añade newcommand literal tras graphicx y no cambia sin macros
- la validación de macros protege nombres reservados del catálogo y entornos
- la definición de macro valida llaves, escapes, una línea y parámetros declarados
- la vista previa consume todos los argumentos y aísla gdef entre llamadas
- cada comando de katex-only es aceptado por el KaTeX incluido y se señala como error
- las macros del documento suprimen katex-only y empty/th conservan avisos de significado
- las macros aparecen antes del catálogo y se validan al importar configuración

## `tests/math-preview.test.js` — 8 pruebas

- extrae cada delimitador y conserva posiciones y prosa literal
- prioriza dobles dólares e ignora dólares escapados o sin pareja
- normaliza CRLF y acepta varios tramos y contenido vacío
- un dólar sin pareja conserva la fórmula destacada siguiente
- las dobles barras conservan como prosa los delimitadores aparentes
- los tipos matemáticos usan todo el contenido y derivan displayMode de la tabla
- todos los kinds no matemáticos extraen tramos delimitados
- analyzeContent clasifica resultados y fallos del renderizador inyectado

## `tests/menu-config.test.js` — 4 pruebas

- la resolución mantiene las ocho posiciones e incorpora los sectores predeterminados
- cada error identifica su campo y los ciclos incluyen enlaces de submenú
- un anillo independiente conserva enlaces, huecos y submenús en el archivo portátil
- un enlace a las acciones de tarjeta conserva el sector de mover deshabilitado en el editor

## `tests/pdflatex.test.js` — 4 pruebas

- pdflatex compila los fragmentos radiales y el enlace en un documento
- pdflatex confirma los números de cada destino tras dos compilaciones
- pdflatex confirma las ocho citas del curso y el orden de bibcite en IEEE
- pdflatex confirma las ocho citas del curso y el orden de bibcite en APA

## `tests/radial.test.js` — 6 pruebas

- los sectores empiezan arriba, giran a la derecha y asignan el borde al siguiente
- espera, cancelación, zona muerta, vibración y submenús en los dos modos
- el catálogo radial deriva referencias válidas y conserva objetivos de 44 píxeles
- los fragmentos radiales envuelven la selección literal y comparten los huecos
- todos los fragmentos radiales pasan KaTeX en su contexto y la comprobación previa
- el clic táctil posterior a soltar la barra se reconoce aun con detail cero y el teclado conserva el foco

## `tests/references.test.js` — 8 pruebas

- cada error bibliográfico identifica su campo y la clave se propone sin colisiones
- las fichas IEEE y APA formatean autores, edición, lugar y campos literales o escapados
- IEEE sigue las citas de padres e hijos y APA ordena por apellido, año y título
- natbib solo se activa por una ficha o por un comando propio escrito fuera de comentarios
- las sugerencias de cita sustituyen solo la clave actual con opcionales, estrella y varias claves
- la migración de v5, la configuración antigua y el proyecto conservan la bibliografía
- la conversión conserva las claves y las líneas literales y rechaza colisiones de forma atómica
- el resumen bibliográfico distingue claves rotas, conflictos antiguos y fichas APA o sin cita

## `tests/selection-scope.test.js` — 6 pruebas

- fracciones anidadas, relaciones y delimitadores amplían rangos estrictamente crecientes
- la raíz con índice y los subíndices y superíndices compuestos incluyen su base
- left y right forman un grupo y las llaves escapadas y comentarios son atómicos
- los entornos de matriz distinguen celda, fila y fórmula con delimitadores
- la prosa española y text dentro de matemáticas usan palabras y oraciones
- reducir recupera exactamente una selección hacia atrás y respeta extremos y grafemas

## `tests/shortcuts.test.js` — 6 pruebas

- los atajos tienen identificadores y combinaciones por ámbito únicos
- los atajos respetan AltGr, las teclas de los widgets y las combinaciones del navegador
- los atajos usan el código físico y muestran teclas legibles y accesibles
- los atajos internos del tablero se limitan a la búsqueda y la rejilla
- Ctrl+Intro incorpora bloques y en macOS usa Meta sin confundir AltGr
- Menú y Mayús+F10 se reservan al campo Contenido

## `tests/suggestion-sources.test.js` — 2 pruebas

- la prioridad y la aceptación son de la misma fuente
- barra diagonal, referencias, citas, comandos y entornos reconocen sus tokens

## `tests/symbols.test.js` — 21 pruebas

- inserta al principio, en medio y al final del contenido
- sustituye la selección activa y conserva el resto
- acepta una selección invertida sin perder contenido
- trabaja sobre un campo vacío
- conserva caracteres Unicode fuera del ASCII y cuenta en unidades UTF-16
- un índice ausente o fuera de rango se ajusta al contenido
- insertar la cadena vacía no altera el contenido
- el catálogo es coherente: identificadores únicos y grupos declarados
- el conjunto inicial cubre griegas, conectores, cuantificadores, relaciones y agrupación
- el nombre accesible describe el comando en palabras
- la búsqueda ignora acentos, mayúsculas y acepta el comando
- una búsqueda vacía devuelve todo el catálogo y una sin coincidencias devuelve nada
- cubre el alfabeto griego y sus variantes válidas
- cubre conjuntos y topología sin comandos de paquetes ajenos
- las plantillas abren un hueco o envuelven una selección
- todo el catálogo se puede representar con KaTeX
- las flechas horizontales de la rejilla dan la vuelta e Inicio y Fin van a los extremos
- la rejilla vuelve al buscador arriba y ajusta la última fila incompleta
- la navegación admite una sola columna y una rejilla vacía
- el cambio circular de categoría incluye Recientes al principio
- los recientes conservan hasta doce símbolos distintos y conocidos en orden de inserción

## `tests/templates.test.js` — 6 pruebas

- las once plantillas incluidas son válidas, renderizan sus fórmulas y no producen errores previos
- las plantillas rechazan saltos de profundidad, padres incompatibles, tipos y comandos duplicados
- el menú / deriva tipos de la tabla, tolera acentos y separa el título
- la cola usa las rutas insertadas y el teorema y su demostración son hermanos
- omitir un padre omite su descendencia y capturar una rama conserva opciones de imagen
- una plantilla conserva el formato de una lista antigua hasta que se modifica el contenido

## `tests/text-insertion.test.js` — 2 pruebas

- diffEdit calcula inserciones, borrados y reemplazos mínimos sin cambios ficticios
- diffEdit nunca divide un par sustituto UTF-16 en sus límites

## `tests/thumb-bar.test.js` — 2 pruebas

- la lista abierta tiene prioridad sobre el alcance y el cursor
- el arrastre cuenta pasos completos con signo cada 28 píxeles

## `tests/versions.test.js` — 6 pruebas

- el historial limita cien pasos, restaura en ambas direcciones y descarta la rama rehecha
- las diferencias por id abarcan posición, padre, opciones, lista, macros y líneas
- la retención conserva las manuales y cuenta las automáticas por documento
- las exportaciones se deduplican por contenido y la migración del borrador es idempotente
- el proyecto valida, informa qué versiones omite y combina por id sin sobrescribir
- el autoguardado distingue cambios pendientes, guardado correcto y error sin perder la copia previa

## `tests/check-site.mjs` — comprobación estructural

No usa `node:test`: es un script con 52 aserciones sobre `index.html` (doctype, un solo `main` y `h1`, enlace de salto, orden de los scripts clásicos, rutas relativas, etiquetas asociadas y ayudas visibles). Se ejecuta con `npm test`.

---

317 pruebas con `node:test` más la comprobación estructural.
