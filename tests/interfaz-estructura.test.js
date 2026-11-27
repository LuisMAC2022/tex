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
  assert.match(await activo(p), /^Editar 2 /);
  await accion(p, 2, /^Subir/);
  assert.match(await tarjeta(p, 1).innerText(), /Dos/);
  assert.match(await activo(p), /^Subir 2 /);
  await accion(p, 1, /^Bajar/);
  assert.match(await tarjeta(p, 2).innerText(), /Dos/);
  assert.match(await activo(p), /^Subir 3 /);
});

test("copiar y pegar usan la bandeja y el foco pasa a la copia", opciones, async t => {
  const { pagina: p } = await sesionDePrueba(t);
  await añadir(p, "Copiable");
  await accion(p, 0, /^Copiar .*a la bandeja/);
  assert.match(await activo(p), /a la bandeja/);
  assert.ok(await p.locator("#tray-summary").isVisible());
  await p.click("#paste-block");
  assert.match(await activo(p), /^Editar 2 /);
  assert.match(await tarjeta(p, 1).innerText(), /Copiable/);
});

test("eliminar un padre pide confirmación, mueve el foco y permite deshacer y rehacer", opciones, async t => {
  const { pagina: p } = await sesionDePrueba(t);
  await añadir(p, "Padre");
  await tarjeta(p, 0).getByRole("button", { name: /^Añadir un bloque dentro/ }).click();
  await añadir(p, "Hijo");
  p.once("dialog", d => d.dismiss());
  await accion(p, 0, /^Eliminar/);
  assert.match(await activo(p), /^Eliminar 1 /);
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
