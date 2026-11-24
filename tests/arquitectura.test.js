/**
 * La forma del código, no su comportamiento (DEC-030).
 *
 * app.js es el único script que mezcla DOM, estado y reglas, y el único que no
 * se puede probar en Node. Cada línea que gana es una línea más fuera de las
 * pruebas puras. Su presupuesto solo baja: al extraer una sección a su propio
 * script se rebaja aquí en el mismo commit, y subirlo exige una entrada nueva
 * en decisiones/. El tamaño se mide en bytes y no en líneas, para que unir
 * líneas no cuente como adelgazar.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const PRESUPUESTO_APP = 110_500;

test("app.js no supera su presupuesto de bytes", () => {
  const bytes = statSync(join(RAIZ, "assets/js/app.js")).size;
  assert.ok(bytes <= PRESUPUESTO_APP,
    `app.js mide ${bytes} bytes y su presupuesto es ${PRESUPUESTO_APP}. Lo nuevo va en su propio script ` +
    "(docs/guia-de-desarrollo.md, «Dónde va el código nuevo»); subir el presupuesto exige una decisión.");
});

test("cada script propio se carga en index.html y lo revisa check:js", () => {
  const propios = readdirSync(join(RAIZ, "assets/js")).filter((nombre) => nombre.endsWith(".js")).sort();
  const html = readFileSync(join(RAIZ, "index.html"), "utf8");
  const cargados = [...html.matchAll(/<script src="assets\/js\/([^"]+)"><\/script>/g)].map((m) => m[1]).sort();
  assert.deepEqual(cargados, propios, "assets/js e index.html deben listar los mismos scripts");
  const revision = JSON.parse(readFileSync(join(RAIZ, "package.json"), "utf8")).scripts["check:js"];
  const revisados = [...revision.matchAll(/assets\/js\/([\w-]+\.js)/g)].map((m) => m[1]).sort();
  assert.deepEqual(revisados, propios, "check:js de package.json debe revisar cada script de assets/js");
});
