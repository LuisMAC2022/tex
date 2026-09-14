import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { BLOCK_TYPES } from "../assets/js/block-types.js";
import { blockToLatex } from "../assets/js/latex-generator.js";

const html = await readFile("index.html", "utf8");
assert.match(html, /^<!doctype html>/i, "Falta doctype");
assert.equal((html.match(/<main\b/g) || []).length, 1, "Debe existir un único main");
assert.equal((html.match(/<h1\b/g) || []).length, 1, "Debe existir un único h1");
assert.match(html, /href="#contenido-principal"/, "Falta el enlace de salto");
assert.match(html, /<script type="module" src="assets\/js\/app\.js"><\/script>/, "app.js debe ser un módulo relativo");
assert.match(html, /<input id="import-tex"[^>]+type="file"[^>]+accept="\.tex,text\/x-tex"[^>]+aria-describedby="import-help">/, "La importación debe limitar y describir el archivo");
assert.doesNotMatch(html, /(?:src|href)="\/(?!\/)/, "Las rutas internas no deben partir de la raíz");
const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
for (const match of html.matchAll(/<label\s+for="([^"]+)"/g)) assert(ids.has(match[1]), `label apunta a id inexistente: ${match[1]}`);
for (const match of html.matchAll(/(?:src|href)="((?:assets|examples)\/[^"#]+)"/g)) await access(match[1]);

// El selector, las etiquetas y el generador provienen del mismo catálogo de tipos.
const select = html.match(/<select id="block-type"[^>]*>([\s\S]*?)<\/select>/);
assert(select, "Falta el selector de tipo de bloque");
const options = [...select[1].matchAll(/<option value="([^"]+)">([^<]+)<\/option>/g)].map(([, value, label]) => ({ value, label }));
assert.deepEqual(options, BLOCK_TYPES.map(({ value, label }) => ({ value, label })), "El selector y el catálogo de tipos divergen");
for (const { value } of options) {
  const latex = blockToLatex({ type: value, title: "Título", content: "Contenido de prueba" });
  assert(latex, `El generador no produce salida para el tipo «${value}»`);
}

// Tablero de símbolos: plegable, buscable y con un contenedor propio para los grupos.
assert.match(html, /<details id="symbol-details">\s*<summary><h3 id="simbolos-heading">Símbolos matemáticos<\/h3><\/summary>/, "El tablero debe ser plegable y tener encabezado");
assert.match(html, /<input id="symbol-search"[^>]+type="search"[^>]+aria-describedby="symbol-search-help">/, "Falta la búsqueda de símbolos descrita");
assert.match(html, /<p id="symbol-results" class="status" role="status">/, "Falta la región de resultados de la búsqueda");
assert(ids.has("symbol-groups"), "Falta el contenedor de grupos de símbolos");
assert(ids.has("app-status"), "Falta la región de anuncios de la aplicación");

console.log("HTML estructural, tipos de bloque, tablero de símbolos y rutas internas: correctos");
