import test, { after } from "node:test";
import assert from "node:assert/strict";
import { cerrar, omitir, sesionDePrueba, foco } from "./navegador.mjs";

after(cerrar);
const opciones = { skip: omitir };

test("el autocierre y Tab completan delimitadores, alias y huecos sucesivos", opciones, async t => {
  const { pagina: p } = await sesionDePrueba(t);
  await p.selectOption("#block-type", "equation");
  const campo = p.locator("#block-content");
  await campo.focus();
  await p.keyboard.type("{x");
  assert.equal(await campo.inputValue(), "{x}");
  await campo.press("Tab");
  assert.equal(await campo.evaluate(e => e.selectionStart), 3);
  await campo.fill("");
  await p.keyboard.type("fr");
  await campo.press("Tab");
  await p.keyboard.type("a");
  await campo.press("Tab");
  await p.keyboard.type("b");
  assert.equal(await campo.inputValue(), "\\frac{a}{b}");
});

test("la lista de barra diagonal selecciona un tipo y actualiza el formulario", opciones, async t => {
  const { pagina: p } = await sesionDePrueba(t);
  await p.locator("#block-content").focus();
  await p.keyboard.type("/def");
  await p.locator("#assist-list").getByRole("option", { name: /Definición/i }).click();
  assert.equal(await p.inputValue("#block-type"), "definition");
  assert.equal(await p.inputValue("#block-content"), "");
  assert.equal(await foco(p), "block-content");
});

test("las sugerencias de referencias y citas insertan los destinos del documento", opciones, async t => {
  const { pagina: p } = await sesionDePrueba(t);
  await p.selectOption("#block-type", "equation");
  await p.fill("#block-label", "ec:uno");
  await p.fill("#block-content", "1");
  await p.click("#add-block");
  await p.click("#document-references > summary");
  await p.click("#add-course-references");
  await p.selectOption("#block-type", "text");
  const campo = p.locator("#block-content");
  for (const [comando, destino, esperado] of [["\\ref{", "ec:uno", "\\eqref{ec:uno}"], ["\\citep{", "stewart1994", "\\citep{stewart1994}"]]) {
    await campo.fill("");
    await campo.focus();
    await p.keyboard.type(comando);
    await p.locator("#assist-list").getByRole("option").filter({ hasText: destino }).first().click();
    assert.equal(await campo.inputValue(), esperado);
  }
});

test("Selección amplía y reduce el alcance y la hoja de símbolos devuelve el foco", opciones, async t => {
  const { pagina: p } = await sesionDePrueba(t, "Pixel 7");
  const campo = p.locator("#block-content");
  await campo.fill("una frase");
  await campo.press("Home");
  await p.tap("#thumb-selection");
  await p.tap("#thumb-next");
  assert.equal(await campo.evaluate(e => e.value.slice(e.selectionStart, e.selectionEnd)), "una");
  await p.tap("#thumb-prev");
  assert.equal(await campo.evaluate(e => e.selectionStart === e.selectionEnd), true);
  await p.tap("#thumb-selection");
  await p.tap("#thumb-symbols");
  assert.ok(await p.locator("#close-symbol-sheet").isVisible());
  await p.tap("#close-symbol-sheet");
  assert.equal(await foco(p), "block-content");
});
