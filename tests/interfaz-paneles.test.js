import test, { after } from "node:test";
import assert from "node:assert/strict";
import { cerrar, foco, omitir, sesionDePrueba } from "./navegador.mjs";

after(cerrar);
const opt = { skip: omitir };
const tab = (p, name) => p.getByRole("tab", { name: name === "Estructura" ? /^Estructura · \d+$/ : name, exact: true });
const actual = p => p.getByRole("tab", { selected: true }).innerText();

test("las cuatro pestañas alternan con flechas, Inicio y Fin y recuerdan la vista matemática", opt, async t => {
  const { pagina: p } = await sesionDePrueba(t, "Pixel 7");
  assert.equal(await p.getByRole("tablist").getByRole("tab").count(), 4);
  assert.equal(await actual(p), "Escribir");
  const preview = p.locator(".math-preview-panel");
  assert.equal(await preview.getAttribute("open"), null);
  await preview.locator("summary").tap();
  await p.reload();
  assert.notEqual(await preview.getAttribute("open"), null);
  await tab(p, "Escribir").press("ArrowRight");
  assert.equal(await actual(p), "Estructura · 0");
  assert.equal(await p.getByRole("tabpanel").count(), 1);
  assert.equal(await p.locator("#thumb-bar").isVisible(), false);
  await tab(p, "Estructura").press("End");
  assert.equal(await actual(p), "Más");
  await tab(p, "Más").press("Home");
  assert.equal(await actual(p), "Escribir");
});

test("Ir a, el editor de una tarjeta y los avisos revelan y enfocan su destino", opt, async t => {
  const { pagina: p } = await sesionDePrueba(t, "Pixel 7");
  assert.equal(await p.getByRole("tab").count(), 4);
  await tab(p, "Documento").tap();
  await p.fill("#note-title", "Navegación");
  await tab(p, "Escribir").tap();
  await p.fill("#block-content", "\\ref{no-existe}");
  await p.tap("#thumb-add");
  for (const [name, panel, selector] of [["Contenido","Escribir","#block-content"],["Estructura","Estructura","#global-menu"],
    ["Resultado","Documento","#generate"],["Versiones","Más","#versions-heading"],["Preferencias","Más","#writing-preferences > summary"]]) {
    await tab(p, "Estructura").tap();
    await p.tap("#panel-menu");
    await p.getByRole("menuitem", { name: "Ir a…" }).tap();
    await p.getByRole("menuitem", { name, exact: true }).tap();
    assert.equal(await actual(p), panel === "Estructura" ? "Estructura · 1" : panel);
    assert.ok(await p.locator(selector).evaluate(el => el === document.activeElement));
  }
  await tab(p, "Documento").tap();
  await p.tap("#generate");
  await p.getByRole("link", { name: "Ir al bloque Texto" }).tap();
  assert.equal(await actual(p), "Estructura · 1");
  await p.getByRole("button", { name: /^Editar Texto,/ }).tap();
  assert.equal(await actual(p), "Escribir");
  assert.equal(await foco(p), "type-chip");
});

test("los cuatro paneles caben en dos pantallas con cinco bloques de una línea", opt, async t => {
  const { pagina: p } = await sesionDePrueba(t,"Pixel 7");
  assert.equal(await p.getByRole("tab").count(), 4);
  await tab(p, "Documento").tap();
  await p.fill("#note-title","Dimensiones");
  await tab(p, "Escribir").tap();
  for (let i=0; i<5; i++) { await p.fill("#block-content", "Línea " + i); await p.tap("#thumb-add"); }
  for (const name of ["Escribir","Estructura","Documento","Más"]) {
    await tab(p,name).tap();
    assert.ok(await p.evaluate(() => document.documentElement.scrollHeight <= innerHeight * 2), name);
  }
});
