import test, { after } from "node:test";
import assert from "node:assert/strict";
import { cerrar, omitir, sesionDePrueba } from "./navegador.mjs";
import { medirNavegacion } from "../diagnostico/medir-movil.mjs";

after(cerrar);
test("el diagnóstico mide los cinco controles visibles de Estructura", { skip: omitir }, async t => {
  const { pagina } = await sesionDePrueba(t, "Pixel 7");
  await pagina.tap("#tab-tree");
  const botones = await medirNavegacion(pagina);
  assert.deepEqual(botones.map(b => b.id), ["tab-write", "tab-tree", "tab-document", "tab-more", "panel-menu"]);
  assert.ok(botones.every(b => typeof b.dentro === "boolean"));
});
