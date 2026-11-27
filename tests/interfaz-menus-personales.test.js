import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { cerrar, omitir, sesionDePrueba, irAlPanel } from "./navegador.mjs";
after(cerrar);

async function preferencias(p, vista = "Más") {
  await irAlPanel(p, vista);
  await p.locator("#writing-preferences > summary").click();
  await p.locator("#personal-menus > summary").click();
}
async function sector(p, posicion) {
  await p.locator("#menu-diagram button").nth(posicion).click();
}
test("un anillo de fórmula, Mi botón y el intercambio conservan las posiciones", {skip:omitir}, async t => {
  const { pagina: p } = await sesionDePrueba(t,"Pixel 7");
  await preferencias(p);
  await p.selectOption("#menu-choice","default:formula");
  await p.fill("#menu-name","Cálculo");
  await sector(p,0);
  await p.getByRole("tab",{name:"Fragmento",exact:true}).click();
  await p.fill("#slice-label","Derivada"); await p.fill("#slice-icon","∂");
  await p.fill("#slice-snippet","f'(#1)#0"); await p.click("#slice-save");
  await sector(p,1);
  await p.getByRole("tab",{name:"Símbolo",exact:true}).click();
  await p.fill("#slice-search","beta"); await p.selectOption("#slice-symbol","beta"); await p.click("#slice-save");
  const ring = await p.locator("#menu-choice").inputValue();
  await p.selectOption("#menu-button","ring:"+ring);
  await irAlPanel(p,"Escribir");
  await p.selectOption("#block-type","equation");
  await p.tap("#block-content"); await p.tap("#thumb-menu");
  await p.getByRole("menuitem",{name:"Derivada",exact:true}).tap();
  assert.equal(await p.locator("#block-content").inputValue(),"f'()");
  await p.tap("#thumb-personal");
  await p.getByRole("menuitem",{name:/beta/i}).tap();
  assert.match(await p.locator("#block-content").inputValue(),/\\beta/);
  await irAlPanel(p,"Más");
  const downloading = p.waitForEvent("download"); await p.click("#export-config");
  const bytes = await readFile(await (await downloading).path());
  const saved = JSON.parse(bytes).parts.menus.value;
  assert.equal(saved.rings[0].slices[0].label,"Derivada");
  assert.equal(saved.rings[0].slices[1].symbol,"beta");
  const { pagina: fresh } = await sesionDePrueba(t,"Pixel 7");
  await preferencias(fresh);
  fresh.once("dialog",d=>d.accept());
  await fresh.setInputFiles("#import-config",{name:"menus.json",mimeType:"application/json",buffer:bytes});
  await fresh.locator("#app-status").filter({hasText:"Configuración importada"}).waitFor();
  assert.equal(await fresh.locator("#menu-button").inputValue(),"ring:"+ring);
  await fresh.selectOption("#menu-choice",ring);
  assert.match(await fresh.locator("#menu-diagram button").first().getAttribute("aria-label"),/Arriba.*Derivada/);
});
test("el editor intercambia posiciones sin arrastrar y permite restaurar el menú", {skip:omitir}, async t => {
  const { pagina:p } = await sesionDePrueba(t);
  await preferencias(p, "Documento"); await p.selectOption("#menu-choice","new");
  await p.fill("#menu-name","Auxiliar"); await sector(p,2);
  await p.getByRole("tab",{name:"Acción",exact:true}).click();
  await p.selectOption("#slice-action","edit.redo"); await p.click("#slice-save");
  await sector(p,2); await p.selectOption("#slice-swap","0"); await p.click("#slice-exchange");
  assert.match(await p.locator("#menu-diagram button").first().getAttribute("aria-label"),/Rehacer/);
  await sector(p,0); await p.click("#slice-reset");
  assert.match(await p.locator("#menu-diagram button").first().getAttribute("aria-label"),/Vacío/);
  await p.click("#menu-reset"); assert.equal(await p.locator("#menu-choice option").filter({hasText:"Auxiliar"}).count(),0);
});
test("el submenú admite un enlace a otro anillo y el aviso de KaTeX permite guardar", {skip:omitir}, async t => {
  const { pagina:p }=await sesionDePrueba(t,"Pixel 7"); await preferencias(p);
  await p.selectOption("#menu-choice","new"); await p.fill("#menu-name","Fórmulas auxiliares"); await sector(p,0);
  await p.getByRole("tab",{name:"Fragmento",exact:true}).click();
  await p.fill("#slice-label","Macro del curso"); await p.fill("#slice-icon","M"); await p.fill("#slice-snippet","\\micurso{#1}");
  await p.locator("#slice-warning").filter({hasText:"Puedes guardarlo"}).waitFor(); await p.click("#slice-save");
  const linked=await p.locator("#menu-choice").inputValue();
  await p.selectOption("#menu-choice","default:text"); await sector(p,3);
  await p.getByRole("tab",{name:"Submenú",exact:true}).click(); await p.fill("#slice-label","Enlaces");
  await p.locator("#slice-children button").first().click(); await p.getByRole("tab",{name:"Submenú",exact:true}).click();
  await p.selectOption("#slice-link",linked); await p.click("#slice-save"); await p.click("#slice-save");
  await irAlPanel(p,"Escribir"); await p.tap("#block-content"); await p.tap("#thumb-menu");
  await p.getByRole("menuitem",{name:"Enlaces",exact:true}).tap();
  await p.getByRole("menuitem",{name:"Fórmulas auxiliares",exact:true}).tap();
  await p.getByRole("menuitem",{name:"Macro del curso",exact:true}).tap();
  assert.equal(await p.locator("#block-content").inputValue(),"\\micurso{}");
});
test("Mi botón habilita una acción de imagen solo en su contexto", {skip:omitir}, async t=>{
  const {pagina:p}=await sesionDePrueba(t,"Pixel 7");
  await preferencias(p); await p.selectOption("#menu-button","image.delete");
  await irAlPanel(p,"Escribir");
  const button=p.locator("#thumb-personal");
  assert.ok(await button.isDisabled());
  await p.selectOption("#block-type","image"); assert.ok(await button.isEnabled());
  await p.selectOption("#block-type","text"); assert.ok(await button.isDisabled());
});
