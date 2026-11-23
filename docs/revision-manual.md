# Revisión manual

Procedimiento que se ejecuta a mano, porque `app.js` no tiene pruebas
automatizadas: no hay DOM en el entorno de pruebas y no se añaden dependencias
para tenerlo ([DEC-007](../decisiones/DEC-007-sin-dom-en-pruebas.md)). Se recorre
por ronda de revisión, no al cambiar código.

- [ ] Recorrer toda la página con `Tab` y `Shift+Tab`, activar acciones con teclado y comprobar que no hay trampas.
- [ ] Activar el enlace de salto y verificar un foco visible en todos los controles.
- [ ] Crear dos tipos de bloque, editarlos, eliminarlos y moverlos, comprobando dónde queda el foco.
- [ ] Construir un árbol de al menos tres niveles solo con teclado: añadir en la raíz, usar **Añadir dentro** dos veces y comprobar que el texto del formulario dice en todo momento dónde caerá el bloque.
- [ ] En ese árbol, editar, subir, bajar y eliminar nodos de cada nivel; confirmar que **Subir** y **Bajar** nunca sacan un bloque de su nivel y que el foco queda donde se espera tras cada acción.
- [ ] Abrir «Mover a…» con teclado desde un bloque con hijos. Verificar que el diálogo enfoca «Destino» y omite el bloque de origen, sus descendientes y los tipos que no aceptan hijos. Cerrar con `Escape` y con «Cancelar» y comprobar que ambos devuelven el foco al botón de origen.
- [ ] Mover la rama a un contenedor posterior con «Al principio» y devolverla a «Raíz del documento» con «Al final». Confirmar que conserva sus hijos, el foco va a «Editar» en la ruta nueva y el lector de pantalla anuncia ambas rutas. Repetir con una edición en curso y verificar que se cancela.
- [ ] Eliminar un bloque con descendencia y comprobar el aviso con el número de bloques anidados.
- [ ] Comprobar con lector de pantalla que se anuncian el nivel y el bloque padre, y que la lista anidada se lee como tal.
- [ ] Intentar cambiar a **Ecuación destacada** un bloque que ya tiene hijos y confirmar que el error se explica junto al campo.
- [ ] Escribir en el contenido `\textbf{x}`, llaves sueltas, `50%`, `&`, `_`, `$…$` y un `$` sin pareja; generar y confirmar que el `.tex` los reproduce sin añadir ni un solo escape.
- [ ] Duplicar con teclado una hoja y una rama de tres niveles; editar la copia y confirmar que el original no cambia.
- [ ] Copiar un bloque a la bandeja y pegarlo en la raíz y dentro de otro bloque; comprobar el resumen visible de la bandeja, el anuncio con la ruta nueva y dónde queda el foco.
- [ ] Usar **Copiar texto** y pegar fuera de la aplicación; denegar el permiso del portapapeles y confirmar que el mensaje ofrece la alternativa.
- [ ] Comprobar con lector de pantalla que **Duplicar**, **Copiar bloque**, **Copiar texto** y **Pegar bloque** se distinguen entre sí y de **Copiar código**, y que cada uno nombra su bloque, nivel y padre.
- [ ] Medir el muelle completo: como máximo 320 px a 1280×800 y 400 px a 390×844; confirmar que el `textarea` permanece visible al usarlo.
- [ ] Recorrer categorías y rejilla con teclado. Verificar una sola parada en la rejilla, flechas horizontales circulares, desplazamiento vertical por filas, Inicio/Fin y salida hacia «Añadir bloque».
- [ ] Insertar comandos y plantillas con y sin selección; confirmar la posición del cursor y que el foco vuelve al contenido.
- [ ] Buscar en todo el catálogo y borrar la consulta; comprobar contador, ausencia de resultados y restauración de la categoría elegida.
- [ ] Con teclado español en Windows y NVDA, y en macOS con VoiceOver, plegar el tablero, seleccionar texto hacia atrás en «Contenido» y abrirlo con Alt+Mayús+S o ⌥⇧S. Confirmar el anuncio de categoría y recuento y el foco en el buscador con su texto seleccionado. Salir con el mismo atajo y verificar el foco y la selección originales. En Windows, comprobar que las combinaciones de AltGr siguen escribiendo en el campo.
- [ ] Buscar `integral`, pulsar ↓ y ↑, y escribir desde la rejilla para continuar la consulta. Probar dos pulsaciones de Escape desde una consulta con texto y una desde la rejilla. Insertar con Intro desde el buscador y con Intro, Espacio y clic desde la rejilla. Comprobar el foco y la posición del cursor desde «Contenido», «Título del bloque (opcional)» y «Tipo de bloque».
- [ ] Usar Re Pág y Av Pág para recorrer categorías, incluida **Recientes** vacía. El foco debe quedar en la rejilla y solo la categoría activa debe anunciarse como pulsada. Insertar más de doce símbolos, repetir uno y recargar. Confirmar que aparecen los doce más recientes sin repetir y que el historial de la pestaña funciona si el almacenamiento no está disponible.
- [ ] Comprobar a 320 CSS px que no hay desplazamiento horizontal y que cada botón conserva al menos 44 × 44 px y foco visible.
- [ ] Revisar con lector de pantalla que el orden anunciado coincide con el visual y que etiquetas, instrucciones, errores y títulos son comprensibles.
- [ ] Confirmar que altas, movimientos, borrados, generación, copia, descarga y guardado de versiones se anuncian dinámicamente y no solo mediante color.
- [ ] Forzar un título vacío y un bloque vacío; confirmar error escrito, `aria-invalid` y foco en el campo.
- [ ] Probar zoom al 200 %, 320 CSS px y orientación móvil sin pérdida de contenido ni desplazamiento horizontal de la interfaz, con un bloque de tercer nivel a la vista.
- [ ] Comprobar contraste de texto, controles, foco, errores y estados en temas claro y oscuro con una herramienta WCAG 2.1 AA.
- [ ] Usar `prefers-reduced-motion: reduce` y verificar que no aparece movimiento inesperado.
- [ ] Guardar, recargar, restaurar y eliminar una versión de un árbol de varios niveles; probar también una entrada corrupta y un borrador plano `version: 1` para comprobar la migración y su anuncio.
- [ ] Denegar permiso del portapapeles y confirmar que un fallo conserva el resultado y comunica una alternativa.
- [ ] Generar, añadir un bloque y cambiar el título sin volver a generar; usar «Copiar código» y «Descargar .tex» y confirmar que ambos llevan el bloque y el título nuevos. Sin título, ninguno exporta y el foco va al título.
- [ ] Abrir `index.html` por doble clic (`file://`) y confirmar que se añaden bloques, se genera, se copia y se descarga sin errores en consola.
- [ ] Con `file://` y sin conexión, verificar que las fuentes matemáticas cargan y que la vista previa es legible en ambos temas.
- [ ] Previsualizar `$x \in \mathbb{R}$` en prosa y una ecuación destacada con el teclado. El foco debe permanecer en el editor.
- [ ] Escribir una fórmula incompleta, comprobar **No se pudo previsualizar** y generar el archivo `.tex`.
- [ ] Escribir `50% del total` y `x_1` en un bloque de texto. Comprobar que aparecen después de una pausa dos avisos con línea y columna. Verificar con lector de pantalla que la comprobación no anuncia cada tecla.
- [ ] Guardar ese bloque como hijo de otro, comprobar la insignia **2 avisos** y generar. Activar con Intro **Ir al bloque 1.1** si esa es la ruta del hijo. Comprobar el foco en **Editar** y que el código incluye literalmente `50% del total` y `x_1`.
- [ ] Guardar una corrección, comprobar que se retira el resumen anterior y volver a generar. Verificar que el recuento se actualiza y que el nuevo enlace lleva al bloque correcto.
- [ ] En «Lista con viñetas», escribir una lista de tres niveles que combine viñetas, numeración y una fórmula. Usar solo el teclado y un lector de pantalla. Confirmar que lee los niveles y que **Sangrar**, **Quitar sangría**, Intro y Escape conservan el foco esperado.
- [ ] Probar Alt+Mayús+G y Alt+Mayús+Q con una selección de varias líneas en Chromium y Firefox. Confirmar que no cambia la página y que Tab sale del campo. En macOS, usar ⌥⇧G y ⌥⇧Q y comprobar que ⌥⇧← y ⌥⇧→ siguen seleccionando por palabras.
- [ ] Superar el límite de anidación en una lista y comprobar que se muestra el aviso y se conservan los elementos. Compilar en Overleaf la lista mixta de tres niveles y una lista al límite.
- [ ] Pegar en un proyecto vacío de Overleaf un `.tex` con texto mixto y entornos anidados, y comprobar que compila sin añadir paquetes.
- [ ] Compilar con una bibliografía y comprobar que cada referencia aparece numerada entre corchetes.
- [ ] Seleccionar **Imagen** y pulsar **Añadir bloque** con la ruta vacía. Comprobar el error junto a **Archivo de imagen** y el foco. Probar una ruta con espacios y extensión `.GIF` en mayúsculas y comprobar que se muestran avisos y se puede guardar.
- [ ] Elegir un PNG local, comprobar la miniatura en el editor y la estructura, seleccionar **Mediana** y pulsar **Girar 90°**. Editar el bloque y comprobar que recupera la ruta, el 60 %, el giro y las demás opciones. Guardar una versión, recargar y restaurar para comprobar que ahora se muestra la ruta con sus ajustes.
- [ ] Subir un PNG a Overleaf con el nombre indicado en la ruta. Compilar un documento con una imagen raíz, otra girada y otra dentro de un teorema. Confirmar el giro, el pie escapado y la posición de la imagen anidada.

