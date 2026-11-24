import test, { after } from "node:test";
import assert from "node:assert/strict";
import { cerrar, foco, omitir, sesionDePrueba } from "./navegador.mjs";

after(cerrar);
const opts = { skip: omitir };

test("el chip de tipo conserva el borrador y sincroniza ayudas, título y vista previa", opts, async t => {
  const { pagina: p } = await sesionDePrueba(t, "Pixel 7");
  const campo = p.locator("#block-content");
  await campo.fill("Sea $x$.");
  await p.getByRole("button", { name: "Tipo de bloque: Texto" }).tap();
  await p.getByRole("menuitem", { name: "Definición" }).tap();
  await p.getByRole("button", { name: "Tipo de bloque: Definición" }).waitFor();
  assert.equal(await campo.inputValue(), "Sea $x$.");
  assert.ok(await p.locator("#label-fields").isVisible());
  const vista = p.locator(".math-preview-panel");
  if (await vista.getAttribute("open") === null) await vista.locator("summary").click();
  await p.locator("#math-preview .katex").first().waitFor();
  assert.equal(await p.locator("#block-title").isVisible(), false);
  await p.getByRole("button", { name: "Añadir título" }).tap();
  assert.equal(await foco(p), "block-title");
  await p.fill("#block-title", "Límite");
  await p.selectOption("#block-type", "proof");
  assert.ok(await p.locator("#block-title").isVisible());
});

test("Más tipos usa activación de teclado y ofrece el selector si no hay showPicker", opts, async t => {
  const { pagina: p } = await sesionDePrueba(t, "Pixel 7");
  await p.evaluate(() => {
    HTMLSelectElement.prototype.showPicker = function () { this.dataset.pickerActivo = String(navigator.userActivation.isActive); };
  });
  const chip = p.getByRole("button", { name: "Tipo de bloque: Texto" });
  await chip.press("Enter");
  await p.keyboard.press("End");
  await p.keyboard.press("Enter");
  assert.equal(await p.locator("#block-type").getAttribute("data-picker-activo"), "true");
  await p.evaluate(() => { delete HTMLSelectElement.prototype.showPicker; });
  await chip.tap();
  await p.getByRole("menuitem", { name: "Más…" }).tap();
  assert.equal(await foco(p), "block-type");
  await p.selectOption("#block-type", "image");
  await p.getByRole("button", { name: "Añadir pie" }).waitFor();
});

test("el escritorio mantiene el selector y el título y el teléfono ahorra al menos 140 píxeles", opts, async t => {
  const { pagina: escritorio } = await sesionDePrueba(t);
  assert.ok(await escritorio.getByLabel("Tipo de bloque", { exact: true }).isVisible());
  assert.ok(await escritorio.locator("#block-title").isVisible());
  const { pagina: p } = await sesionDePrueba(t, "Pixel 7");
  await p.fill("#note-title", "Prueba");
  for (const [tipo, texto] of [["text","Uno"],["definition","Dos"],["equation","x"]]) {
    await p.selectOption("#block-type", tipo);
    await p.fill("#block-content", texto);
    await p.tap("#thumb-add");
  }
  const top = await p.locator("#block-content").evaluate(e => e.getBoundingClientRect().top + scrollY);
  assert.ok(top <= 2056 - 140, "Contenido empieza en " + top);
});
