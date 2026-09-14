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

1. Pulsa «Generar documento». La vista previa **solo cambia al pulsar este botón**,
   no mientras escribes: si no ves tu último cambio, es que no lo has pulsado.
2. Pulsa «Copiar código». Ya tienes el `.tex` entero en el portapapeles.
   - También puedes pulsar «Descargar .tex» y guardarlo como archivo. El nombre
     sale de tu título.
3. En Overleaf: *New Project → Blank Project*. Borra todo lo que traiga el editor,
   pega lo tuyo con `Ctrl+V` y pulsa *Recompile*.

Debería compilar a la primera. El documento es autocontenido: no necesitas añadir
ningún paquete ni subir ningún archivo extra.

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
| «Ejemplo» | `Ejemplo 1`. |
| «Nota» | `Nota 1`. |
| «Lista con viñetas» | Una lista de puntos. |
| «Lista numerada» | Una lista 1, 2, 3. |

Dos cosas que sorprenden la primera vez:

**En las listas, cada renglón es un punto.** Escribe un elemento por línea; no pongas
guiones ni números delante, la aplicación los añade. Las líneas vacías se ignoran.

**Cada tipo lleva su propia cuenta.** `Teorema 1`, `Teorema 2`… van por un lado y
`Definición 1`, `Definición 2`… por otro. Los números **no se reinician** en cada
apartado: siguen corridos hasta el final del documento. Es a propósito.

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

**Las ecuaciones no admiten nada dentro**, así que no ofrecen el botón. No es un
fallo: una fórmula con un párrafo dentro no compilaría.

### Los demás botones de cada bloque

- «Editar» abre el bloque en el formulario de arriba. Mientras editas, **Añadir
  bloque** pasa a llamarse **Guardar cambios**. Lo que haya dentro del bloque se
  conserva.
- «Subir» y «Bajar» lo mueven **solo entre sus iguales**, sin sacarlo de donde
  está. En los extremos el botón aparece apagado.
  - *Todavía no se puede* mover un bloque de un padre a otro. Hay que volver a
    crearlo en su sitio —o usar «Copiar bloque», sección siguiente—.
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

El panel «Símbolos matemáticos» inserta comandos en el campo «Contenido»,
**justo donde tengas el cursor**.

- Hay doce categorías: griegas, lógica, conjuntos, relaciones, topología, funciones y
  límites, derivadas, integrales, operadores, vectores y matrices, y estructura.
- El buscador acepta **el nombre en castellano** —“para todo”, “implica”,
  “conjunción”— y también el comando, si ya lo sabes (“forall”).
- Al elegir un símbolo verás su nombre y su comando antes de insertarlo.
- Si ya conoces el comando, escríbelo directamente. Es lo mismo.
- Todo se recorre con el teclado: flechas para moverte por la rejilla, `Inicio` y
  `Fin` para los extremos.

Los símbolos funcionan igual dentro y fuera de los bloques de ecuación. Dentro de un
párrafo normal, rodea la fórmula de `$…$` para que salga bien.

---

## 7. Guardar el trabajo

**No se guarda solo.** Pulsa «Guardar borrador» cuando quieras conservar lo que
llevas. Se guarda en este navegador y en este aparato, y así te lo dice el aviso.

- «Restaurar borrador» recupera lo último que guardaste. También entiende borradores
  de la versión anterior de la aplicación y te avisa cuando convierte uno.
- «Borrar borrador» pide confirmación y **no toca** lo que tengas en pantalla.

**Guarda un borrador antes de cerrar, y guarda el `.tex` en tu ordenador o en Overleaf
antes de terminar la sesión.** El borrador del navegador es una comodidad para seguir
mañana, no un sitio donde archivar. Se pierde si borras datos de navegación, y no
existe en ningún otro aparato tuyo.

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

Los seis casos que más aparecen, con lo que suele haberlos causado.

### “Falta un trozo de texto en el PDF, pero no hay ningún error”

Un **`%`** suelto. Ha comentado el resto de su renglón. Busca el `%` en esa frase y
ponle la barra: `\%`.

Es el único fallo silencioso de todos, y por eso va el primero.

### `Missing $ inserted`

Has usado fuera de una fórmula algo que solo existe dentro: casi siempre un **`_`**
o un **`^`**.

- Si querías el guion bajo impreso → `\_`.
- Si era un subíndice → rodéalo de `$…$`: `$x_1$`.

También sale cuando un **`$` se ha quedado sin pareja**: cuenta los de esa línea.

### `Undefined control sequence`

Overleaf no conoce ese comando. Dos motivos:

- **Está mal escrito.** `\mathbF{R}` en vez de `\mathbf{R}`. Overleaf te señala la línea.
- **Necesita un paquete que el documento no trae.** El documento incluye lo habitual
  de un curso de matemáticas —`amsmath`, `amssymb`, `amsthm`, español— y nada más. Si
  copiaste de un apunte que usaba `\mathscr`, TikZ o una macro propia de su autor,
  aquí no existe. Añade el paquete a mano en Overleaf, arriba del todo, o usa otro
  comando.

### `\begin{...} ended by \end{...}`

Un entorno abierto y no cerrado, o cerrado con otro nombre. Pasa al pegar media tabla
o medio `align` desde otro documento. Comprueba que cada `\begin{X}` tenga su
`\end{X}` con el mismo nombre.

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
