/**
 * Pruebas de interfaz en Chromium (DEC-029). Se omiten sin Playwright.
 *
 * No sustituyen a la revisión manual: Android real, Gboard, TalkBack y NVDA
 * siguen allí. Fijan los recorridos que se rompían sin que nadie lo notara
 * hasta abrir el teléfono.
 */
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { abrir, cerrar, deslizar, omitir } from "./navegador.mjs";

after(cerrar);
const opciones = { skip: omitir };

async function escribirComando(pagina, texto) {
  await pagina.fill("#note-title", "Prueba");
  await pagina.selectOption("#block-type", "equation");
  await pagina.locator("#block-content").tap();
  await pagina.keyboard.type(texto);
  await pagina.locator("#assist-list > li").first().waitFor();
}
const opcionActiva = (pagina) => pagina.evaluate(() =>
  [...document.querySelectorAll("#assist-list > li")].findIndex((li) => li.getAttribute("aria-selected") === "true"));

test("la página abre sin errores en escritorio y en el teléfono", opciones, async () => {
  for (const dispositivo of [undefined, "Pixel 7"]) {
    const { pagina, contexto, errores } = await abrir(dispositivo);
    await pagina.locator("#block-content").waitFor();
    assert.equal(await pagina.locator("#thumb-bar").isVisible(), dispositivo !== undefined, "la barra del pulgar es solo táctil");
    assert.deepEqual(errores, [], dispositivo || "escritorio");
    await contexto.close();
  }
});

test("añadir un bloque y generar deja su contenido literal en el código LaTeX", opciones, async () => {
  const { pagina, contexto, errores } = await abrir();
  await pagina.fill("#note-title", "Nota de prueba");
  await pagina.fill("#block-content", String.raw`Sea $f\colon \mathbb{R}\to\mathbb{R}$ continua.`);
  await pagina.getByRole("button", { name: "Añadir bloque" }).click();
  await pagina.getByRole("button", { name: "Generar documento" }).click();
  const codigo = await pagina.inputValue("#latex-output");
  assert.match(codigo, /\\begin\{document\}/);
  assert.ok(codigo.includes(String.raw`Sea $f\colon \mathbb{R}\to\mathbb{R}$ continua.`));
  assert.deepEqual(errores, []);
  await contexto.close();
});

test("el dedo desplaza las sugerencias de la barra invertida sin elegir ninguna", opciones, async () => {
  const { pagina, contexto, errores, cdp } = await abrir("Pixel 7");
  await escribirComando(pagina, "\\ri");
  const caja = await pagina.locator("#assist-list > li").nth(1).boundingBox();
  await deslizar(await cdp(), { x: caja.x + 40, y: caja.y + 20 }, -96);
  await pagina.waitForFunction(() => document.querySelector("#assist-list").scrollTop > 0);
  assert.equal(await pagina.inputValue("#block-content"), "\\ri", "deslizar no inserta");
  assert.ok(await pagina.locator("#assist-list").isVisible(), "la lista sigue abierta");
  assert.ok(await pagina.evaluate(() => document.querySelector("#assist-list").scrollTop) > 0, "la lista se desplazó");
  assert.equal(await pagina.locator(".radial-layer").isVisible(), false, "no abre el menú radial");
  assert.deepEqual(errores, []);
  await contexto.close();
});

test("Anterior y Siguiente recorren las sugerencias y tocar una la inserta", opciones, async () => {
  const { pagina, contexto, errores } = await abrir("Pixel 7");
  await escribirComando(pagina, "\\ri");
  await pagina.locator("#thumb-next").tap();
  await pagina.locator("#thumb-next").tap();
  await pagina.locator("#thumb-prev").tap();
  assert.equal(await opcionActiva(pagina), 1);
  assert.equal(await pagina.evaluate(() => document.activeElement.id), "block-content", "la barra no roba el foco");
  await pagina.locator("#assist-list > li").nth(1).tap();
  assert.match(await pagina.inputValue("#block-content"), /^\\[A-Za-z]+/);
  assert.notEqual(await pagina.inputValue("#block-content"), "\\ri");
  assert.equal(await pagina.locator("#assist-list").isVisible(), false);
  assert.equal(await pagina.evaluate(() => document.activeElement.id), "block-content");
  assert.deepEqual(errores, []);
  await contexto.close();
});

test("la lista de sugerencias queda por encima de la barra del pulgar", opciones, async () => {
  const { pagina, contexto, errores } = await abrir("Pixel 7");
  await escribirComando(pagina, "\\a");
  const [lista, barra] = await pagina.evaluate(() => ["#assist-list", "#thumb-bar"].map((s) => document.querySelector(s).getBoundingClientRect().toJSON()));
  assert.ok(lista.bottom <= barra.top, `la lista acaba en ${lista.bottom} y la barra empieza en ${barra.top}`);
  assert.deepEqual(errores, []);
  await contexto.close();
});

test("el botón Menú de la barra abre el menú del contexto y Escape devuelve el foco", opciones, async () => {
  const { pagina, contexto, errores } = await abrir("Pixel 7");
  await pagina.locator("#block-content").tap();
  await pagina.locator("#thumb-menu").tap();
  const menu = pagina.getByRole("menu", { name: "Menú de texto" });
  await menu.waitFor();
  assert.equal(await menu.getByRole("menuitem").count(), 8);
  await pagina.keyboard.press("Escape");
  assert.equal(await pagina.locator(".radial-layer").isVisible(), false);
  assert.equal(await pagina.evaluate(() => document.activeElement.id), "block-content");
  assert.deepEqual(errores, []);
  await contexto.close();
});
