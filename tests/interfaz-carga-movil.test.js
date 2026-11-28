import test, { after } from "node:test";
import assert from "node:assert/strict";
import { cerrar, omitir, sesionDePrueba } from "./navegador.mjs";

after(cerrar);
test("el editor anuncia la carga y habilita las acciones al terminar", { skip: omitir }, async t => {
  const { pagina } = await sesionDePrueba(t, "Pixel 7");
  let soltar, avisar;
  const pausa = new Promise(resolve => { soltar = resolve; });
  const bloqueado = new Promise(resolve => { avisar = resolve; });
  await pagina.route("https://editor.test/**", async ruta => {
    const path = new URL(ruta.request().url()).pathname.slice(1) || "index.html";
    if (path === "assets/js/app.js") { avisar(); await pausa; }
    await ruta.fulfill({path: new URL("../" + path, import.meta.url).pathname});
  });
  const carga = pagina.goto("https://editor.test/");
  await bloqueado;
  const antes = await pagina.evaluate(() => [document.querySelector("#app-status").textContent,
    [...document.querySelectorAll("#thumb-bar button")].every(b => b.closest("[inert]") || b.disabled),
    document.querySelector("#add-block").disabled]);
  soltar();
  await carga;
  assert.deepEqual(antes, ["Cargando editor…", true, true]);
  assert.equal(await pagina.locator("#app-status").textContent(), "Editor listo.");
  assert.equal(await pagina.locator("#thumb-add").evaluate(b => !b.closest("[inert]") && !b.disabled), true);
  assert.equal(await pagina.locator("#add-block").isEnabled(), true);
});
