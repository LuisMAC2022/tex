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

## `tests/block-tree.test.js` — 30 pruebas

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

## `tests/content-literal.test.js` — 8 pruebas

- la barra invertida y las llaves se conservan en todo tipo de prosa
- un elemento de lista conserva comandos, llaves y llaves sueltas
- ningún carácter reservado se escapa en el contenido
- una tabla o un align pegados desde otro documento no se corrompen
- la matemática delimitada sigue intacta, incluida la que no cierra
- los bloques matemáticos no cambian de comportamiento
- los metadatos y los títulos conservan el escapado completo, barra y llaves incluidas
- el contenido se emite igual dentro de un bloque anidado

## `tests/documentacion.test.js` — 1 pruebas

- docs/pruebas.md está al día respecto de la suite

## `tests/generator.test.js` — 21 pruebas

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
- no repite \theoremstyle al agrupar entornos del mismo estilo
- el documento es autocontenido y no lleva sobre de reimportación
- las opciones de index.html coinciden con la tabla de tipos
- una proposición usa su entorno, con y sin título
- una proposición escapa su título, conserva su contenido y omite el cuerpo vacío
- la proposición se declara con contador propio, junto a los entornos de estilo plain
- una proposición se combina con fórmulas en línea y destacadas
- la matemática en línea se conserva literalmente y en una sola línea
- las listas toman un elemento por línea y conservan su texto

## `tests/invariantes.test.js` — 4 pruebas

- INVARIANTES.md declara invariantes con identificadores únicos
- cada invariante nombra al menos un guardián
- cada guardián existe y sigue afirmando lo que se le atribuye
- INV-006: ni el sitio ni el proyecto cargan nada remoto

## `tests/symbols.test.js` — 15 pruebas

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

## `tests/check-site.mjs` — comprobación estructural

No usa `node:test`: es un script con 38 aserciones sobre `index.html` (doctype, un solo `main` y `h1`, enlace de salto, orden de los scripts clásicos, rutas relativas, etiquetas asociadas y ayudas visibles). Se ejecuta con `npm test`.

---

84 pruebas con `node:test` más la comprobación estructural.
