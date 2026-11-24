import test, { after } from "node:test";
import assert from "node:assert/strict";
import { cerrar, irAlPanel, omitir, sesionDePrueba } from "./navegador.mjs";

after(cerrar);
const opts = { skip: omitir };
async function crear(p, value) {
  await p.fill("#block-content", value);
  await p.tap("#thumb-add");
  await irAlPanel(p, "Estructura");
}
const tarjetas = p => p.locator("#block-list article");
const acciones = card => card.getByRole("button", { name: /^Acciones para / });
test("la tarjeta de una línea cabe en 140 px y presenta ocho acciones en posiciones fijas", opts, async t => {
  const { pagina: p } = await sesionDePrueba(t, "Pixel 7");
  await crear(p, "Una línea.");
  const card = tarjetas(p).first();
  assert.ok((await card.boundingBox()).height <= 140);
  await acciones(card).press("Enter");
  const items = p.getByRole("menu", { name: "Menú del bloque" }).getByRole("menuitem");
  assert.deepEqual(await items.locator("span:last-child").allTextContents(),
    ["Subir", "Duplicar", "Copiar bloque", "Copiar texto", "Bajar", "Mover…", "Eliminar", "Pegar dentro"]);
  assert.equal(await items.first().evaluate(n => n === document.activeElement), true);
  for (const i of [0,4,7]) assert.equal(await items.nth(i).getAttribute("aria-disabled"), "true");
  await items.nth(1).click();
  assert.equal(await tarjetas(p).count(), 2);
  assert.match(await p.locator(":focus").getAttribute("aria-label"), /^Editar 2 /);
  await acciones(tarjetas(p).nth(1)).tap();
  await p.getByRole("menuitem", { name: "Eliminar", exact: true }).tap();
  assert.match(await p.locator(":focus").getAttribute("aria-label"), /^Editar 1 /);
});

test("Ver todo expande una vista de más de tres líneas y pegar dentro respeta la bandeja", opts, async t => {
  const { pagina: p } = await sesionDePrueba(t, "Pixel 7");
  await crear(p, "Contenido que ocupa varias líneas. ".repeat(15));
  const card = tarjetas(p).first(), ver = card.getByRole("button", { name: "Ver todo" });
  const compacta = await card.locator(".block-preview").boundingBox();
  await ver.tap();
  assert.ok((await card.locator(".block-preview").boundingBox()).height > compacta.height);
  await acciones(card).tap();
  await p.getByRole("menuitem", { name: "Copiar bloque" }).tap();
  await acciones(card).tap();
  await p.getByRole("menuitem", { name: "Pegar dentro" }).tap();
  assert.equal(await p.locator("#block-list .block-children article").count(), 1);
});

test("una ecuación de una línea conserva sus límites de integral en la tarjeta compacta", opts, async t => {
  const { pagina: p } = await sesionDePrueba(t, "Pixel 7");
  await p.selectOption("#block-type", "equation");
  await crear(p, "\\int_a^b f(x)\\,dx");
  const card = tarjetas(p).first();
  await card.locator(".katex-display").waitFor();
  assert.ok((await card.boundingBox()).height <= 140);
});
