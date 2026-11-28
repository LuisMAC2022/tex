import test, { after } from "node:test";
import assert from "node:assert/strict";
import { cerrar, omitir, sesionDePrueba } from "./navegador.mjs";

after(cerrar);
test("editar permite guardar y volver a la misma tarjeta, y el menú táctil recibe el foco", {skip:omitir}, async t => {
  const {pagina:p} = await sesionDePrueba(t,"Pixel 7");
  await p.tap("#tab-tree");
  await p.locator("#empty-blocks").getByRole("link",{name:"Escribir"}).tap();
  await p.fill("#block-content","Una tarjeta");
  await p.tap("#thumb-add");
  await p.tap("#tab-tree");
  const editar = p.getByRole("button",{name:/^Editar Texto,/});
  await editar.tap();
  assert.equal(await p.locator(":focus").getAttribute("id"),"block-content");
  await p.getByRole("button",{name:"Guardar",exact:true}).tap();
  await p.getByRole("button",{name:"Volver a la estructura"}).tap();
  assert.ok(await editar.evaluate(b=>b===document.activeElement));
  await p.tap("#tab-write");
  await p.focus("#block-content");
  await p.tap("#thumb-menu");
  assert.ok(await p.locator("main").evaluate(m=>m.inert));
  assert.ok(await p.getByRole("menuitem").first().evaluate(b=>b===document.activeElement));
  await p.keyboard.press("Escape");
  assert.equal(await p.locator("main").evaluate(m=>m.inert),false);
  assert.equal(await p.locator(":focus").getAttribute("id"),"block-content");
  assert.match(await p.locator("#thumb-personal").innerText(),/Deshacer/);
});
