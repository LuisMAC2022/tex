import test, { after } from "node:test";
import assert from "node:assert/strict";
import { cerrar, irAlPanel, omitir, sesionDePrueba } from "./navegador.mjs";

after(cerrar);
const opciones = { skip: omitir };

test("el esquema localiza y edita un bloque entre cincuenta y recuerda su vista", opciones, async t => {
  const { pagina } = await sesionDePrueba(t);
  const campo = pagina.locator("#block-content");
  for (let i = 1; i <= 50; i++) {
    await campo.fill(i === 47 ? "Cálculo de una integral doble" : "Apunte " + i);
    await campo.press("Control+Enter");
  }
  await pagina.selectOption("#structure-mode", "outline");
  await pagina.fill("#structure-search", "calculo doble");
  assert.equal(await pagina.locator("#structure-results").innerText(), "1 bloque encontrado");
  const editar = pagina.getByRole("button", { name: /^Editar Texto,/ });
  await editar.click();
  assert.equal(await campo.inputValue(), "Cálculo de una integral doble");
  assert.equal(await pagina.locator("article[aria-current=true]").count(), 1);
  await pagina.reload();
  assert.equal(await pagina.locator("#structure-mode").inputValue(), "outline");
});

test("plegar una rama conserva su estado y buscar un hijo muestra su ruta", opciones, async t => {
  const { pagina } = await sesionDePrueba(t);
  await pagina.selectOption("#block-type", "theorem");
  await pagina.fill("#block-content", "Enunciado");
  await pagina.click("#add-block");
  await pagina.getByRole("button", { name: /^Añadir un bloque dentro/ }).click();
  await pagina.selectOption("#block-type", "proof");
  await pagina.fill("#block-content", "Consecuencia");
  await pagina.click("#add-block");
  await pagina.getByRole("button", { name: /^Plegar rama/ }).click();
  const prueba = pagina.locator(".block-children article");
  assert.equal(await prueba.isVisible(), false);
  await pagina.fill("#structure-search", "consecuencia");
  assert.equal(await prueba.isVisible(), true);
  await pagina.fill("#structure-search", "");
  assert.equal(await prueba.isVisible(), false);
  await pagina.reload();
  await pagina.click("#recover-session");
  assert.equal(await prueba.count(), 1);
  assert.equal(await prueba.isVisible(), false);
});

test("el modo de concentración y los paneles estrechos conservan borrador y selección", opciones, async t => {
  const { pagina } = await sesionDePrueba(t, "Pixel 7");
  for (const width of [320, 360, 390, 430]) {
    await pagina.setViewportSize({ width, height: 800 });
    assert.ok(await pagina.evaluate(() => document.documentElement.scrollWidth <= innerWidth), String(width));
  }
  const campo = pagina.locator("#block-content");
  await campo.fill("Borrador");
  await campo.evaluate(el => el.setSelectionRange(1, 4));
  await pagina.click("#focus-writing");
  assert.equal(await pagina.locator("#focus-writing").getAttribute("aria-pressed"), "true");
  await irAlPanel(pagina, "Estructura");
  await irAlPanel(pagina, "Escribir");
  assert.equal(await campo.inputValue(), "Borrador");
  assert.deepEqual(await campo.evaluate(el => [el.selectionStart, el.selectionEnd]), [1, 4]);
});

test("una integral doble marcada como favorita se inserta desde la hoja táctil", opciones, async t => {
  const { pagina } = await sesionDePrueba(t, "Pixel 7");
  const campo = pagina.locator("#block-content");
  await campo.fill(" f");
  await campo.evaluate(el => el.setSelectionRange(0, 0));
  await pagina.tap("#thumb-symbols");
  await pagina.fill("#symbol-search", "integral doble");
  await pagina.tap("#symbol-favorite");
  const integral = pagina.locator('[data-symbol-id="int-1"]');
  await integral.tap();
  assert.equal(await integral.getAttribute("aria-pressed"), "true");
  assert.equal(await campo.inputValue(), " f");
  await pagina.tap("#symbol-favorite");
  await pagina.getByRole("button", { name: "Favoritos", exact: true }).tap();
  await integral.tap();
  assert.equal(await campo.inputValue(), "\\iint f");
});
