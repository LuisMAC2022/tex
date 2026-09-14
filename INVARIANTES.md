# Invariantes

Reglas que valen para todo el repositorio y que **alguien vigila**. Esta es la
única capa que se lee siempre, antes de tocar cualquier archivo.

La condición de entrada es mecánica, no de importancia: **una invariante sin
guardián no entra aquí.** Si no puedes nombrar el archivo y la afirmación que
fallan cuando la regla se viola, lo que tienes es una justificación y su lugar
es `decisiones/`, o un rasgo del sistema y su lugar es el README.

Formato de cada entrada, que `tests/invariantes.test.js` comprueba:

```
### INV-NNN — enunciado en una línea
Guardián: `ruta/al/archivo` → "la afirmación, copiada LITERALMENTE del código"
```

La afirmación se copia tal como está escrita en el archivo fuente, con sus
barras invertidas dobles si las tiene. La prueba la busca como subcadena: si
alguien la renombra o la borra, la invariante se queda sin vigilancia y falla
aquí, no dentro de seis meses.

---

### INV-001 — La exportación es de ida: no existe reimportación desde el `.tex`
Guardián: `tests/generator.test.js` → "el documento es autocontenido y no lleva sobre de reimportación"

Overleaf es la copia maestra. Por qué: [DEC-001](decisiones/DEC-001-overleaf-copia-maestra.md),
[DEC-003](decisiones/DEC-003-sin-reimportacion.md).

### INV-002 — El contenido de un bloque llega al `.tex` sin un solo escape
Guardián: `tests/content-literal.test.js` → "ningún carácter reservado se escapa en el contenido"

Por qué: [DEC-004](decisiones/DEC-004-contenido-sin-escapar.md).

### INV-003 — Los metadatos y los títulos se escapan por completo
Guardián: `tests/content-literal.test.js` → "los metadatos y los títulos conservan el escapado completo, barra y llaves incluidas"

Es la contraparte de INV-002 y se rompe en la misma dirección: son dos
funciones distintas, `contentToLatex()` y `escapeMetadata()`.
Por qué: [DEC-004](decisiones/DEC-004-contenido-sin-escapar.md).

### INV-004 — El navegador carga scripts clásicos, nunca módulos ES
Guardián: `tests/check-site.mjs` → "los scripts no deben ser módulos ES"
Guardián: `tests/check-site.mjs` → "faltan scripts o el orden de carga es incorrecto"

Con `file://` un módulo no se descarga y la interfaz queda inerte.
Por qué: [DEC-002](decisiones/DEC-002-scripts-clasicos.md).

### INV-005 — `block-types.js` es la única fuente de verdad de los tipos de bloque
Guardián: `tests/generator.test.js` → "las opciones de index.html coinciden con la tabla de tipos"
Guardián: `tests/generator.test.js` → "el preámbulo deriva un \\newtheorem por cada tipo declarado"

Añadir un tipo es una entrada en la tabla y su `<option>`; el preámbulo se
deriva. Por qué: [DEC-005](decisiones/DEC-005-tabla-unica-de-tipos.md).

### INV-006 — Ni el sitio ni el proyecto cargan nada remoto
Guardián: `tests/invariantes.test.js` → "INV-006: ni el sitio ni el proyecto cargan nada remoto"

Sin CDN, sin fuentes, sin iconos, sin `dependencies` ni `devDependencies`. La
aplicación funciona abierta por doble clic y sin red.

### INV-007 — Todas las rutas del sitio son relativas
Guardián: `tests/check-site.mjs` → "Las rutas internas no deben partir de la raíz"

Para servir igual en un dominio raíz y en una subruta de proyecto de Pages.

### INV-008 — La generación es determinista y hay un archivo de referencia exacto
Guardián: `tests/generator.test.js` → "el ejemplo genera exactamente el archivo de referencia"

El mismo estado produce la misma cadena, byte a byte. Cuando el formato cambia
a propósito, se regenera con `npm run build:example` y el diff del `.tex` es la
prueba visible de qué cambió.
