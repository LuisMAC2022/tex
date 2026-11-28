import test, { after } from "node:test";
import assert from "node:assert/strict";
import { cerrar, omitir, sesionDePrueba } from "./navegador.mjs";

after(cerrar);
test("añadir muestra la confirmación encima de la barra y actualiza el contador accesible", {skip: omitir}, async t => {
  const {pagina:p} = await sesionDePrueba(t, "Pixel 7");
  await p.fill("#block-content", "Uno");
  await p.tap("#thumb-add");
  const aviso = p.locator("#app-status");
  assert.match(await aviso.textContent(), /añadido/i);
  assert.ok(await aviso.evaluate(e => e.getBoundingClientRect().bottom <= document.querySelector("#thumb-bar").getBoundingClientRect().top));
  await p.getByRole("tab", {name:"Estructura · 1", exact:true}).tap();
  await p.locator("article button[data-action=context]:visible").first().click();
  await p.getByRole("menuitem", {name:"Eliminar", exact:true}).tap();
  assert.equal(await p.locator("#tab-tree").innerText(), "Estructura · 0");
});
