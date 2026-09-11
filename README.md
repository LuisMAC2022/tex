# Notas LaTeX

Aplicación web estática, sin dependencias de ejecución, para ordenar apuntes y exportarlos como un archivo LaTeX reproducible. Todo el trabajo —incluido el borrador versionado— permanece en el navegador del dispositivo; la aplicación no envía información a un servidor.

> **Alcance de la primera versión:** no interpreta, valida ni compila las matemáticas. Una ecuación se copia literalmente al `.tex`; la prueba automatizada compara cadenas `.tex`, no genera ni compara PDF.

## Especificación del documento generado

### Modelo de datos

El generador recibe un objeto con este contrato conceptual:

```js
{
  metadata: {
    title: "Título obligatorio",
    author: "opcional",
    course: "opcional",
    teacher: "opcional",
    date: "AAAA-MM-DD, opcional",
    topic: "Tema o unidad, opcional"
  },
  blocks: [
    { type: "text|definition|theorem|example|exercise|solution|equation", title: "opcional", content: "texto" }
  ]
}
```

- El **título de la nota** es el único campo obligatorio en la interfaz. Autor, curso, profesor y fecha son opcionales.
- El **tema o unidad** produce una `\section` cuando no está vacío.
- `blocks` es una lista ordenada. Su orden determina exactamente el orden del cuerpo del documento.
- Los bloques `definition`, `theorem`, `example`, `exercise` y `solution` se convierten en sus entornos homónimos; `text` es texto normal y, si tiene título, comienza con `\subsection`; `equation` queda delimitado por `\[` y `\]`.
- Los caracteres reservados `#`, `$`, `%`, `&`, `_`, `{`, `}`, `~`, `^` y `\` se escapan en metadatos, títulos y contenido textual. En cambio, el contenido de una **ecuación conserva literalmente la sintaxis escrita por el usuario**.
- Los saltos CRLF y CR se normalizan a LF. Las líneas vacías de un bloque textual conservan los párrafos. Los bloques sin contenido no se emiten.
- La plantilla `article` incluye solamente `fontenc` (salida latina copiable), `inputenc` (fuente UTF-8), `babel` (español), `amsmath` (matemáticas) y `amsthm` (entornos). El propio preámbulo documenta el motivo.
- El resultado termina siempre con un salto de línea y es determinista: el mismo estado produce exactamente la misma cadena.
- El nombre sugerido se deriva del título: minúsculas, sin diacríticos, grupos no alfanuméricos convertidos en guiones y extensión `.tex`. Si queda vacío, se usa **`notas-calculo-3.tex`**.

### Ejemplo completo de entrada

```json
{
  "metadata": {
    "title": "Notas de Cálculo III",
    "author": "Ana Pérez",
    "course": "Cálculo III",
    "teacher": "Dr. Ruiz",
    "date": "2026-09-11",
    "topic": "Integrales múltiples"
  },
  "blocks": [
    { "type": "definition", "title": "Integral doble", "content": "Sea f: A → R. La integral sobre A se escribe en la ecuación siguiente." },
    { "type": "equation", "title": "", "content": "\\iint_A f(x,y) \\, dx \\, dy" },
    { "type": "example", "title": "Rectángulo", "content": "Para f(x,y)=x+y en [0,1] \\times [0,2], calculamos el valor por iteración.\n\nEste bloque tiene dos párrafos y conserva el signo = como texto." },
    { "type": "exercise", "title": "Práctica #1", "content": "Calcula el área de A = [0,2] \\times [0,3]." },
    { "type": "solution", "title": "", "content": "El área es 2 \\times 3 = 6 unidades cuadradas." }
  ]
}
```

El archivo exacto producido es [`examples/calculo-3.tex`](examples/calculo-3.tex):

```tex
\documentclass[11pt]{article}
% fontenc genera PDF con caracteres latinos copiables.
\usepackage[T1]{fontenc}
% inputenc permite que el archivo fuente esté codificado en UTF-8.
\usepackage[utf8]{inputenc}
% babel adapta al español los nombres y la separación silábica.
\usepackage[spanish]{babel}
% amsmath proporciona los entornos matemáticos habituales.
\usepackage{amsmath}
% amsthm permite declarar teoremas y bloques relacionados.
\usepackage{amsthm}
\newtheorem{theorem}{Teorema}
\newtheorem{definition}{Definición}
\newtheorem{example}{Ejemplo}
\newtheorem{exercise}{Ejercicio}
\newenvironment{solution}{\par\noindent\textbf{Solución.} }{\hfill$\square$\par}

