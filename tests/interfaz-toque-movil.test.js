import test, { after } from "node:test";
import assert from "node:assert/strict";
import { cerrar, omitir, sesionDePrueba } from "./navegador.mjs";

after(cerrar);
test("el centro de Añadir medido mientras se escribe conserva el destino tras perder el foco", {skip: omitir}, async t => {
  for (const [width,height] of [[390,844],[430,932],[320,568]]) {
    const {pagina:p} = await sesionDePrueba(t, "Pixel 7");
    await p.setViewportSize({ width, height });
    for (const blur of [false,true]) {
      await p.fill("#block-content", "Bloque.");
      await p.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const boton = p.locator("#add-block");
      let r = await boton.boundingBox();
      if (r.y + r.height / 2 >= height) {
        await boton.evaluate(b => b.scrollIntoView({ block: "center" }));
        r = await boton.boundingBox();
      }
      assert.equal(await p.locator(":focus").getAttribute("id"), "block-content");
      if (blur) await p.locator("#block-content").blur();
      await p.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2);
      assert.equal(await p.locator("#block-list article").count(), blur ? 2 : 1, width + " px");
      assert.ok(r.y + r.height <= (await p.locator("#thumb-bar").boundingBox()).y);
    }
  }
});