## Captura rápida: P1

- [ ] Intro en título pasa al contenido y no genera; en campos de imagen no envía.
- [ ] Ctrl+Intro añade desde cualquier control; ⌘+Intro en macOS.
- [ ] El foco queda en Contenido o Archivo de imagen después de añadir.
- [ ] Ctrl+Z deshace una inserción del tablero y una edición de lista.
- [ ] Cerrar y recuperar conserva el bloque en curso, la selección de destino y las opciones de imagen.
- [ ] Escribir sin recuperar conserva la sesión anterior en la clave de respaldo.

## Captura rápida: P2

- [ ] En Windows latinoamericano escribir barra con AltGr, llaves, corchetes, ^, ~, á y ñ en prosa y fórmulas. Repetir con teclado EE. UU.
- [ ] AltGr nunca activa Ctrl+Intro; verificar la preferencia de autocierre apagada.
- [ ] Ctrl+Z tras autocierre, salto, Retroceso en par vacío y apertura de entorno con Intro.
- [ ] Salir del par, perder foco y cargar otro bloque descartan cierres pendientes.

## Captura rápida: P3

- [ ] NVDA anuncia el recuento al abrir sugerencias y cada opción activa.
- [ ] Tab sin menú, huecos, cierres ni alias sale de Contenido; Escape termina los huecos.
- [ ] Ctrl+Z devuelve el disparador después de un alias y deshace una sugerencia aceptada.
- [ ] Tocar una opción mantiene el foco en el campo; el menú cabe a 320 px en ambos temas.
- [ ] Exportar e importar entre dos navegadores conserva los alias y la preferencia.