\title{Notas de Cálculo III}
\author{Ana Pérez \\ Cálculo III \\ Profesor: Dr. Ruiz}
\date{2026-09-11}

\begin{document}

\maketitle

\section{Integrales múltiples}

\begin{definition}[Integral doble]
Sea f: A → R. La integral sobre A se escribe en la ecuación siguiente.
\end{definition}

\[
\iint_A f(x,y) \, dx \, dy
\]

\begin{example}[Rectángulo]
Para f(x,y)=x+y en [0,1] \textbackslash{}times [0,2], calculamos el valor por iteración.

Este bloque tiene dos párrafos y conserva el signo = como texto.
\end{example}

\begin{exercise}[Práctica \#1]
Calcula el área de A = [0,2] \textbackslash{}times [0,3].
\end{exercise}

\begin{solution}
El área es 2 \textbackslash{}times 3 = 6 unidades cuadradas.
\end{solution}

\end{document}
```

## Uso

1. Abre el sitio mediante HTTP, completa los datos y añade cada bloque con el botón explícito.
2. Revisa o cambia el orden con **Editar**, **Eliminar**, **Subir** y **Bajar**. No hay arrastrar y soltar: los controles nativos funcionan con teclado y evitan otra dependencia.
3. Pulsa **Generar documento**; la vista previa solo cambia entonces, no con cada pulsación.
4. Copia o descarga el resultado. Si la API moderna del portapapeles no está disponible, se utiliza selección y copia del `textarea` como alternativa.
5. **Guardar borrador** escribe bajo demanda `{ version: 1, metadata, blocks }` en `localStorage` con la clave `tex-notes:draft:v1`. Restaurar tolera datos ausentes o corruptos. Borrar pide confirmación y nunca borra el formulario abierto.

### Servidor HTTP local

Desde la raíz del repositorio, utiliza una de estas opciones y visita la URL indicada:

```sh
python3 -m http.server 8000
# http://localhost:8000/
```

También sirve `npx serve .`, si ya se dispone de esa herramienta. Abrir `index.html` directamente puede limitar el portapapeles o los módulos ES en algunos navegadores; por eso se recomienda HTTP.

### GitHub Pages

El flujo [`.github/workflows/pages.yml`](.github/workflows/pages.yml) prueba y publica el contenido estático al recibir cambios en `main`, usando solo acciones oficiales. En **Settings → Pages → Build and deployment**, selecciona **GitHub Actions** y ejecuta el flujo o envía cambios a `main`. Todas las rutas del sitio son relativas, por lo que funciona tanto en un dominio raíz como en una subruta de proyecto.

## Accesibilidad y diseño

La interfaz sigue semántica HTML nativa: un único `main` y `h1`, secciones tituladas, `form`/`fieldset`, lista ordenada y botones reales. Incluye enlace de salto visible al foco, encabezados sin saltos, etiquetas visibles enlazadas por `for`/`id`, ayudas mediante `aria-describedby` solo donde aportan contexto, errores junto al campo y regiones `aria-live` para resultados. El orden DOM coincide con el visual.

El foco tiene contorno contrastado y no depende del color; los mensajes contienen texto explícito. Los colores están diseñados para contraste AA, incluidos temas claro y oscuro. Objetivos de al menos 44 px, cuadrícula fluida, ausencia de anchos fijos y adaptación bajo 608 px permiten uso desde unos 320 px y zoom al 200 %. No se introducen animaciones; aun así, `prefers-reduced-motion` neutraliza cualquier transición futura. No hay fuentes, iconos, frameworks ni recursos remotos.

### Revisión manual

- [ ] Recorrer toda la página con `Tab` y `Shift+Tab`, activar acciones con teclado y comprobar que no hay trampas.
- [ ] Activar el enlace de salto y verificar un foco visible en todos los controles.
- [ ] Crear dos tipos de bloque, editarlos, eliminarlos y moverlos, comprobando dónde queda el foco.
- [ ] Revisar con lector de pantalla que el orden anunciado coincide con el visual y que etiquetas, instrucciones, errores y títulos son comprensibles.
- [ ] Confirmar que altas, movimientos, borrados, generación, copia, descarga y borrador se anuncian dinámicamente y no solo mediante color.
- [ ] Forzar un título vacío y un bloque vacío; confirmar error escrito, `aria-invalid` y foco en el campo.
- [ ] Probar zoom al 200 %, 320 CSS px y orientación móvil sin pérdida de contenido ni desplazamiento horizontal de la interfaz.
- [ ] Comprobar contraste de texto, controles, foco, errores y estados en temas claro y oscuro con una herramienta WCAG 2.1 AA.
- [ ] Usar `prefers-reduced-motion: reduce` y verificar que no aparece movimiento inesperado.
- [ ] Guardar, recargar, restaurar y borrar un borrador; probar también una entrada corrupta en `localStorage`.
- [ ] Denegar permiso del portapapeles y confirmar que un fallo conserva el resultado y comunica una alternativa.

## Pruebas automatizadas

Requieren Node.js 20 o posterior, sin instalar paquetes:

```sh
npm test
npm run check:js
```

`npm test` comprueba estructura HTML esencial y asociaciones de etiquetas, rutas relativas e internas, caracteres reservados, títulos y bloques vacíos, varios párrafos, ecuaciones multilínea, nombres de archivo y equivalencia byte a byte con `examples/calculo-3.tex`. `npm run check:js` analiza la sintaxis de todos los módulos. La compilación de LaTeX queda deliberadamente fuera del flujo: se comparan cadenas `.tex`, no PDF compilados.

## Hitos

Cada hito es independiente y desplegable:

<details><summary><strong>1. Especificación</strong>: modelo de datos y archivo <code>.tex</code> de referencia</summary>

Contrato documentado, transformación definida y `examples/calculo-3.tex` comprobado byte a byte.
</details>
<details><summary><strong>2. Editor mínimo</strong>: formulario y lista ordenada de bloques</summary>

Metadatos, editor progresivo y acciones nativas de edición, eliminación y orden.
</details>
<details><summary><strong>3. Generación</strong>: transformación determinista y vista previa</summary>

Funciones puras, escapado contextual y salida de solo lectura bajo demanda.
</details>
<details><summary><strong>4. Exportación</strong>: copia y descarga</summary>

Portapapeles con alternativa, Blob local, nombre portable y revocación de URL.
</details>
<details><summary><strong>5. Calidad</strong>: accesibilidad, diseño responsive y validaciones</summary>

Semántica, errores accesibles, foco persistente, contraste, temas y pruebas ligeras.
</details>
<details><summary><strong>6. Persistencia</strong>: borrador local versionado</summary>

Guardado explícito, restauración defensiva y borrado confirmado en `localStorage`.
</details>
<details><summary><strong>7. Publicación</strong>: despliegue automatizado en GitHub Pages</summary>

Flujo oficial que prueba y publica el sitio estático desde `main`.
</details>

## Criterio de finalización del MVP

El MVP está terminado cuando una persona puede, usando solamente el teclado, crear una nota con al menos dos tipos de bloque, revisar el código generado, copiarlo, descargarlo, recargar la página y recuperar el borrador.

Quedan expresamente para iteraciones posteriores: plantillas múltiples, macros personalizadas, importación de `.tex`, vista previa matemática, historial de documentos y compilación.
