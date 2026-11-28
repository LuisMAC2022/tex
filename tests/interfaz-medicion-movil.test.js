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

test("la navegación cabe a tamaño normal y permite alcanzar cada destino con texto grande", { skip: omitir }, async t => {
  const { pagina:p } = await sesionDePrueba(t, "Pixel 7");
  for (const width of [320,390,430,195]) {
    await p.setViewportSize({width, height:568});
    await p.locator("#tab-tree").press("Enter");
    if (width !== 195) assert.ok((await medirNavegacion(p)).every(b => b.dentro), width + " px");
    const estilo = await p.addStyleTag({content:"html { font-size: 200% }"});
    assert.ok((await medirNavegacion(p,true)).every(b => b.dentro), width + " px al 200%");
    for (const id of ["tab-document","tab-more"]) {
      await p.locator("#" + id).evaluate(b => b.scrollIntoView({inline:"nearest", block:"nearest"}));
      await p.tap("#" + id);
      assert.equal(await p.locator("#" + id).getAttribute("aria-selected"), "true");
    }
    await estilo.evaluate(e => e.remove());
  }
});
