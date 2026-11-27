import test, { after } from "node:test";
import assert from "node:assert/strict";
import { cerrar, omitir, sesionDePrueba, foco } from "./navegador.mjs";

after(cerrar);
const opciones = { skip: omitir };

const tarjeta = (p, i) => p.locator("#block-list article").nth(i);
const activo = p => p.locator(":focus").getAttribute("aria-label");
async function añadir(p, contenido) {
  await p.fill("#block-content", contenido);
  await p.click("#add-block");
}
async function accion(p, i, nombre) {
  const art = tarjeta(p, i);
  const mas = art.locator(".block-more");
  if (await mas.getAttribute("open") === null) await mas.locator("summary").click();
  await art.getByRole("button", { name: nombre }).click();
}

test("editar y añadir dentro sitúan el foco en el tipo y conservan el nivel de los hijos", opciones, async t => {
  const { pagina: p } = await sesionDePrueba(t);
  await añadir(p, "Padre");
  await tarjeta(p, 0).getByRole("button", { name: /^Editar/ }).click();
  assert.equal(await foco(p), "block-type");
  await p.click("#cancel-edit");
  await tarjeta(p, 0).getByRole("button", { name: /^Añadir un bloque dentro/ }).click();
  assert.equal(await foco(p), "block-type");
  await añadir(p, "Hijo");
  assert.match(await tarjeta(p, 1).innerText(), /Hijo/);
  assert.match(await tarjeta(p, 1).getByRole("button", { name: /^Editar/ }).getAttribute("aria-label"), /nivel 2/);
});

test("duplicar, subir y bajar conservan la identidad visible y el foco de la acción", opciones, async t => {
  const { pagina: p } = await sesionDePrueba(t);
  await añadir(p, "Uno");
  await añadir(p, "Dos");
  await accion(p, 0, /^Duplicar/);
  assert.equal(await p.locator("#block-list article").count(), 3);
  assert.match(await activo(p), /^Editar Texto,/);
  assert.equal(await p.locator(":focus").getAttribute("data-path"), "1");
  await accion(p, 2, /^Subir/);
  assert.match(await tarjeta(p, 1).innerText(), /Dos/);
  assert.match(await activo(p), /^Subir Texto,/);
  assert.equal(await p.locator(":focus").getAttribute("data-path"), "1");
  await accion(p, 1, /^Bajar/);
  assert.match(await tarjeta(p, 2).innerText(), /Dos/);
  assert.match(await activo(p), /^Bajar Texto,/);
  assert.equal(await p.locator(":focus").getAttribute("data-path"), "2");
  assert.equal(await p.locator("#structure-move-status").innerText(), "Sin cambios de numeración");
});

test("anidar y sacar anuncian la numeración y mantienen el foco en el botón de la nueva ruta", opciones, async t => {
  const { pagina: p } = await sesionDePrueba(t);
  for (const title of ["Clase", "Pre-Clase", "Repaso"]) {
    if (!(await p.locator("#block-title").isVisible())) await p.click("#title-chip");
    await p.fill("#block-title", title);
    await añadir(p, "Prosa");
  }
  const focused = p.locator(":focus");
  const status = p.locator("#structure-move-status");
  const live = p.locator("#app-status");
  await accion(p, 1, /^Anidar/);
  assert.equal(await focused.getAttribute("data-path"), "0.0");
  assert.equal(await focused.getAttribute("data-action"), "indent");
  assert.ok(await focused.isDisabled());
  assert.match(await focused.getAttribute("title"), /bloque anterior/);
  const nested = "Pre-Clase: 2 → 1.1. Otro bloque cambia de número.";
  assert.equal(await status.innerText(), nested);
  assert.equal(await live.textContent(), nested);

  await p.keyboard.press("Alt+Shift+ArrowRight");
  assert.equal(await live.textContent(), "No hay un bloque anterior donde anidar.");
  assert.equal(await focused.getAttribute("data-path"), "0.0");

  await p.keyboard.press("Alt+Shift+ArrowLeft");
  assert.equal(await focused.getAttribute("data-path"), "1");
  assert.equal(await focused.getAttribute("data-action"), "outdent");
  assert.ok(await focused.isDisabled());
  assert.match(await focused.getAttribute("title"), /raíz/);
  assert.match(await status.innerText(), /^Pre-Clase: 1\.1 → 2\./);

  await p.keyboard.press("Alt+Shift+ArrowRight");
  assert.equal(await focused.getAttribute("data-path"), "0.0");
  assert.equal(await live.textContent(), nested);
  await p.keyboard.press("Alt+Shift+ArrowLeft");

  await accion(p, 1, /^Subir/);
  assert.equal(await focused.getAttribute("data-path"), "0");
  assert.equal(await focused.getAttribute("data-action"), "up");
  assert.match(await live.textContent(), /^Pre-Clase: 2 → 1\./);
});

test("copiar y pegar usan la bandeja y el foco pasa a la copia", opciones, async t => {
  const { pagina: p } = await sesionDePrueba(t);
  await añadir(p, "Copiable");
  await accion(p, 0, /^Copiar .*a la bandeja/);
  assert.match(await activo(p), /a la bandeja/);
  assert.ok(await p.locator("#tray-summary").isVisible());
  await p.click("#paste-block");
  assert.match(await activo(p), /^Editar Texto,/);
  assert.equal(await p.locator(":focus").getAttribute("data-path"), "1");
  assert.match(await tarjeta(p, 1).innerText(), /Copiable/);
});

test("eliminar un padre pide confirmación, mueve el foco y permite deshacer y rehacer", opciones, async t => {
  const { pagina: p } = await sesionDePrueba(t);
  await añadir(p, "Padre");
  await tarjeta(p, 0).getByRole("button", { name: /^Añadir un bloque dentro/ }).click();
  await añadir(p, "Hijo");
  p.once("dialog", d => d.dismiss());
  await accion(p, 0, /^Eliminar/);
  assert.match(await activo(p), /^Eliminar Texto,/);
  assert.equal(await p.locator(":focus").getAttribute("data-path"), "0");
  assert.equal(await p.locator("#block-list article").count(), 2);
  p.once("dialog", d => d.accept());
  await accion(p, 0, /^Eliminar/);
  assert.ok(await p.locator("#empty-blocks").isVisible());
  assert.equal(await foco(p), "add-block");
  await p.click("#undo-structure");
  assert.match(await tarjeta(p, 1).innerText(), /Hijo/);
  await p.click("#redo-structure");
  assert.ok(await p.locator("#empty-blocks").isVisible());
});
