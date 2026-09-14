import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";

const html = await readFile("index.html", "utf8");
assert.match(html, /^<!doctype html>/i, "Falta doctype");
assert.equal((html.match(/<main\b/g) || []).length, 1, "Debe existir un único main");
assert.equal((html.match(/<h1\b/g) || []).length, 1, "Debe existir un único h1");
assert.match(html, /href="#contenido-principal"/, "Falta el enlace de salto");
// Restricción file://: scripts clásicos en orden de dependencia, nunca módulos ES.
assert.doesNotMatch(html, /<script[^>]+type="module"/, "los scripts no deben ser módulos ES");
const scripts = [...html.matchAll(/<script src="(assets\/js\/[^"]+)"><\/script>/g)].map((match) => match[1]);
assert.deepEqual(scripts, ["assets/js/block-types.js", "assets/js/latex-generator.js", "assets/js/file-download.js", "assets/js/app.js"], "faltan scripts o el orden de carga es incorrecto");
assert.match(html, /<input id="course"[^>]+value="Cálculo III \(1352\)">/, "El curso debe aparecer prellenado desde el temario");
assert.match(html, /<input id="teacher"[^>]+value="Guzmán Fuentes Ricardo">/, "El profesor debe aparecer prellenado desde el temario");
assert.match(html, /<input id="date"[^>]+type="date"[^>]+value="2026-09-13">/, "La fecha acordada debe aparecer prellenada");
assert.doesNotMatch(html, /(?:src|href)="\/(?!\/)/, "Las rutas internas no deben partir de la raíz");
const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
for (const match of html.matchAll(/<label\s+for="([^"]+)"/g)) assert(ids.has(match[1]), `label apunta a id inexistente: ${match[1]}`);
for (const match of html.matchAll(/(?:src|href)="((?:assets|examples)\/[^"#]+)"/g)) await access(match[1]);
console.log("HTML estructural y rutas internas: correctos");
