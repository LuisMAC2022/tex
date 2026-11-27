import test, { after } from "node:test";
import assert from "node:assert/strict";
import { cerrar, omitir, sesionDePrueba, codigo, foco } from "./navegador.mjs";

after(cerrar);
const opciones = { skip: omitir };

test("Añadir bloque y Ctrl+Intro conservan el orden, el LaTeX y el foco de captura", opciones, async t => {
  const { pagina } = await sesionDePrueba(t);
  await pagina.getByRole("tab", { name: "Documento", exact: true }).click();
  await pagina.fill("#note-title", "Notas");
  await pagina.getByRole("tab", { name: "Escribir", exact: true }).click();
  await pagina.fill("#block-content", "Primer párrafo.");
  await pagina.click("#add-block");
  assert.equal(await foco(pagina), "block-content");
  await pagina.fill("#block-content", "Segundo párrafo.");
  await pagina.keyboard.press("Control+Enter");
  assert.equal(await foco(pagina), "block-content");
  assert.match(await codigo(pagina), /Primer párrafo\.\s+Segundo párrafo\./);
});

test("editar, cancelar y guardar respetan el texto del bloque original", opciones, async t => {
  const { pagina } = await sesionDePrueba(t);
  await pagina.getByRole("tab", { name: "Documento", exact: true }).click();
  await pagina.fill("#note-title", "Ediciones");
  await pagina.getByRole("tab", { name: "Escribir", exact: true }).click();
  await pagina.fill("#block-content", "Original");
  await pagina.click("#add-block");
  const editar = pagina.getByRole("button", { name: /^Editar 1 / });
  await editar.click();
  assert.equal(await pagina.inputValue("#block-content"), "Original");
  await pagina.fill("#block-content", "Descartado");
  await pagina.click("#cancel-edit");
  assert.equal(await foco(pagina), "block-type");
  assert.match(await editar.locator("xpath=ancestor::article").innerText(), /Original/);
  await editar.click();
  await pagina.fill("#block-content", "Corregido");
  await pagina.click("#add-block");
  assert.equal(await editar.evaluate(b => b === document.activeElement), true);
  assert.match(await codigo(pagina), /Corregido/);
});

test("los cambios de tipo muestran las ayudas y los campos de figura llegan al documento", opciones, async t => {
  const { pagina } = await sesionDePrueba(t);
  await pagina.getByRole("tab", { name: "Documento", exact: true }).click();
  await pagina.fill("#note-title", "Figuras");
  await pagina.getByRole("tab", { name: "Escribir", exact: true }).click();
  await pagina.selectOption("#block-type", "proof");
  assert.ok(await pagina.locator("#proof-help").isVisible());
  await pagina.selectOption("#block-type", "image");
  assert.ok(await pagina.locator("#image-fields").isVisible());
  assert.equal(await pagina.locator("#proof-help").isVisible(), false);
  await pagina.fill("#image-path", "grafica.pdf");
  await pagina.fill("#block-title", "Curva");
  await pagina.click("#image-turn");
  await pagina.click("#add-block");
  assert.equal(await foco(pagina), "image-path");
  const tex = await codigo(pagina);
  assert.match(tex, /grafica\.pdf/);
  assert.match(tex, /\\caption\{Curva\}/);
  assert.match(tex, /angle=90/);
});
