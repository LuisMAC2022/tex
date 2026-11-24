import test, { after } from "node:test";
import assert from "node:assert/strict";
import { arrastrar, centro, cerrar, foco, mantener, omitir, sesionDePrueba } from "./navegador.mjs";

after(cerrar);
const opts = { skip: omitir };
const modo = p => p.locator("#thumb-selection").getAttribute("data-mode");

test("la barra alterna cursor, selección y sugerencias conservando el foco", opts, async t => {
  const { pagina: p } = await sesionDePrueba(t, "Pixel 7");
  const campo = p.locator("#block-content");
  await campo.fill("dos palabras");
  await campo.press("Home");
  assert.equal(await modo(p), "cursor");
  await p.tap("#thumb-next");
  const avance = await campo.evaluate(e => e.selectionStart);
  assert.ok(avance > 0);
  await p.tap("#thumb-prev");
  assert.equal(await campo.evaluate(e => e.selectionStart), 0);
  await p.tap("#thumb-selection");
  assert.equal(await modo(p), "selection");
  await p.tap("#thumb-next");
  assert.ok(await campo.evaluate(e => e.selectionEnd > e.selectionStart));
  await p.tap("#thumb-prev");
  await p.tap("#thumb-selection");
  await campo.fill("");
  await p.keyboard.type("\\te");
  await p.locator('#thumb-selection[data-mode="suggestions"]').waitFor();
  await p.tap("#thumb-next");
  assert.equal(await campo.getAttribute("aria-activedescendant"), "assist-option-1");
  await p.tap("#thumb-prev");
  await p.tap("#thumb-selection");
  assert.equal(await modo(p), "cursor");
  assert.equal(await p.locator("#assist-list").isVisible(), false);
  assert.equal(await foco(p), "block-content");
});

test("Mi botón deshace el texto y a 320 píxeles los siete objetivos caben", opts, async t => {
  const { pagina: p } = await sesionDePrueba(t, "Pixel 7");
  await p.setViewportSize({ width: 320, height: 690 });
  await p.locator("#block-content").focus();
  await p.keyboard.type("x");
  await p.tap("#thumb-personal");
  assert.equal(await p.inputValue("#block-content"), "");
  assert.equal(await foco(p), "block-content");
  const medidas = await p.locator("#thumb-bar button").evaluateAll(nodes => nodes.map(b => {
    const r = b.getBoundingClientRect();
    return [r.width, r.height, r.left, r.right];
  }));
  assert.equal(medidas.length, 7);
  assert.ok(medidas.every(([w, h, x, fin]) => w >= 44 && h >= 44 && x >= 0 && fin <= 320), JSON.stringify(medidas));
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth), 320);
});

test("arrastrar navega por unidades y mantener Siguiente amplía una vez", opts, async t => {
  const { pagina: p, cdp } = await sesionDePrueba(t, "Pixel 7");
  const campo = p.locator("#block-content");
  await campo.fill("abcde");
  await campo.press("Home");
  const s = await cdp(), inicio = await centro(p.locator("#thumb-prev"));
  await arrastrar(s, [inicio, { x: inicio.x + 29, y: inicio.y }, { x: inicio.x + 58, y: inicio.y }]);
  assert.equal(await campo.evaluate(e => e.selectionStart), 2);
  await mantener(s, await centro(p.locator("#thumb-next")));
  await p.locator('#thumb-selection[aria-pressed="true"]').waitFor();
  await s.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  assert.ok(await campo.evaluate(e => e.selectionEnd > e.selectionStart));
});

test("arrastrar desde Símbolos elige la categoría que abre la hoja", opts, async t => {
  const { pagina: p, cdp } = await sesionDePrueba(t, "Pixel 7");
  await p.locator("#block-content").focus();
  const inicio = await centro(p.locator("#thumb-symbols"));
  await arrastrar(await cdp(), [inicio, {x: inicio.x, y: inicio.y - 30}, {x: inicio.x, y: inicio.y - 90}]);
  assert.ok(await p.locator("#close-symbol-sheet").isVisible());
  assert.equal(await p.locator('#symbol-category-picker [aria-pressed="true"]').count(), 1);
});
