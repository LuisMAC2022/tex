import test, { after } from "node:test";
import assert from "node:assert/strict";
import { cerrar, omitir, sesionDePrueba } from "./navegador.mjs";
import { medirNavegacion, simbolos } from "../diagnostico/medir-movil.mjs";

after(cerrar);
test("el diagnóstico mide los cinco controles visibles de Estructura", { skip: omitir }, async t => {
  const { pagina } = await sesionDePrueba(t, "Pixel 7");
  await pagina.tap("#tab-tree");
  const botones = await medirNavegacion(pagina);
  assert.deepEqual(botones.map(b => b.id), ["tab-write", "tab-tree", "tab-document", "tab-more", "panel-menu"]);
  assert.ok(botones.every(b => typeof b.dentro === "boolean"));
});

test("la navegación cabe a tamaño normal y permite alcanzar cada destino con texto grande", { skip: omitir }, async t => {
  const { pagina:p } = await sesionDePrueba(t, "Pixel 7");
  for (const width of [320,390,430,195]) {
    await p.setViewportSize({width, height:568});
    await p.locator("#tab-tree").press("Enter");
    if (width !== 195) assert.ok((await medirNavegacion(p)).every(b => b.dentro), width + " px");
    const estilo = await p.addStyleTag({content:"html { font-size: 200% }"});
    assert.ok((await medirNavegacion(p,true)).every(b => b.dentro), width + " px al 200%");
    for (const id of ["tab-document","tab-more"]) {
      await p.locator("#" + id).evaluate(b => b.scrollIntoView({inline:"nearest", block:"nearest"}));
      await p.tap("#" + id);
      assert.equal(await p.locator("#" + id).getAttribute("aria-selected"), "true");
    }
    await estilo.evaluate(e => e.remove());
  }
});

test("la hoja táctil presenta dos filas completas y conserva la selección al insertar", {skip: omitir}, async t => {
  const { pagina:p } = await sesionDePrueba(t, "Pixel 7");
  for (const [width,alto] of [[320,568],[390,844],[430,932]]) {
    for (const height of [alto,Math.floor(alto/2)]) {
      await p.setViewportSize({width,height});
      await p.fill("#block-content","uno dos");
      await p.locator("#block-content").evaluate(e => e.setSelectionRange(3,3));
      await p.tap("#thumb-symbols");
      assert.ok((await simbolos(p)).filas >= 2, width + " × " + height);
      const cursorVisible = await p.locator("#block-content").evaluate(campo => {
        const r = TexNotes.fieldCaretRect(campo);
        return r.top - campo.scrollTop >= document.querySelector("#mobile-navigation").getBoundingClientRect().bottom &&
          r.bottom - campo.scrollTop <= document.querySelector(".symbol-sheet").getBoundingClientRect().top;
      });
      assert.ok(cursorVisible, "Línea del cursor a " + width + " × " + height);
      await p.locator("#symbol-groups button").first().tap();
      assert.equal(await p.locator("#thumb-symbols").getAttribute("aria-expanded"),"false");
      assert.equal(await p.locator(":focus").getAttribute("id"),"block-content");
      assert.match(await p.inputValue("#block-content"),/^uno.+ dos$/);
    }
  }
});
