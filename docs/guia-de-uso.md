<!--
  Convención de este archivo, para quien lo mantenga:

  «Guillemets» = un rótulo de ESTA aplicación, copiado literal de la pantalla.
  tests/documentacion.test.js comprobará que cada uno siga existiendo en
  index.html o en assets/js/app.js, así que renombrar un botón y olvidarse de
  esta guía romperá npm test.

  La regla es exacta a propósito: la negrita queda libre para el énfasis y no
  la mira nadie. Si necesitas escribir algo entre guillemets que NO sea un
  rótulo, usa comillas. Los controles de Overleaf van en *cursiva*, porque no
  están en nuestro árbol y no podemos vigilarlos.

  Esta guía no nombra archivos internos, rutas ni comandos: eso es la guía de
  desarrollo. La única excepción es index.html, que es lo que se abre.
-->

# Guía de uso

Cómo pasar de unos apuntes de clase a un PDF, sin saber programar y sin haber
usado LaTeX antes. No hay nada que instalar.

Si en algún momento algo no cuadra con lo que ves en pantalla, manda la pantalla:
este texto puede haberse quedado atrás.

---

## Índice

1. [Qué es esto y qué no](#1-qué-es-esto-y-qué-no)
2. [Tu primera nota, en cinco minutos](#2-tu-primera-nota-en-cinco-minutos)
3. [Los tipos de bloque](#3-los-tipos-de-bloque)
4. [Meter un bloque dentro de otro](#4-meter-un-bloque-dentro-de-otro)
5. [Repetir cosas: cuatro botones parecidos](#5-repetir-cosas-cuatro-botones-parecidos)
6. [Símbolos matemáticos](#6-símbolos-matemáticos)
7. [Guardar el trabajo](#7-guardar-el-trabajo)
8. [Lo que tienes que escribir tú](#8-lo-que-tienes-que-escribir-tú)
9. [Cuando Overleaf da error](#9-cuando-overleaf-da-error)

---

## 1. Qué es esto y qué no

Esta aplicación es una **libreta que escribe LaTeX por ti**. Tú rellenas campos y
eliges de una lista qué es cada trozo —un teorema, una definición, una fórmula, una
lista—, y ella arma el archivo `.tex` completo, con su preámbulo y sus entornos bien
puestos.

**No compila nada.** El PDF lo hace [Overleaf](https://www.overleaf.com). El camino
es siempre el mismo y va en una sola dirección:

```
   esta aplicación   →   copias el código   →   Overleaf   →   PDF
```

Tres consecuencias que conviene saber desde el principio:

- **Overleaf manda.** Si corriges algo allí, la corrección **no vuelve** a esta
  aplicación. No existe forma de reimportar. Así que decide pronto dónde vas a
  seguir trabajando: aquí mientras construyes la estructura, y en Overleaf a partir
  de la primera corrección seria.
- **Nada sale de tu navegador.** No hay servidor, no hay cuenta, no se envía nada a
  ninguna parte. Funciona sin internet.
- **Y por eso mismo, tu trabajo vive solo en este navegador y en este aparato.** Si
  borras los datos de navegación, si abres la página en otro ordenador o en el móvil,
  o si usas una ventana de incógnito, **no vas a encontrar lo que escribiste**. Ver
  [Guardar el trabajo](#7-guardar-el-trabajo).

---

## 2. Tu primera nota, en cinco minutos

### Abrir

Haz doble clic en el archivo `index.html`. Se abre en el navegador como cualquier
página. No hace falta nada más.

### Rellenar la cabecera

Arriba, en «Datos del documento», ya vienen escritos el curso, el profesor y una
fecha. Cámbialos si no son los tuyos.

**El único campo obligatorio es el título.** Sin título la aplicación no genera el
documento y te lo dice junto al campo. Autor, curso, profesor y fecha son opcionales.

El campo «Tema o unidad» crea un apartado con ese nombre dentro del PDF. Si lo
dejas vacío, no aparece.

### Añadir el primer bloque

Baja a «Contenido». Un bloque es un trozo de la nota: un párrafo, un teorema, una
fórmula. Se añaden de uno en uno:

1. Elige el tipo en la lista desplegable —empieza por «Texto»—.
2. El «Título del bloque (opcional)» es justo eso, opcional. En un teorema es donde va su nombre
   (“Fubini”); en un texto crea un subapartado.
3. Escribe en «Contenido». No puede quedar vacío: si lo dejas así, la aplicación
   te avisa junto al campo.
4. Pulsa «Añadir bloque».

El bloque aparece en la lista de abajo con sus botones propios. Repite para el resto.

### Generar y llevarlo a Overleaf

1. Pulsa «Generar documento» para actualizar «Código LaTeX» y el resumen de
   «Comprobación previa a Overleaf» en «Resultado».
2. Pulsa «Copiar código». Ya tienes el `.tex` entero en el portapapeles.
   - También puedes pulsar «Descargar .tex» y guardarlo como archivo. El nombre
     sale de tu título.
3. En Overleaf: *New Project → Blank Project*. Borra todo lo que traiga el editor,
   pega lo tuyo con `Ctrl+V` y pulsa *Recompile*.

El ejemplo usa los paquetes incluidos en Overleaf. Para compilar un documento
con imágenes, sube también los archivos de imagen a las rutas indicadas en el editor.

> Si el botón de copiar no funciona —pasa en algunos navegadores al abrir la página
> con doble clic—, la aplicación selecciona el texto por ti y te avisa. Copia con
> `Ctrl+C` y sigue igual.

---

## 3. Los tipos de bloque

| Eliges | Sale en el PDF |
| --- | --- |
| «Texto» | Un párrafo normal. Con título, además, un subapartado con ese nombre. |
| «Ecuación destacada» | La fórmula centrada, en su propio renglón. |
| «Expresión matemática en línea» | La fórmula dentro del renglón, sin cortar el párrafo. |
| «Definición» | Un recuadro `Definición 1`, numerado. |
| «Teorema» | `Teorema 1`. |
| «Proposición» | `Proposición 1`. |
| «Demostración» | Entorno proof; el título opcional sustituye a su encabezado. |
| «Ejemplo» | `Ejemplo 1`. |
| «Nota» | `Nota 1`. |
| «Lista con viñetas» | Una lista de puntos. |
| «Lista numerada» | Una lista 1, 2, 3. |
| «Bibliografía (IEEE)» | Referencias numeradas entre corchetes. |
| «Imagen» | Una imagen con pie de figura opcional. |

**En las listas, cada renglón con texto es un elemento.** Escribe en «Contenido» y
sangra con dos espacios o un tabulador por nivel. El tipo de bloque determina el
nivel raíz. Cada sublista toma el tipo de la lista que la contiene, salvo que su
primer elemento empiece por `- ` o `* ` para viñetas, o por `1. ` o `1) ` para
numeración. Puedes pegar líneas con marcadores. Escribe `{}- ` para imprimir un
guion al principio de un elemento.

Con el cursor en una línea o con varias líneas seleccionadas, usa «Sangrar»
(Alt+Mayús+G o ⌥⇧G en Mac) y «Quitar sangría» (Alt+Mayús+Q o ⌥⇧Q en Mac). Intro
conserva la sangría y el marcador e incrementa los números. En un punto vacío
con sangría, Intro quita un nivel. Tab recorre los controles.

«Vista previa de las matemáticas» muestra la lista anidada. Si agotas los cuatro
niveles del mismo tipo o los seis entornos combinados, verás un aviso junto a
«Contenido» y los elementos más profundos aparecerán en el último nivel disponible.
Si el bloque entero alcanza el límite, sus elementos aparecerán como párrafos.

Las listas de un borrador anterior conservan sus guiones, números y demás
prefijos como texto. Al cambiar su «Contenido» se aplican las reglas de sangría y
marcadores. Cambiar solo el título, copiar o mover el bloque conserva su formato.

**En la bibliografía, escribe una referencia por línea.** Cada línea con texto
se convierte en un `\bibitem`. Usa un solo bloque por documento para evitar
claves repetidas.

**Cada tipo lleva su propia cuenta.** `Teorema 1`, `Teorema 2`… van por un lado y
`Definición 1`, `Definición 2`… por otro. Los números **no se reinician** en cada
apartado: siguen corridos hasta el final del documento. Es a propósito.

### Insertar y editar una imagen

1. Selecciona «Imagen». En «Opciones de imagen», escribe la ruta en «Archivo de imagen» o usa «Elegir archivo…» para rellenar el nombre y obtener una miniatura local. Sube el archivo al proyecto de Overleaf en esa misma ruta. El proyecto guarda la ruta y los ajustes de la imagen.
2. Escribe el pie en «Título del bloque (opcional)». Ajusta «Ancho de la imagen» con el deslizador o elige «Pequeña» (40 %), «Mediana» (60 %), «Grande» (80 %) o «Ancho completo» (100 %). Si indicas «Altura máxima (cm, opcional)», la escala respeta ambos límites y mantiene las proporciones antes de girar.
3. Pulsa «Girar 90°» o ajusta «Ángulo de giro (grados)». Elige «Izquierda», «Centro» o «Derecha» en «Alineación de la imagen» y completa «Posición de la figura» o «Etiqueta de la figura (opcional)» si las necesitas.
4. Comprueba la ruta o la miniatura en «Vista previa de la imagen» y usa «Añadir bloque». Para volver a cargar sus ajustes, abre «Editar» en el bloque y confirma con «Guardar cambios».

La ruta vacía impide añadir la imagen. Los avisos por espacios, caracteres reservados de LaTeX, mayúsculas en la extensión o formatos distintos de PNG, JPG, JPEG y PDF permiten guardarla. Al añadir la imagen dentro de un teorema o una lista, aparece en ese sitio y el pie se compone como párrafo. El ancho es un porcentaje del ancho de texto del documento. En una lista con sangría, un porcentaje menor deja más espacio para los márgenes. «Posición de la figura» se aplica a las imágenes flotantes.

---

## 4. Meter un bloque dentro de otro

Es lo único que cuesta un poco. Sirve para, por ejemplo, poner una lista «dentro»
de un teorema en vez de después de él.

1. En el bloque que quieres como contenedor, pulsa «Añadir dentro».
2. Mira la frase que hay justo encima del formulario: **siempre dice dónde va a caer
   el bloque siguiente**. Ésa es tu brújula; si dudas, léela.
3. Añade el bloque como siempre. Cae dentro.
4. El destino **se queda fijado**: el siguiente bloque también caerá ahí. Es cómodo
   para meter varios seguidos.
5. Para volver a escribir al nivel de siempre, pulsa «Añadir en la raíz».

Se puede anidar tantos niveles como quieras. Cada bloque muestra su nivel y de quién
depende (`Nivel 2 · dentro de 1 Teorema: Fubini`).

«Añadir dentro» está disponible en texto, entornos tipo teorema y listas.

### Los demás botones de cada bloque

- «Editar» abre el bloque en el formulario de arriba. Mientras editas, **Añadir
  bloque** pasa a llamarse **Guardar cambios**. Lo que haya dentro del bloque se
  conserva.
- «Subir» y «Bajar» lo mueven **solo entre sus iguales**, sin sacarlo de donde
  está. En los extremos el botón aparece apagado.
- «Mover a…» traslada el bloque con todos sus hijos. En «Destino», elige
  «Raíz del documento» o un bloque que admita hijos. En «Posición», elige
  «Al principio» o «Al final» y confirma con «Mover bloque». El foco vuelve a
  «Editar» del bloque movido y se anuncian su ruta anterior y la nueva. Si
  había una edición en curso, se cancela. El siguiente bloque se añadirá en
  la raíz. Puedes cerrar el diálogo con «Cancelar» o `Escape` para volver al
  botón que lo abrió.
- «Eliminar» pide confirmación y te dice cuántos bloques se van con él.

---

## 5. Repetir cosas: cuatro botones parecidos

Tienen nombres que se parecen y hacen cosas distintas. Merece la pena leerlo una vez.

| Botón | Qué hace | Cuándo lo quieres |
| --- | --- | --- |
| «Duplicar» | Deja una copia **justo debajo**, al mismo nivel, con todo lo que tuviera dentro. De un solo paso: no eliges destino. | “Otro teorema igual que éste, para cambiarle dos cosas.” |
| «Copiar bloque» | Guarda el bloque en una **bandeja** de la aplicación. No lo mueve ni lo cambia. Luego «Pegar bloque» lo coloca donde diga la frase del formulario. | “Quiero esta lista también dentro de aquel otro teorema.” |
| «Copiar texto» | Manda el contenido del bloque al **portapapeles del sistema**, para pegarlo con `Ctrl+V` donde sea, incluso fuera de la aplicación. | “Me llevo este párrafo al correo.” |
| «Copiar código» | Copia **el documento entero** ya generado. Es el de arriba, el que usas para Overleaf. | Siempre que vayas a Overleaf. |

Sobre la bandeja:

- **No se vacía al pegar.** Pega el mismo bloque tantas veces y en tantos sitios como
  necesites.
- Cada pegado es **independiente**: editar una copia no cambia las demás ni el
  original.
- **La bandeja no se guarda.** Vive solo en la pestaña abierta; si recargas, se pierde
  (el resto de tu nota, no).

---

## 6. Símbolos matemáticos

Desde «Contenido» o desde otro campo del bloque, pulsa `Alt+Mayús+S` (`⌥⇧S` en
macOS). También puedes activar «Buscar» junto a «Símbolos matemáticos». El foco
va a «Buscar símbolo», que acepta nombres como “para todo” y comandos
como `forall`. `↓` pasa al primer resultado e `Intro` lo inserta directamente.

- Usa las flechas en la rejilla para recorrer los símbolos, e `Inicio` y `Fin` para
  ir a los extremos. `Re Pág` y `Av Pág` cambian de categoría. `↑` desde la primera
  fila vuelve al buscador. Escribir en la rejilla añade texto a la búsqueda.
- Activa un símbolo con `Intro`, `Espacio` o un clic. Se inserta donde estaba el
  cursor y vuelve el foco. Si abriste el tablero desde un control como «Tipo de bloque»,
  el símbolo va a «Contenido» y el foco vuelve al control.
- Desde la rejilla, `Escape` vuelve al campo con su selección. Desde el buscador,
  el primer `Escape` borra el texto de la búsqueda. Si ya está vacía, vuelve al
  campo. `Alt+Mayús+S` o `⌥⇧S` vuelven directamente desde cualquier parte del tablero.
- **Recientes** es la primera categoría y reúne los últimos doce símbolos distintos
  que insertaste. El historial se conserva en este navegador fuera del borrador.
- Consulta «Atajos de teclado» al final del formulario para ver las combinaciones.

Los símbolos funcionan igual dentro y fuera de los bloques de ecuación. Dentro de un
párrafo normal, rodea la fórmula de `$…$` para que salga bien.

### Vista previa al escribir

«Vista previa de las matemáticas» muestra las fórmulas de «Contenido» y del
bloque guardado. En un párrafo, prueba `Sea $x \in \mathbb{R}$.` El aviso
**No se pudo previsualizar** permite seguir editando y exportando. La compilación
en Overleaf comprueba el documento completo.

### Comprobación antes de exportar

Debajo de «Contenido» aparecen los avisos de LaTeX después de una pausa al
escribir. Cada aviso indica la línea y la columna dentro del bloque. La
estructura muestra el recuento por bloque. En listas y bibliografías, abre y
cierra cada fórmula dentro de un mismo elemento.

Al pulsar «Generar documento», el resumen «Comprobación previa a Overleaf»
agrupa los avisos. Usa el enlace **Ir al bloque** para enfocar su botón «Editar».
Después de guardar cambios en un bloque o de modificar la estructura, vuelve a
generar para actualizar el resumen. Puedes copiar o descargar el contenido
original aunque aparezcan avisos.

---

## 7. Guardar el trabajo

La sesión guarda el bloque en curso para recuperarlo al abrir. En «Versiones», **Guardar versión** conserva un punto al que puedes volver. Puedes darle nombre. Generar, copiar y descargar el código guardan una versión automática si el documento cambió. Al copiar o descargar un resultado anterior, el editor actualiza el código con los cambios confirmados.

- **Ver cambios** compara la versión con el documento actual. **Restaurar** guarda antes un respaldo. **Deshacer cambio** permite volver atrás en la sesión.
- **Renombrar** y **Eliminar** actúan sobre la versión elegida. Las versiones manuales se conservan hasta que las elimines. Se guardan las últimas 30 automáticas de cada documento, u ocho si el navegador solo ofrece el almacenamiento alternativo.
- **Exportar proyecto** descarga el JSON con los bloques, macros y versiones del documento. Marca **Incluir la configuración portátil** si quieres llevar también alias, plantillas y preferencias. Guarda el archivo en Drive o en un repositorio privado para pasarlo entre teléfono y portátil.
- **Importar proyecto** guarda primero un respaldo, combina las versiones por id e indica cuáles omitió. En la lista también puedes recuperar el respaldo anterior a una importación.
- Si tenías un borrador antiguo, la versión **Borrador guardado (migrado)** queda disponible en el primer arranque. El panel indica si el navegador concedió almacenamiento persistente y cuánto espacio está en uso.

---

## 8. Lo que tienes que escribir tú

**La aplicación copia tu contenido tal cual, sin tocar ni un carácter.** Eso es lo que
te permite pegar aquí un trozo de LaTeX de otro documento —un `align`, una tabla— y
que llegue intacto. Y es también lo que pone en tus manos los cinco caracteres que
LaTeX se reserva.

| Escribes | Sale |
| --- | --- |
| `Usa \textbf{este término}.` | tal cual, en negrita |
| `\forall x \in \mathbb{R}` | tal cual, el símbolo |
| `Sea $x_1 \in A$.` | tal cual, la fórmula |
| `El 50\% \& el resto` | `50% & el resto`, impreso |
| `El 50% del total` | ⚠️ **`El 50`** — el resto del renglón desaparece |

Para que aparezcan **impresos**, escribe la barra delante:

| Quieres ver | Escribe |
| --- | --- |
| `%` | `\%` |
| `&` | `\&` |
| `#` | `\#` |
| `_` | `\_` |
| `$` | `\$` |

**El `%` es el único que falla en silencio.** No da error: simplemente borra del PDF
todo lo que le siga en ese renglón. Los demás protestan al compilar, que es mejor.

> **El título del bloque y los datos de la cabecera son la excepción**: ésos sí se
> arreglan solos. Puedes escribir `50%` en el título de un teorema sin pensarlo. La
> regla de arriba vale para el campo «Contenido».

---

## 9. Cuando Overleaf da error

Estos son los casos más habituales y los que señala la comprobación previa.

### “Falta un trozo de texto en el PDF, pero no hay ningún error”

Un **`%`** suelto. Ha comentado el resto de su renglón. Busca el `%` en esa frase y
ponle la barra: `\%`.

Es el único fallo silencioso de todos, y por eso va el primero.

### Modo matemático

Si ves `Missing $ inserted`, comprueba si has usado fuera de una fórmula algo
que solo existe dentro, como **`_`** o **`^`**.

- Si querías el guion bajo impreso → `\_`.
- Si era un subíndice → rodéalo de `$…$`: `$x_1$`.

Comprueba también las parejas de delimitadores, como `$…$`, `$$…$$`,
`\(…\)` o `\[…\]`.

### Llaves y caracteres reservados

Cada `{` de un grupo necesita su `}`. Para que se impriman como texto, escribe
`\{` y `\}`. Escribe `\#` para un numeral impreso y `\&` para un signo
de unión en prosa. Dentro de un `tabular` o un `align`, usa `&` para separar
las columnas.

### `Undefined control sequence`

Overleaf no conoce ese comando. Dos motivos:

- **Está mal escrito.** `\mathbF{R}` en vez de `\mathbf{R}`. Overleaf te señala la línea.
- **Necesita un paquete que el documento no trae.** El documento incluye lo habitual
  de un curso de matemáticas —`amsmath`, `amssymb`, `amsthm`, español— y nada más. Si
  copiaste de un apunte que usaba `\mathscr`, TikZ o una macro propia de su autor,
  aquí no existe. Añade el paquete a mano en Overleaf, arriba del todo, o usa otro
  comando.

### Entornos desparejados

El error `\begin{...} ended by \end{...}` puede aparecer al pegar media tabla
o medio `align` desde otro documento. Comprueba que cada `\begin{X}` tenga su
`\end{X}` con el mismo nombre.

### Profundidad de listas y entornos

La comprobación señala el séptimo entorno anidado, contando los entornos que
abren los bloques y los que escribes con `\begin`. Si Overleaf indica que hay
demasiados niveles, reduce la anidación.

### `Missing \begin{document}` o el PDF sale casi vacío

Pegaste solo una parte del código. Vuelve a la aplicación, pulsa «Generar documento»,
«Copiar código», y en Overleaf **selecciona todo y bórralo** antes de pegar.

### Los acentos salen como símbolos raros

El archivo llegó en otra codificación. Lo más rápido: vuelve a copiar y pegar desde la
aplicación en un proyecto en blanco, en vez de subir un archivo.

---

### Si nada de esto encaja

Fíjate en el **número de línea** que da Overleaf y mira esa línea en el editor: casi
siempre el problema está ahí o en la anterior. Y recuerda que a partir de la primera
corrección seria conviene seguir en Overleaf, no aquí.

## Captura continua y recuperación

Ctrl+Intro (⌘+Intro en macOS) activa «Añadir bloque» o «Guardar cambios» desde
cualquier control del editor. Después de añadir, el foco vuelve a «Contenido»;
en imágenes pasa a «Archivo de imagen». Intro desde el título del bloque
pasa al contenido. La fila de acciones queda antes de la vista previa. La
explicación extensa está plegada en «Ayuda del contenido».

Las inserciones del tablero y las ediciones de listas conservan el historial
nativo de deshacer cuando el navegador admite insertText. La sesión se guarda
al editar y al ocultar o cerrar la pestaña, incluido el bloque sin incorporar.
Al volver, «Recuperar sesión» recupera ese trabajo y «Descartar» elimina la
oferta. «Guardar versión» conserva un punto de restauración independiente.

## Autocierre en Contenido

En «Preferencias de escritura», «Cerrar automáticamente llaves y delimitadores»
activa el cierre de llaves y fórmulas. Paréntesis, corchetes y exponentes se
completan solo en matemáticas. Las llaves envuelven la selección; un cierre ya
pendiente se salta al teclearlo. Retroceso elimina un par automático vacío.
Intro tras una apertura de entorno añade su cierre salvo en listas y bibliografía.
Los comentarios, las teclas muertas y la composición conservan la escritura normal.

## Sugerencias, huecos y alias

Escribe una barra y al menos una letra en «Contenido». El menú propone hasta
ocho comandos según el texto, sus nombres en español y el uso reciente. ↑ y ↓
cambian de opción; Intro, Tab o tocar una opción la insertan. Escape cierra el
menú sin borrar lo escrito. En prosa, aceptar matemáticas añade sus dólares.
Tras una apertura de entorno también se sugieren nombres.

Los fragmentos tienen huecos: Tab pasa al siguiente y después a la posición
final. Escape termina la sesión sin mover el cursor. La prioridad de Tab es:
menú, hueco, cierre pendiente (permitiendo espacios antes), alias y navegación
nativa. El asistente se limita a Contenido.

En «Mis alias», completa «Disparador», «Expansión» y «Modo del alias»; usa
«Guardar alias», «Editar alias» o «Borrar alias». «Cancelar alias» abandona la
edición. Los marcadores #1 a #9 definen huecos y #0 la posición final; sin
marcadores, cada par de llaves vacío es un hueco. Un signo de número literal
se escribe escapado. Los alias solo se expanden con Tab: RR da el conjunto de
reales; fr una fracción; pd una derivada parcial. Las tildes forman parte del
disparador, por lo que “lím” no activa “lim”.

«Restablecer alias predeterminados» repone la lista incluida. «Exportar configuración» descarga notas-latex-configuracion.json; «Importar configuración»
valida el archivo completo y pide confirmación antes de reemplazar tus preferencias.
El historial de **Recientes** del tablero sigue siendo independiente.

## Comandos de tipo y plantillas

En Contenido vacío escribe / y el comando: /txt o /texto, /ec, /el, /def, /teo,
/prop, /dem, /ej, /nota, /lista o /vi, /enum o /num, /bib, /img. Puedes buscar
por nombre sin distinguir acentos. Escribe el título después de un espacio,
por ejemplo /teo Fubini. Intro o Tab aplica; Escape conserva lo escrito. Al
seleccionar imagen, el foco pasa a su archivo. «Demostración» usa proof: si
pones un título, reemplaza el encabezado habitual en el PDF.

El mismo menú ofrece teodem, ejres, limite, parcial, grad, lagrange, fubini,
polares, esfericas, taylor y preclase. Carga un paso cada vez: escribe en sus
huecos y confirma con Ctrl+Intro. El aviso de plantilla indica el siguiente
paso. «Omitir paso» omite el paso y sus descendientes; «Cancelar plantilla»
conserva lo que haya en el editor. Mover, borrar, duplicar, pegar o restaurar
cancela la cola y lo anuncia. Teorema y demostración se añaden como hermanos.

«Guardar como plantilla» guarda una rama entera, incluidas opciones de imagen,
con «Nombre de la plantilla» y «Comando». «Guardar plantilla» confirma.
En «Mis plantillas», «Renombrar plantilla» cambia nombre y comando, y
«Borrar plantilla» la retira. La exportación de configuración incluye esta lista.

## Macros del documento

En «Datos del documento», abre «Macros del documento». Escribe el «Nombre» sin
barra, el «Número de argumentos» (0 a 9) y la «Definición» literal en una sola
línea. Por ejemplo, R con cero argumentos y definición \mathbb{R}. Para abs,
un argumento y definición \left|#1\right|. La vista previa muestra una llamada
de ejemplo y los errores aparecen junto a cada campo. «Guardar macro» la
incorpora; «Editar macro», «Borrar macro» y «Cancelar macro» permiten gestionarla.

Las macros se guardan con el documento en las versiones del proyecto y las sesiones recuperables.
Se definen con newcommand en el preámbulo y encabezan las sugerencias al escribir.
«Usar como mis macros predeterminadas» guarda una copia para documentos nuevos
sin borrador ni sesión pendiente. La exportación de configuración incluye esas
macros predeterminadas; importarla no sustituye las de un documento en curso.

## Comandos que solo entiende KaTeX

Un error katex-only indica que la vista previa acepta un comando que el
preámbulo de LaTeX no define. Por ejemplo, sustituye \R por \mathbb{R}, \infin
por \infty, \isin por \in o define una macro del documento. Los avisos sobre
\empty y \th indican que tienen otro significado en LaTeX: usa \emptyset para
el conjunto vacío. Al borrar una macro se actualizan la vista previa y los avisos.

## Distribución y acciones de los bloques

En pantallas de al menos 75 rem, el editor queda a la izquierda y la estructura
a la derecha. El editor tiene desplazamiento propio para llegar a sus controles.
En pantallas menores se usa una sola columna. «Datos del documento» se puede
plegar; su resumen muestra el título, curso y fecha. Al restaurar un documento
con título queda plegado y el foco puede volver a su resumen.

Las tarjetas mantienen «Editar» y «Añadir dentro» a la vista. Abre «Más acciones»
para duplicar, copiar, eliminar, subir, bajar, mover o guardar una plantilla.
Después de mover con sus botones, el desplegable del bloque destino se abre
para conservar el foco. «Atajos de teclado» incluye la prioridad de Tab,
Escape, navegación del menú, Retroceso y los comandos /.

## Barra de escritura en el teléfono

Con el teclado abierto, **Anterior** y **Siguiente** recorren los huecos del fragmento o mueven el cursor un comando, escape o grafema. **Símbolos** abre el tablero sobre la barra. Toca un símbolo para insertarlo, o **Cerrar** o Escape para recuperar la selección. **Añadir** guarda el bloque en curso. Las flechas recorren la barra con una sola parada de Tab.

## Menús contextuales

Toca **Menú** para elegir una acción de texto, fórmula o imagen. También puedes abrir **Menú general**, **Menú del bloque** o **Menú de contenido**. En Contenido, Menú o Mayús+F10 enfoca el primer sector. Usa flechas, Inicio, Fin e Intro. Escape vuelve un nivel. Una selección ocupa el primer argumento de un fragmento. **Ir a…** salta a otra sección. En preferencias puedes desactivar la vibración.
