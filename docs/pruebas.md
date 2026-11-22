# Inventario de pruebas

> Archivo **generado**. No se edita a mano: `npm run inventario`.
> Su versión de referencia es la suite; si discrepan, manda la suite.
> `tests/documentacion.test.js` comprueba que esté al día.

## `tests/anclas.test.js` — 5 pruebas

- decisiones/ declara un status válido en cada entrada
- ningún bloque @decision quedó sin bendecir
- cada bloque @decision sigue anclado a su tramo de código
- cada decisión citada en el código existe en decisiones/
- ningún código vivo se apoya en una decisión reemplazada

## `tests/block-tree.test.js` — 41 pruebas

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

## `tests/completion.test.js` — 10 pruebas

- los fragmentos ordenan marcadores numéricos, preservan escapes y encuentran llaves vacías
- los huecos permanecen estables al escribir y Tab termina en la posición final
- aceptar matemáticas en prosa envuelve el fragmento y registra su cierre pendiente
- el ranking usa el catálogo real, acentos, cuatro niveles y desempates deterministas
- el uso decae por semanas, se limita a 300 y descarta datos corruptos
- solo una barra sin escapar y letras abren sugerencias, también los nombres de entorno
- los alias solo coinciden con un token Unicode completo que no sea un comando
- los alias predeterminados son válidos y no invaden palabras cortas del español
- la configuración se valida completa antes de aplicar cambios
- completar un entorno descarta el cierre consumido y conserva los pares exteriores

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

## `tests/documentacion.test.js` — 4 pruebas

- docs/pruebas.md está al día respecto de la suite
- ningún enlace de la documentación apunta a un archivo inexistente
- ningún índice apunta a una sección que ya no existe
- cada rótulo que citan las guías sigue existiendo en la interfaz

## `tests/editing-assist.test.js` — 13 pruebas

- el contexto matemático incluye aperturas incompletas, escapes, entornos y comentarios
- autocierra llaves literales y escapadas, delimitadores y left en su contexto
- el autocierre respeta prosa, comentarios, escapes y el carácter siguiente
- un segundo dólar convierte un par vacío en fórmula destacada y el siguiente salta
- la llave explícita tras un superíndice automático no se duplica
- el autocierre envuelve selecciones y conserva el texto seleccionado
- las dobles barras de un salto no abren delimitador matemático en prosa
- el guion literal de lista se escribe con llaves automáticas y salto del cierre
- los cierres conservan su distancia, se validan y se descartan al salir
- Retroceso elimina un par vacío pendiente y no toca un par con contenido
- Intro completa entornos con argumentos y no actúa en listas, bibliografía ni pares cerrados
- Anterior recorre los huecos después de escribir en dos argumentos
- el cursor recorre comandos, escapes y grafemas completos y respeta los comentarios

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
- los borradores v1 a v3 migran a v4 y conservan su identidad al volver a abrir
- los identificadores del estado de ejemplo no alteran un byte de LaTeX

## `tests/image-options.test.js` — 5 pruebas

- las opciones de imagen tienen valores por defecto sin altura ni etiqueta
- las opciones de imagen redondean y limitan los valores numéricos
- las opciones de imagen sanean alineación, posición y etiqueta de forma idempotente
- los avisos de ruta distinguen espacios, mayúsculas y formatos incompatibles
- avisa si el nombre contiene caracteres reservados de LaTeX

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

- el borrador v4 conserva macros desde v3, migra v1/v2 sin macros y rechaza versiones futuras
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

## `tests/pdflatex.test.js` — 1 pruebas

- pdflatex compila los fragmentos radiales y el enlace en un documento

## `tests/radial.test.js` — 5 pruebas

- los sectores empiezan arriba, giran a la derecha y asignan el borde al siguiente
- espera, cancelación, zona muerta, vibración y submenús en los dos modos
- el catálogo radial deriva referencias válidas y conserva objetivos de 44 píxeles
- los fragmentos radiales envuelven la selección literal y comparten los huecos
- todos los fragmentos radiales pasan KaTeX en su contexto y la comprobación previa

## `tests/shortcuts.test.js` — 6 pruebas

- los atajos tienen identificadores y combinaciones por ámbito únicos
- los atajos respetan AltGr, las teclas de los widgets y las combinaciones del navegador
- los atajos usan el código físico y muestran teclas legibles y accesibles
- los atajos internos del tablero se limitan a la búsqueda y la rejilla
- Ctrl+Intro incorpora bloques y en macOS usa Meta sin confundir AltGr
- Menú y Mayús+F10 se reservan al campo Contenido

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

## `tests/check-site.mjs` — comprobación estructural

No usa `node:test`: es un script con 51 aserciones sobre `index.html` (doctype, un solo `main` y `h1`, enlace de salto, orden de los scripts clásicos, rutas relativas, etiquetas asociadas y ayudas visibles). Se ejecuta con `npm test`.

---

211 pruebas con `node:test` más la comprobación estructural.
