import test, { after } from "node:test";
import assert from "node:assert/strict";
import { cerrar, omitir, sesionDePrueba } from "./navegador.mjs";

after(cerrar);
test("cada acción del catálogo tiene un manejador en la página", { skip: omitir }, async t => {
  const { pagina } = await sesionDePrueba(t);
  const [catalogo, manejadores] = await pagina.evaluate(() => [
    TexNotes.ACTIONS.map(a => a.id).sort(), Object.keys(TexNotes.actionHandlers).sort(),
  ]);
  assert.deepEqual(manejadores, catalogo);
});
