import test, { after } from "node:test";
import assert from "node:assert/strict";
import { cerrar, omitir, sesionDePrueba, centro, mantener, arrastrar, foco } from "./navegador.mjs";

after(cerrar);
const opciones = { skip: omitir };

const menu = (p, nombre) => p.getByRole("menu", { name: nombre, exact: true });
const soltar = s => s.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });

test("la barra abre texto, fórmula e imagen y Menú general abre acciones generales", opciones, async t => {
  const { pagina: p } = await sesionDePrueba(t, "Pixel 7");
  for (const [tipo, nombre] of [["text", "texto"], ["equation", "fórmula"], ["image", "imagen"]]) {
    await p.selectOption("#block-type", tipo);
    await p.tap("#thumb-menu");
    await menu(p, "Menú de " + nombre).waitFor();
    await p.keyboard.press("Escape");
  }
  await p.tap("#global-menu");
  await menu(p, "Menú de acciones generales").waitFor();
});

test("mantener una tarjeta abre sus acciones y mantener la estructura vacía abre el menú general", opciones, async t => {
  const { pagina: p, cdp } = await sesionDePrueba(t, "Pixel 7");
  const s = await cdp();
  await mantener(s, await centro(p.locator("#empty-blocks")));
  await menu(p, "Menú de acciones generales").waitFor();
  await soltar(s);
  await p.fill("#block-content", "Contenido guardado");
  await p.tap("#thumb-add");
  await mantener(s, await centro(p.locator("#block-list article h4")));
  await menu(p, "Menú del bloque").waitFor();
  assert.equal(await p.inputValue("#block-content"), "");
  await soltar(s);
});

test("clic derecho y Mayús+F10 abren el anillo y Griegas inserta el símbolo elegido", opciones, async t => {
  const { pagina: p } = await sesionDePrueba(t);
  await p.selectOption("#block-type", "equation");
  await p.locator("#block-content").click({ button: "right" });
  await menu(p, "Menú de fórmula").waitFor();
  await p.keyboard.press("Escape");
  await p.locator("#block-content").press("Shift+F10");
  assert.equal(await p.locator(":focus").getAttribute("role"), "menuitem");
  await p.getByRole("menuitem", { name: "Griegas" }).click();
  const grupo = menu(p, "Griegas");
  await grupo.getByRole("menuitem").first().click();
  assert.match(await p.inputValue("#block-content"), /\\alpha/);
  assert.equal(await foco(p), "block-content");
});

test("el arrastre desde Menú envuelve la selección en el primer argumento", opciones, async t => {
  const { pagina: p, cdp } = await sesionDePrueba(t, "Pixel 7");
  await p.fill("#block-content", "idea");
  await p.locator("#block-content").press("Control+a");
  const inicio = await centro(p.locator("#thumb-menu"));
  // Quinto sector de texto en la media luna de la barra: Enlace.
  const angulo = Math.PI / 16;
  const fin = { x: inicio.x + 90 * Math.sin(angulo), y: inicio.y - 90 * Math.cos(angulo) };
  await arrastrar(await cdp(), [inicio, fin]);
  assert.equal(await p.inputValue("#block-content"), "\\href{idea}{}");
});

test("un segundo dedo cancela el anillo antes de aplicar una acción", opciones, async t => {
  const { pagina: p, cdp } = await sesionDePrueba(t, "Pixel 7");
  const s = await cdp(), punto = await centro(p.locator("#thumb-menu"));
  await s.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...punto, id: 1 }] });
  await menu(p, "Menú de texto").waitFor();
  await s.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...punto, id: 1 }, { x: punto.x + 30, y: punto.y - 60, id: 2 }] });
  await menu(p, "Menú de texto").waitFor({ state: "hidden" });
  await soltar(s);
  assert.equal(await p.inputValue("#block-content"), "");
});
