#!/usr/bin/env node
/**
 * Genera docs/pruebas.md a partir de la suite.
 *
 * Sustituye al inventario en prosa que vivía en el README. Un inventario
 * escrito a mano repite en prosa un dato que la máquina ya tiene y caduca en
 * cuanto se renombra una prueba; este se deriva del código, así que no puede
 * mentir. No se edita a mano: se regenera.
 *
 *   node bin/inventario-pruebas.mjs
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const PRUEBAS = join(RAIZ, "tests");
const NOMBRE = /\btest\(\s*"((?:[^"\\]|\\.)*)"/g;

/** Devuelve el literal tal como se lee al ejecutarse, no tal como se escribe. */
const literal = (fuente) => fuente.replace(/\\(.)/g, "$1");

const lineas = [
  "# Inventario de pruebas",
  "",
  "> Archivo **generado**. No se edita a mano: `node bin/inventario-pruebas.mjs`.",
  "> Su versión de referencia es la suite; si discrepan, manda la suite.",
  "",
];

let total = 0;
for (const archivo of readdirSync(PRUEBAS).sort()) {
  if (!archivo.endsWith(".test.js")) continue;
  const fuente = readFileSync(join(PRUEBAS, archivo), "utf8");
  const nombres = [...fuente.matchAll(NOMBRE)].map((coincidencia) => literal(coincidencia[1]));
  if (!nombres.length) continue;
  total += nombres.length;
  lineas.push(`## \`tests/${archivo}\` — ${nombres.length} pruebas`, "");
  for (const nombre of nombres) lineas.push(`- ${nombre}`);
  lineas.push("");
}

const estructural = readFileSync(join(PRUEBAS, "check-site.mjs"), "utf8");
const aserciones = (estructural.match(/\bassert\b/g) || []).length - 1;
lineas.push(
  "## `tests/check-site.mjs` — comprobación estructural",
  "",
  `No usa \`node:test\`: es un script con ${aserciones} aserciones sobre \`index.html\`` +
    " (doctype, un solo `main` y `h1`, enlace de salto, orden de los scripts clásicos," +
    " rutas relativas, etiquetas asociadas y ayudas visibles). Se ejecuta con `npm test`.",
  "",
  `---`,
  "",
  `${total} pruebas con \`node:test\` más la comprobación estructural.`,
  "",
);

mkdirSync(join(RAIZ, "docs"), { recursive: true });
writeFileSync(join(RAIZ, "docs", "pruebas.md"), lineas.join("\n"), "utf8");
console.log(`docs/pruebas.md: ${total} pruebas con node:test + check-site.mjs`);
