import test, { after } from "node:test";
import assert from "node:assert/strict";
import { cerrar, omitir, sesionDePrueba, codigo, foco } from "./navegador.mjs";

after(cerrar);
const opciones = { skip: omitir };

async function documento(p) {
  await p.getByRole("tab", { name: "Documento", exact: true }).click();
  await p.fill("#note-title", "Curso");
  await p.getByRole("tab", { name: "Escribir", exact: true }).click();
  await p.fill("#block-content", "Contenido inicial.");
  await p.click("#add-block");
}

test("guardar, comparar y restaurar una versión conserva el respaldo", opciones, async t => {
  const { pagina: p } = await sesionDePrueba(t);
  await documento(p);
  await p.getByRole("tab", { name: "Exportar", exact: true }).click();
  await p.fill("#version-label", "Antes");
  await p.click("#save-version");
  const version = p.locator("#version-list li").filter({ hasText: "Antes" }).first();
  await version.waitFor();
  await p.getByRole("tab", { name: "Escribir", exact: true }).click();
  await p.fill("#block-content", "Añadido después.");
  await p.click("#add-block");
  await p.getByRole("tab", { name: "Exportar", exact: true }).click();
  await version.getByRole("button", { name: /^Ver cambios/ }).click();
  await p.locator("#version-diff").waitFor();
  assert.match(await p.locator("#version-diff").innerText(), /Añadido|Eliminado/);
  p.once("dialog", d => d.accept());
  await version.getByRole("button", { name: /^Restaurar/ }).click();
  await p.getByRole("tab", { name: "Exportar", exact: true }).click();
  await p.getByText(/Versión restaurada\. Se guardó un respaldo/).waitFor();
  assert.equal(await p.locator("#block-list article").count(), 1);
  assert.match(await codigo(p), /Contenido inicial\./);
});

test("un proyecto exportado se importa en un navegador con almacenamiento vacío", opciones, async t => {
  const { pagina: p } = await sesionDePrueba(t);
  await documento(p);
  await p.getByRole("tab", { name: "Exportar", exact: true }).click();
  const descarga = p.waitForEvent("download");
  await p.click("#export-project");
  const archivo = await (await descarga).path();
  const { pagina: otra } = await sesionDePrueba(t);
  await otra.getByRole("tab", { name: "Exportar", exact: true }).click();
  await otra.setInputFiles("#import-project", archivo);
  await otra.getByRole("tab", { name: "Exportar", exact: true }).click();
  await otra.getByText(/Proyecto importado con respaldo/).waitFor();
  assert.equal(await otra.inputValue("#note-title"), "Curso");
  assert.match(await codigo(otra), /Contenido inicial\./);
});

test("recuperar tras recargar devuelve los bloques y el texto a medio escribir", opciones, async t => {
  const { pagina: p } = await sesionDePrueba(t);
  await documento(p);
  await p.fill("#block-content", "Pendiente");
  await p.reload();
  await p.click("#recover-session");
  assert.match(await p.locator("#block-list article").innerText(), /Contenido inicial/);
  assert.equal(await p.inputValue("#block-content"), "Pendiente");
  assert.equal(await foco(p), "block-content");
});
