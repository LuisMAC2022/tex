/**
 * Cada invariante declarada en INVARIANTES.md tiene todavía un guardián real.
 *
 * Esta prueba no vuelve a comprobar el comportamiento: de eso se encargan las
 * 74 pruebas que ya existen. Comprueba el ENLACE, que es lo que se rompe en
 * silencio: que el archivo guardián exista y que la afirmación citada siga
 * escrita literalmente en él. Si alguien renombra o borra esa aserción, la
 * invariante se queda sin vigilancia y aquí se nota.
 *
 * Al final se añade el guardián de la única invariante que no tenía ninguno:
 * la ausencia de recursos remotos y de dependencias de ejecución.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));

const TITULO = /^###\s+(INV-\d{3})\s+—\s+(.+?)\s*$/;
const GUARDIAN = /^Guardián:\s+`([^`]+)`\s+→\s+"(.+)"\s*$/;

/** [{ id, texto, guardianes: [{ archivo, afirmacion }] }] */
function invariantes() {
  const lineas = readFileSync(join(RAIZ, "INVARIANTES.md"), "utf8").split(/\r?\n/);
  const entradas = [];
  let enBloque = false;
  for (const linea of lineas) {
    // El propio archivo documenta el formato con un ejemplo: dentro de una
    // valla de código nada cuenta como declaración.
    if (/^\s*```/.test(linea)) {
      enBloque = !enBloque;
      continue;
    }
    if (enBloque) continue;
    const titulo = TITULO.exec(linea);
    if (titulo) {
      entradas.push({ id: titulo[1], texto: titulo[2], guardianes: [] });
      continue;
    }
    const guardian = GUARDIAN.exec(linea);
    if (guardian) {
      assert.ok(entradas.length, `un «Guardián:» aparece antes de su ### INV-NNN`);
      entradas.at(-1).guardianes.push({ archivo: guardian[1], afirmacion: guardian[2] });
    }
  }
  return entradas;
}

const declaradas = invariantes();

test("INVARIANTES.md declara invariantes con identificadores únicos", () => {
  assert.ok(declaradas.length >= 1, "INVARIANTES.md no declara ninguna invariante");
  const vistos = new Set();
  for (const { id } of declaradas) {
    assert.ok(!vistos.has(id), `${id} aparece dos veces`);
    vistos.add(id);
  }
});

test("cada invariante nombra al menos un guardián", () => {
  const sinGuardian = declaradas.filter((i) => i.guardianes.length === 0).map((i) => i.id);
  assert.deepEqual(
    sinGuardian,
    [],
    "una invariante sin guardián es prosa, no una invariante. " +
      `Escribe su prueba o muévela a decisiones/: ${sinGuardian.join(", ")}`,
  );
});

test("cada guardián existe y sigue afirmando lo que se le atribuye", () => {
  const roto = [];
  for (const { id, guardianes } of declaradas) {
    for (const { archivo, afirmacion } of guardianes) {
      const ruta = join(RAIZ, archivo);
      if (!existsSync(ruta)) {
        roto.push(`${id}: no existe ${archivo}`);
        continue;
      }
      if (!readFileSync(ruta, "utf8").includes(afirmacion)) {
        roto.push(`${id}: ${archivo} ya no contiene «${afirmacion}»`);
      }
    }
  }
  assert.deepEqual(roto, [], `invariantes sin vigilancia:\n  ${roto.join("\n  ")}`);
});

test("INV-006: ni el sitio ni el proyecto cargan nada remoto", () => {
  const html = readFileSync(join(RAIZ, "index.html"), "utf8");
  assert.doesNotMatch(
    html,
    /<(?:script|link|img|iframe|source)\b[^>]*(?:src|href)\s*=\s*["'](?:https?:)?\/\//i,
    "index.html carga un recurso remoto",
  );

  const css = readFileSync(join(RAIZ, "assets/css/styles.css"), "utf8");
  assert.doesNotMatch(css, /@import|url\(\s*["']?(?:https?:)?\/\//i, "el CSS carga algo remoto");

  const paquete = JSON.parse(readFileSync(join(RAIZ, "package.json"), "utf8"));
  assert.deepEqual(paquete.dependencies ?? {}, {}, "no debe haber dependencias de ejecución");
  assert.deepEqual(paquete.devDependencies ?? {}, {}, "no debe haber dependencias de desarrollo");
});
