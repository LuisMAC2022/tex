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
- [ ] Eliminar un bloque con descendencia y comprobar el aviso con el número de bloques anidados.
- [ ] Comprobar con lector de pantalla que se anuncian el nivel y el bloque padre, y que la lista anidada se lee como tal.
- [ ] Intentar cambiar a **Ecuación destacada** un bloque que ya tiene hijos y confirmar que el error se explica junto al campo.
- [ ] Escribir en el contenido `\textbf{x}`, llaves sueltas, `50%`, `&`, `_`, `$…$` y un `$` sin pareja; generar y confirmar que el `.tex` los reproduce sin añadir ni un solo escape.
- [ ] Duplicar con teclado una hoja y una rama de tres niveles; editar la copia y confirmar que el original no cambia.
- [ ] Copiar un bloque a la bandeja y pegarlo en la raíz y dentro de otro bloque; comprobar el resumen visible de la bandeja, el anuncio con la ruta nueva y dónde queda el foco.
- [ ] Usar **Copiar texto** y pegar fuera de la aplicación; denegar el permiso del portapapeles y confirmar que el mensaje ofrece la alternativa.
- [ ] Comprobar con lector de pantalla que **Duplicar**, **Copiar bloque**, **Copiar texto** y **Pegar bloque** se distinguen entre sí y de **Copiar código**, y que cada uno nombra su bloque, nivel y padre.
- [ ] Medir el muelle completo: como máximo 320 px a 1280×800 y 400 px a 390×844; confirmar que el `textarea` permanece visible al usarlo.
- [ ] Recorrer categorías y rejilla con teclado: una sola parada en la rejilla, flechas izquierda/derecha circulares, Inicio/Fin, y salida directa hacia «Añadir bloque».
- [ ] Insertar comandos y plantillas con y sin selección; confirmar la posición del cursor y que el foco vuelve al contenido.
- [ ] Buscar en todo el catálogo y borrar la consulta; comprobar contador, ausencia de resultados y restauración de la categoría elegida.
- [ ] Comprobar a 320 CSS px que no hay desplazamiento horizontal y que cada botón conserva al menos 44 × 44 px y foco visible.
- [ ] Revisar con lector de pantalla que el orden anunciado coincide con el visual y que etiquetas, instrucciones, errores y títulos son comprensibles.
- [ ] Confirmar que altas, movimientos, borrados, generación, copia, descarga y borrador se anuncian dinámicamente y no solo mediante color.
- [ ] Forzar un título vacío y un bloque vacío; confirmar error escrito, `aria-invalid` y foco en el campo.
- [ ] Probar zoom al 200 %, 320 CSS px y orientación móvil sin pérdida de contenido ni desplazamiento horizontal de la interfaz, con un bloque de tercer nivel a la vista.
- [ ] Comprobar contraste de texto, controles, foco, errores y estados en temas claro y oscuro con una herramienta WCAG 2.1 AA.
- [ ] Usar `prefers-reduced-motion: reduce` y verificar que no aparece movimiento inesperado.
- [ ] Guardar, recargar, restaurar y borrar un borrador de un árbol de varios niveles; probar también una entrada corrupta y un borrador plano `version: 1` para comprobar la migración y su anuncio.
- [ ] Denegar permiso del portapapeles y confirmar que un fallo conserva el resultado y comunica una alternativa.
- [ ] Abrir `index.html` por doble clic (`file://`) y confirmar que se añaden bloques, se genera, se copia y se descarga sin errores en consola.
- [ ] Pegar en un proyecto vacío de Overleaf un `.tex` con texto mixto y entornos anidados, y comprobar que compila sin añadir paquetes.
