import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { cerrar, omitir, sesionDePrueba } from "./navegador.mjs";

after(cerrar);
test("Documento permite generar y descargar desde arriba con los cambios confirmados", {skip: omitir}, async t => {
  const { pagina:p } = await sesionDePrueba(t, "Pixel 7");
  await p.fill("#block-content", "Texto confirmado");
  await p.tap("#thumb-add");
  await p.tap("#tab-document");
  const boton = p.getByRole("button",{name:"Generar y descargar",exact:true});
  await boton.waitFor();
  const visible = () => boton.evaluate(b => {
    const r = b.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= innerHeight && b.contains(document.elementFromPoint(r.x+r.width/2, r.y+r.height/2));
  });
  assert.ok(await visible());
  await boton.tap();
  assert.equal(await p.locator("#note-title").getAttribute("aria-invalid"),"true");
  await p.fill("#note-title","Mi nota");
  await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  assert.ok(await visible());
  const descarga = p.waitForEvent("download");
  await boton.tap();
  const archivo = await descarga;
  assert.match(archivo.suggestedFilename(),/\.tex$/);
  const tex = await readFile(await archivo.path(),"utf8");
  assert.match(tex,/Texto confirmado/);
  assert.match(tex,/Mi nota/);
});
test("Vista previa abre el borrador en el portátil", {skip: omitir}, async t => {
  const {pagina:p} = await sesionDePrueba(t);
  await p.fill("#block-content","$x^2$");
  await p.getByRole("button",{name:"Vista previa",exact:true}).click();
  await p.locator("#math-preview .katex").waitFor();
});
