import test, { after } from "node:test";
import assert from "node:assert/strict";
import { cerrar, omitir, sesionDePrueba } from "./navegador.mjs";

after(cerrar);
test("la carga móvil encuentra el icono y precarga las dos fuentes locales de KaTeX", {skip: omitir}, async t => {
  const {pagina:p} = await sesionDePrueba(t, "Pixel 7");
  const fallos = [];
  p.on("response", r => { if (r.status() >= 400) fallos.push([r.status(), r.url()]); });
  await p.route("https://editor.test/**", async ruta => {
    const path = new URL(ruta.request().url()).pathname.slice(1) || "index.html";
    try { await ruta.fulfill({ path: new URL("../" + path, import.meta.url).pathname }); }
    catch (error) { if (error.code !== "ENOENT") throw error; await ruta.fulfill({status:404}); }
  });
  await p.goto("https://editor.test/");
  const fuentes = await p.locator('link[rel=preload][as=font][crossorigin]').evaluateAll(nodes => nodes.map(e=>new URL(e.href).pathname.split("/").pop()));
  assert.deepEqual(fuentes.sort(), ["KaTeX_Main-Regular.woff2","KaTeX_Math-Italic.woff2"]);
  const icono = p.locator('link[rel=icon]');
  assert.equal(await icono.evaluate(async e => (await fetch(e.href)).status),200);
  await p.fill("#block-content","Una tarjeta");
  await p.tap("#thumb-add");
  await p.tap("#tab-tree");
  assert.equal(await p.locator("#block-list article").evaluate(e=>getComputedStyle(e).contentVisibility),"auto");
  assert.deepEqual(fallos,[]);
});