## Captura rápida: P4

- [ ] Simular diez bloques con /teo Título, /ec y /lista, confirmando con Ctrl+Intro y manteniendo el foco en Contenido.
- [ ] Completar ejres, repetir omitiendo un paso y repetir moviendo un bloque para cancelar la cola.
- [ ] /img muestra opciones y enfoca Archivo de imagen; /dem admite un título que sustituye al encabezado.
- [ ] Guardar una rama con imagen como plantilla y reutilizarla; renombrar, exportar e importar.

## Captura rápida: P5

- [ ] Definir R, usarla en una fórmula, generar y compilar en Overleaf. Borrar la macro y comprobar el error katex-only.
- [ ] Migrar un borrador v3 a una versión conserva sus macros. Un v2 se migra con lista vacía.
- [ ] Guardar predeterminadas y comenzar sin borrador ni autoguardado las carga; no sustituyen las de un documento abierto.
- [ ] Cambiar una macro actualiza tanto el editor como las vistas previas de todos los bloques.

## Captura rápida: P6 y revisión completa

- [ ] A 1366 × 768, editor fijo y estructura paralela; alcanzar la parte inferior del editor con su propio desplazamiento.
- [ ] A 320 px y con zoom al 200 %, no hay desplazamiento horizontal de la página y el menú se puede tocar.
- [ ] Revisar contraste, foco visible y objetivos de 44 × 44 px en temas claro y oscuro.
- [ ] Subir, Bajar y Duplicar conservan el foco; el desplegable de destino se abre si hace falta.
- [ ] Con distribuciones latinoamericana y EE. UU. instaladas en Windows, probar Alt+Mayús+S, G y Q y anotar en claude.md si cambian la distribución.
- [ ] Ctrl+Z inmediatamente tras: tablero, autocierre, salto de cierre, Retroceso en par, sugerencia, alias, edición en hueco, begin con Intro, continuación de lista y sangría. Comprobar el alcance de cada deshacer.
- [ ] Cerrar la pestaña con un bloque a medias y recuperar; empezar a escribir sin recuperar y verificar autosave:previous.
- [ ] Con NVDA comprobar opciones activas, recuento del menú y salida nativa con Tab cuando no hay nada pendiente.

