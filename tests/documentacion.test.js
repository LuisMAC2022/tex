/**
 * La documentación no nombra nada que haya dejado de existir.
 *
 * Tres modos de envejecer en silencio, uno por prueba:
 *
 * 1. Un archivo derivado que nadie regenera —docs/pruebas.md— afirma con
 *    autoridad de máquina algo que dejó de ser cierto.
 * 2. Un enlace o un ancla de índice que apunta a lo que ya no está. Solo se
 *    descubre pulsándolo, y a los manuales se entra por el índice.
 * 3. Una guía que nombra un botón renombrado. Es el fallo caro: quien lee es
 *    quien menos puede darse cuenta de que la equivocada es la guía.
 *
 * El tercero necesita distinguir un rótulo de una frase, y ninguna heurística
 * lo hace bien: al escribir la guía, filtrar por negrita daba nueve falsos
 * positivos y filtrar por punto final, veintidós. Por eso la convención es
 * explícita y exacta —«…» es siempre un rótulo copiado de la pantalla, y
 * cualquier otra cosa va entre comillas altas o en negrita— y está escrita en
 * la cabecera de la propia guía.
 *
 * El respaldo se busca SOLO en etiquetas reales, nunca en el archivo entero:
 * buscar en todo index.html dio por bueno «título del bloque», que únicamente
 * existía dentro de la prosa de un texto de ayuda.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DESTINO, generar } from "../bin/inventario-pruebas.mjs";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const IGNORADOS = new Set([".git", "node_modules"]);

/** Todos los .md del árbol, en orden estable. */
function documentos(directorio = RAIZ) {
  const encontrados = [];
  for (const nombre of readdirSync(directorio).sort()) {
    if (IGNORADOS.has(nombre)) continue;
    const ruta = join(directorio, nombre);
    if (statSync(ruta).isDirectory()) encontrados.push(...documentos(ruta));
    else if (nombre.endsWith(".md")) encontrados.push(ruta);
  }
  return encontrados;
}

/** El identificador que GitHub deriva de un encabezado. Conserva los acentos. */
function ancla(titulo) {
  return titulo
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s+/g, "-");
}

test("docs/pruebas.md está al día respecto de la suite", () => {
  assert.ok(existsSync(DESTINO), "falta docs/pruebas.md; ejecuta: npm run inventario");
  assert.equal(
    readFileSync(DESTINO, "utf8"),
    generar().texto,
    "docs/pruebas.md no coincide con la suite. Ejecuta: npm run inventario",
  );
});

test("ningún enlace de la documentación apunta a un archivo inexistente", () => {
  const roto = [];
  for (const ruta of documentos()) {
    const texto = readFileSync(ruta, "utf8");
    const corta = relative(RAIZ, ruta);
    for (const [, destino] of texto.matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^(?:https?:|mailto:|#)/.test(destino)) continue;
      const archivo = decodeURIComponent(destino.split("#", 1)[0]);
      if (!archivo) continue;
      if (!existsSync(resolve(dirname(ruta), archivo))) {
        roto.push(`${corta} enlaza a ${normalize(archivo)}, que no existe`);
      }
    }
  }
  assert.deepEqual(roto, [], `enlaces rotos:\n  ${roto.join("\n  ")}`);
});

test("ningún índice apunta a una sección que ya no existe", () => {
  const roto = [];
  for (const ruta of documentos()) {
    const texto = readFileSync(ruta, "utf8");
    const corta = relative(RAIZ, ruta);
    const secciones = new Set(
      [...texto.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)].map(([, titulo]) => ancla(titulo)),
    );
    for (const [, destino] of texto.matchAll(/\]\(#([^)\s]+)\)/g)) {
      const objetivo = decodeURIComponent(destino);
      if (!secciones.has(objetivo)) roto.push(`${corta} apunta a #${objetivo}, que no es ninguna sección`);
    }
  }
  assert.deepEqual(roto, [], `anclas rotas:\n  ${roto.join("\n  ")}`);
});

test("cada rótulo que citan las guías sigue existiendo en la interfaz", () => {
  const html = readFileSync(join(RAIZ, "index.html"), "utf8");
  const app = readFileSync(join(RAIZ, "assets/js/app.js"), "utf8");

  // Solo texto que el navegador PINTA como rótulo: nunca la prosa de una ayuda.
  const etiquetas = [
    ...html.matchAll(/>([^<>{}]{2,80})<\/(?:button|label|legend|option|summary|h1|h2|h3)>/g),
    ...app.matchAll(/textContent\s*=\s*"([^"]{2,80})"/g),
    ...app.matchAll(/actionButton\("([^"]+)"/g),
  ].map(([, texto]) => texto.trim());

  const guias = documentos(join(RAIZ, "docs"));
  assert.ok(guias.length, "no hay ninguna guía en docs/");

  const roto = [];
  let citados = 0;
  for (const ruta of guias) {
    const texto = readFileSync(ruta, "utf8").replace(/<!--[\s\S]*?-->/g, "");
    const corta = relative(RAIZ, ruta);
    for (const rotulo of new Set([...texto.matchAll(/«([^»\n]{2,80})»/g)].map(([, r]) => r))) {
      citados += 1;
      if (!etiquetas.some((etiqueta) => etiqueta.includes(rotulo))) {
        roto.push(`${corta} cita «${rotulo}», que ya no es ninguna etiqueta de la interfaz`);
      }
    }
  }

  assert.ok(citados >= 20, `solo ${citados} rótulos citados: ¿se perdió la convención «…»?`);
  assert.deepEqual(
    roto,
    [],
    "rótulos sin respaldo. Si el control se renombró, actualiza la guía; si lo que " +
      `citas no es un rótulo, usa comillas altas o negrita:\n  ${roto.join("\n  ")}`,
  );
});
