import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { loadTexNotes } from "./load-app.mjs";

const { BLOCK_TYPES, blockToLatex } = await loadTexNotes();

const html = await readFile("index.html", "utf8");
assert.match(html, /^<!doctype html>/i, "Falta doctype");
assert.equal((html.match(/<main\b/g) || []).length, 1, "Debe existir un único main");
assert.equal((html.match(/<h1\b/g) || []).length, 1, "Debe existir un único h1");
assert.match(html, /href="#contenido-principal"/, "Falta el enlace de salto");
// Restricción file://: scripts clásicos en orden de dependencia, nunca módulos ES.
assert.doesNotMatch(html, /<script[^>]+type="module"/, "los scripts no deben ser módulos ES");
const scripts = [...html.matchAll(/<script src="(assets\/js\/[^"]+)"><\/script>/g)].map((match) => match[1]);
assert.deepEqual(scripts, ["assets/js/block-types.js", "assets/js/latex-generator.js", "assets/js/file-download.js", "assets/js/math-symbols.js", "assets/js/text-insertion.js", "assets/js/app.js"], "faltan scripts o el orden de carga es incorrecto");
assert.match(html, /<input id="course"[^>]+value="Cálculo III \(1352\)">/, "El curso debe aparecer prellenado desde el temario");
assert.match(html, /<input id="teacher"[^>]+value="Guzmán Fuentes Ricardo">/, "El profesor debe aparecer prellenado desde el temario");
assert.match(html, /<input id="date"[^>]+type="date"[^>]+value="2026-09-13">/, "La fecha acordada debe aparecer prellenada");
assert.doesNotMatch(html, /(?:src|href)="\/(?!\/)/, "Las rutas internas no deben partir de la raíz");
const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
for (const match of html.matchAll(/<label\s+for="([^"]+)"/g)) assert(ids.has(match[1]), `label apunta a id inexistente: ${match[1]}`);
for (const match of html.matchAll(/(?:src|href)="((?:assets|examples)\/[^"#]+)"/g)) await access(match[1]);

// Todo tipo ofrecido por la interfaz tiene que producir salida en el generador.
// La paridad entre el selector y la tabla la comprueba tests/generator.test.js.
for (const type of BLOCK_TYPES) {
  const latex = blockToLatex({ type: type.id, title: "Título", content: "Contenido de prueba" });
  assert(latex, `El generador no produce salida para el tipo «${type.id}»`);
}

// Tablero de símbolos: plegable, buscable y con un contenedor propio para los grupos.
assert.match(html, /<details id="symbol-details">\s*<summary><h3 id="simbolos-heading">Símbolos matemáticos<\/h3><\/summary>/, "El tablero debe ser plegable y tener encabezado");
assert.match(html, /<input id="symbol-search"[^>]+type="search"[^>]+aria-describedby="symbol-search-help">/, "Falta la búsqueda de símbolos descrita");
assert.match(html, /<p id="symbol-results" class="status" role="status">/, "Falta la región de resultados de la búsqueda");
assert(ids.has("symbol-groups"), "Falta el contenedor de grupos de símbolos");
assert(ids.has("app-status"), "Falta la región de anuncios de la aplicación");

console.log("HTML estructural, tipos de bloque, tablero de símbolos y rutas internas: correctos");