## Android

Con la rama de trabajo en el portátil, ejecuta `python3 -m http.server 8000` desde la raíz. Con depuración USB habilitada y `adb reverse tcp:8000 tcp:8000`, abre `http://localhost:8000/` y la página `diagnostico/android.html` en Chrome. `chrome://inspect` permite observar la consola. En la misma Wi-Fi se puede abrir `http://IP-del-portátil:8000/`, donde el portapapeles y el almacenamiento persistente pueden estar restringidos. Pages sirve `main` tras la fusión.

- [ ] En Gboard, registrar escritura, autocierre, sugerencias y borrado. Probar la pulsación larga en campo y tarjeta, las dos ventanas y las capacidades. Pegar el JSON en [resultados de Android](../diagnostico/resultados-android.md).
- [ ] Verificar que la barra queda sobre Gboard al abrirlo, cerrarlo y girar el teléfono. Tocar Anterior, Siguiente, un símbolo y Añadir con selección hacia atrás. Comprobar foco, teclado abierto y anuncio de la barra con TalkBack.
- [ ] Probar en Android la pulsación larga de 400 ms en tarjeta y zona vacía, el arrastre con una mano, los abanicos, la vibración y el zoom con dos dedos. TalkBack debe anunciar cada menú y devolver el foco. Confirmar que se conserva la selección de Gboard dentro del campo.
- [ ] En escritorio abrir los cuatro contextos por clic y por teclado, volver del submenú y compilar los fragmentos y el enlace en Overleaf.
- [ ] Mover una rama, editarla y duplicarla. Verificar el foco en el mismo bloque tras mover y en la copia tras duplicar, también con TalkBack.
- [ ] Guardar una versión en Chrome Android, cerrar el navegador y restaurarla después. Comprobar persistencia concedida o denegada y espacio usado. Exportar a JSON, transferir al portátil, importar y volver a Android. Comparar bloques movidos, macros y líneas. Recuperar el respaldo anterior a una importación y probar deshacer/rehacer con TalkBack.
- [ ] Con Gboard y TalkBack, seleccionar una palabra, una fracción anidada y una celda de matriz con Anterior/Siguiente. Reducir hasta recuperar una selección hacia atrás. Envolver con Menú → Fracción, escribir el denominador y deshacer.
- [ ] En Chrome Android, Firefox y Safari, descargar el proyecto, abrir el JSON guardado y volver a importarlo desde el selector de archivos. Comprobar nombre, título, macros y versiones después del traslado.

## Destinos del documento

- En Overleaf, compilar dos veces teoremas, ecuaciones y figuras etiquetadas. Comparar el PDF con los números que muestra el menú, también después de mover una rama.
- En Android con Gboard, abrir las sugerencias con `\ref{` y mediante **Referir**. Con TalkBack y NVDA, comprobar el nombre del campo, el prefijo, sus errores y el retorno al editor.

## Citas y bibliografía

- En Overleaf, compilar dos veces en IEEE un documento con teoremas, ecuaciones, figuras y las ocho referencias del curso. Comparar los números del menú con el PDF. Cambiar a APA sin editar el contenido y repetir la compilación.
- En Android con Gboard, probar `\citep{`, `\ref{` y la selección de otra clave después de una coma. Abrir también **Citar** y **Referir** desde la barra y comprobar el foco con el teclado desplegado.
- Con TalkBack en Android y NVDA en escritorio, recorrer el panel, provocar un error por campo y seguirlo desde el resumen. Comprobar el anuncio de clave bloqueada, la cantidad de citas al eliminar y el foco al cancelar o convertir.
