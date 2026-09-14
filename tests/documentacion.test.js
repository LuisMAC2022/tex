/**
 * Los archivos de documentación generados siguen al día.
 *
 * Un archivo derivado que nadie vuelve a generar es peor que no tenerlo: dice
 * con autoridad de máquina algo que dejó de ser cierto. Es el mismo fallo que
 * los bloques @decision vigilan sobre el código, aplicado a lo que el propio
 * repositorio produce.
 *
 * Aquí se comprobará también, cuando existan, que las guías no nombren un
 * botón ni un archivo que ya no existe.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { DESTINO, generar } from "../bin/inventario-pruebas.mjs";

test("docs/pruebas.md está al día respecto de la suite", () => {
  assert.ok(existsSync(DESTINO), "falta docs/pruebas.md; ejecuta: npm run inventario");
  assert.equal(
    readFileSync(DESTINO, "utf8"),
    generar().texto,
    "docs/pruebas.md no coincide con la suite. Ejecuta: npm run inventario",
  );
});
