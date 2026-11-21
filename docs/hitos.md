# Hitos

Cada hito es independiente y desplegable:

<details><summary><strong>1. Especificación</strong>: modelo de datos y archivo <code>.tex</code> de referencia</summary>

Contrato documentado, transformación definida y `examples/calculo-3.tex` comprobado byte a byte.
</details>
<details><summary><strong>2. Editor mínimo</strong>: formulario y lista ordenada de bloques</summary>

Metadatos, editor progresivo y acciones nativas de edición, eliminación y orden.
</details>
<details><summary><strong>3. Generación</strong>: transformación determinista y vista previa</summary>

Funciones puras, contenido literal frente a metadatos escapados, y salida de solo lectura bajo demanda.
</details>
<details><summary><strong>4. Exportación</strong>: copia y descarga</summary>

Portapapeles con alternativa, Blob local, nombre portable y revocación de URL.
</details>
<details><summary><strong>5. Calidad</strong>: accesibilidad, diseño responsive y validaciones</summary>

Semántica, errores accesibles, foco persistente, contraste, temas y pruebas ligeras.
</details>
<details><summary><strong>6. Persistencia</strong>: borrador local versionado</summary>

Guardado explícito, restauración defensiva y borrado confirmado en `localStorage`. Es un borrador de trabajo del propio dispositivo, no una copia maestra: la copia maestra está en Overleaf.
</details>
<details><summary><strong>7. Publicación</strong>: despliegue automatizado en GitHub Pages</summary>

Flujo oficial que prueba y publica el sitio estático desde `main`.
</details>
<details><summary><strong>8. Entrada matemática</strong>: tablero de símbolos y proposiciones</summary>

Catálogo estático sin dependencias, inserción accesible en la posición del cursor, entorno `proposition` con contador propio y separación explícita entre texto, matemática en línea y matemática destacada.
</details>

<details><summary><strong>9. Texto mixto y estructura anidada</strong>: fórmulas dentro de la prosa y bloques dentro de bloques</summary>

Contenido entregado tal cual —comandos, llaves y matemática delimitada— con el escapado reservado a metadatos y títulos; árbol de bloques con rutas estables y operaciones puras, incluidas duplicar y copiar; generación recursiva, editor accesible con nivel y padre explícitos, y borrador `version: 2` que migra el plano anterior.
</details>

<details><summary><strong>10. Vista previa matemática</strong></summary>

KaTeX local con MathML, representación bajo el editor y en cada bloque, y avisos que permiten seguir exportando el `.tex`.
</details>

<details><summary><strong>11. Tablero de símbolos por teclado</strong></summary>

Acceso directo al buscador, navegación entre resultados y categorías, retorno al campo de origen y doce símbolos recientes.
</details>

<details><summary><strong>12. Imágenes en el documento</strong></summary>

Miniatura local, edición de tamaño y alineación, giro y exportación con `graphicx` en la raíz y en bloques anidados.
</details>

<details><summary><strong>13. Listas anidadas por sangría</strong></summary>

Viñetas y numeración combinadas en un bloque, atajos, continuación con Intro y vista previa con KaTeX.
</details>

<details><summary><strong>14. Comprobación previa a Overleaf</strong></summary>

Avisos con línea y columna, recuento por bloque y enlaces al editor al generar el documento.
</details>

<details><summary><strong>15. Traslado de bloques entre padres</strong></summary>

Diálogo con destinos válidos para mover una rama completa y enfocar su nueva posición.
</details>

## Hito 16 — Captura sin fricción

Ctrl+Intro, foco continuo, ayuda plegable, acciones antes del tablero, ediciones
con deshacer nativo, caché de vistas previas y recuperación de sesión en curso.

## Hito 17 — Autocierre y contexto matemático

Contexto de escritura con comentarios y argumentos textuales; pares, exponentes,
selecciones, salto de cierre, Retroceso y cierre de entornos con preferencia local.

## Hito 18 — Sugerencias, huecos y alias

Menú accesible único junto al cursor, clasificación por comandos y términos en
español, historial con decaimiento, huecos, alias con Tab y configuración portátil.

## Hito 19 — Comandos /, Demostración y plantillas

Tipos y títulos desde el contenido vacío, proof predefinido, once plantillas de
Cálculo III por pasos y captura de ramas personales con configuración portátil.
