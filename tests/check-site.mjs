import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { loadTexNotes } from "./load-app.mjs";

const { BLOCK_TYPES, acceptsChildren, blockToLatex } = await loadTexNotes();

const html = await readFile("index.html", "utf8");
assert.match(html, /^<!doctype html>/i, "Falta doctype");
assert.equal((html.match(/<main\b/g) || []).length, 1, "Debe existir un único main");
assert.equal((html.match(/<h1\b/g) || []).length, 1, "Debe existir un único h1");
assert.match(html, /href="#contenido-principal"/, "Falta el enlace de salto");
// Restricción file://: scripts clásicos en orden de dependencia, nunca módulos ES.
assert.doesNotMatch(html, /<script[^>]+type="module"/, "los scripts no deben ser módulos ES");
const scripts = [...html.matchAll(/<script src="(assets\/js\/[^"]+)"><\/script>/g)].map((match) => match[1]);
assert.deepEqual(scripts, ["assets/js/block-types.js", "assets/js/block-tree.js", "assets/js/latex-generator.js", "assets/js/file-download.js", "assets/js/math-symbols.js", "assets/js/text-insertion.js", "assets/js/app.js"], "faltan scripts o el orden de carga es incorrecto");
assert.match(html, /<input id="course"[^>]+value="Cálculo III \(1352\)">/, "El curso debe aparecer prellenado desde el temario");
assert.match(html, /<input id="teacher"[^>]+value="Guzmán Fuentes Ricardo">/, "El profesor debe aparecer prellenado desde el temario");
assert.match(html, /<input id="date"[^>]+type="date"[^>]+value="2026-09-13">/, "La fecha acordada debe aparecer prellenada");
assert.doesNotMatch(html, /(?:src|href)="\/(?!\/)/, "Las rutas internas no deben partir de la raíz");
const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
for (const match of html.matchAll(/<label\s+for="([^"]+)"/g)) assert(ids.has(match[1]), `label apunta a id inexistente: ${match[1]}`);
for (const match of html.matchAll(/(?:src|href)="((?:assets|examples)\/[^"#]+)"/g)) await access(match[1]);

// El editor apunta a un nodo por ruta, no por índice de primer nivel, y dice
// siempre dónde caerá el bloque siguiente.
assert(ids.has("editing-path"), "Falta el campo de ruta en edición");
assert(ids.has("parent-path"), "Falta el campo de ruta del bloque padre");
assert(ids.has("block-target"), "Falta el texto que indica dónde se añadirá el bloque");
assert.doesNotMatch(html, /id="editing-index"/, "el índice plano de edición fue sustituido por la ruta");
// La ayuda visible tiene que decir que el contenido se copia tal cual y que
// los caracteres reservados los escribe la persona: es la diferencia con el
// contrato anterior y lo que evita que alguien espere un escapado automático.
const help = html.match(/<small id="block-help">([\s\S]*?)<\/small>/);
assert(help, "Falta la ayuda del campo de contenido");
assert.match(help[1], /tal cual/i, "La ayuda debe decir que el contenido se copia tal cual");
for (const fragment of ["\\%", "\\&amp;", "\\$"]) assert(help[1].includes(fragment), `La ayuda debe mostrar el escape ${fragment}`);
assert.match(help[1], /título del bloque y los metadatos se escapan/i, "La ayuda debe distinguir el contenido de los metadatos y títulos");
// Ninguna ayuda visible puede seguir prometiendo el escapado que se retiró.
for (const [id, texto] of [["block-help", help[1]], ["symbol-board-intro", html.match(/<p id="symbol-board-intro">([\s\S]*?)<\/p>/)[1]]]) {
  assert.doesNotMatch(texto, /se escapan\.|Fuera de esos delimitadores/i, `La ayuda «${id}» conserva una afirmación obsoleta sobre el escapado`);
}

// Copiar, duplicar y pegar son tres acciones distintas y se explican como tales.
assert(ids.has("paste-block"), "Falta el botón de pegar el bloque de la bandeja");
assert(ids.has("tray-summary"), "Falta el resumen visible de la bandeja de copia");
assert.match(html, /<button id="paste-block"[^>]*\bhidden\b[^>]*>Pegar bloque<\/button>/, "«Pegar bloque» debe existir oculto hasta que haya algo en la bandeja");
const estructura = html.match(/<h3>Estructura actual<\/h3>\s*<p>([\s\S]*?)<\/p>/);
assert(estructura, "Falta la explicación de la estructura actual");
for (const accion of ["Duplicar", "Copiar bloque", "Copiar texto", "Pegar bloque"]) {
  assert(estructura[1].includes(accion), `La explicación de la estructura debe distinguir «${accion}»`);
}

// Todo tipo ofrecido por la interfaz tiene que producir salida en el generador.
// La paridad entre el selector y la tabla la comprueba tests/generator.test.js.
for (const type of BLOCK_TYPES) {
  const latex = blockToLatex({ type: type.id, title: "Título", content: "Contenido de prueba" });
  assert(latex, `El generador no produce salida para el tipo «${type.id}»`);
  // La misma regla de anidamiento en la tabla, el generador y la interfaz: un
  // tipo contenedor emite a sus hijos, y uno que no lo es jamás los mete dentro.
  const anidado = blockToLatex({ type: type.id, title: "", content: "Contenido de prueba", children: [{ type: "text", content: "Hijo", children: [] }] });
  assert(anidado.includes("Hijo"), `El tipo «${type.id}» pierde a sus hijos`);
  assert.equal(acceptsChildren(type.id), type.container === true, `«${type.id}» debe respetar la regla de anidamiento declarada`);
  if (type.kind === "equation") {
    const [, cola = ""] = anidado.split(type.inline ? "\\)" : "\\]");
    assert(cola.includes("Hijo"), `Una fórmula no anida: los hijos de «${type.id}» deben emitirse tras su cierre`);
  }
}

// Tablero de símbolos: plegable, buscable y con un contenedor propio para los grupos.
assert.match(html, /<details id="symbol-details" open>\s*<summary><h3 id="simbolos-heading">Símbolos matemáticos<\/h3><\/summary>/, "El muelle debe abrir por defecto y tener encabezado");
assert.match(html, /<input id="symbol-search"[^>]+type="search"[^>]+aria-describedby="symbol-search-help">/, "Falta la búsqueda de símbolos descrita");
assert.match(html, /<p id="symbol-results" class="status" role="status">/, "Falta la región de resultados de la búsqueda");
assert(ids.has("symbol-groups"), "Falta el contenedor de grupos de símbolos");
assert.match(html, /id="symbol-category-picker"[^>]+aria-label=/, "Falta el selector de categorías");
assert.match(html, /id="symbol-groups"[^>]+role="toolbar"[^>]+aria-orientation="horizontal"/, "La rejilla debe ser una barra de herramientas horizontal");
assert.match(html, /id="symbol-detail" aria-hidden="true"/, "El detalle visual no debe duplicar anuncios");
assert(ids.has("app-status"), "Falta la región de anuncios de la aplicación");

console.log("HTML estructural, tipos de bloque, anidamiento, copia de bloques, tablero de símbolos y rutas internas: correctos");
