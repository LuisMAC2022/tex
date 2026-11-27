import test, { after } from "node:test";
import assert from "node:assert/strict";
import { cerrar, deslizar, foco, irAlPanel, omitir, sesionDePrueba } from "./navegador.mjs";
after(cerrar);
async function arrastreVertical(p, session, selector) {
  const list=p.locator(selector), before=await list.evaluate(n=>n.scrollTop);
  const rect=await list.boundingBox();
  assert.ok(rect && rect.height>55,"la lista ofrece espacio para deslizar");
  const settled=list.evaluate(node=>new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error("El desplazamiento no terminó.")),3000);
    node.addEventListener("scrollend",()=>{clearTimeout(timer);resolve();},{once:true});
  }));
  await Promise.all([settled, deslizar(session,{x:rect.x+Math.min(55,rect.width/2),y:rect.y+rect.height-16},-Math.min(110,rect.height-25))]);
  await p.waitForFunction(({s,y})=>document.querySelector(s).scrollTop>y,{s:selector,y:before},{timeout:2500});
}
async function probarSugerencias(t,command) {
  const {pagina:p,cdp}=await sesionDePrueba(t,"Pixel 7");
  if(command==="\\citep{") {
    await irAlPanel(p,"Documento"); await p.click("#document-references > summary"); await p.click("#add-course-references");
    await irAlPanel(p,"Escribir");
  }
  if(command==="\\ref{"){
    for(let i=0;i<8;i++){
      await p.selectOption("#block-type", "equation");
      await p.locator("#label-fields > summary").tap();
      await p.fill("#block-label", "ec:prueba" + i);
      await p.fill("#block-content", String(i));
      await p.tap("#thumb-add");
    }
    await p.selectOption("#block-type","text");
  }
  const field=p.locator("#block-content");await field.tap(); await p.keyboard.type(command);
  const list=p.locator("#assist-list");await list.waitFor();
  const initial=await field.inputValue();assert.ok(await list.getByRole("option").count() >= 7);
  await arrastreVertical(p,await cdp(),"#assist-list");
  assert.equal(await field.inputValue(),initial);
  await p.tap("#thumb-next");
  assert.equal(await list.locator('[aria-selected="true"]').getAttribute("id"),"assist-option-1");
  await p.tap("#thumb-prev");
  assert.equal(await list.locator('[aria-selected="true"]').getAttribute("id"),"assist-option-0");
  await p.tap("#thumb-selection");
  assert.equal(await list.isVisible(),false); assert.equal(await foco(p),"block-content");
}
test("la lista de barra diagonal se desplaza con el dedo y se recorre con la barra", {skip:omitir}, t => probarSugerencias(t,"/"));
test("la lista de referencias se desplaza con el dedo y se recorre con la barra", {skip:omitir}, t => probarSugerencias(t,"\\ref{"));
test("la lista de citas se desplaza con el dedo y se recorre con la barra", {skip:omitir}, t => probarSugerencias(t,"\\citep{"));

test("Mover bloque permite recorrer destinos con el dedo y trasladar al elegido", {skip:omitir},async t=>{
  const {pagina:p,cdp}=await sesionDePrueba(t,"Pixel 7");
  for(let i=0;i<10;i++){await p.fill("#block-content","Destino "+i);await p.tap("#thumb-add");}
  await irAlPanel(p,"Estructura"); await p.locator("#block-list article").first().locator('[data-action="context"]').tap();
  await p.getByRole("menuitem",{name:"Mover…"}).tap();
  const list=p.locator("#move-block-destination");
  await arrastreVertical(p,await cdp(),"#move-block-destination");
  assert.equal(await list.inputValue(),"");
  await list.locator("option").last().tap(); await p.locator("#move-block-form button[type=submit]").click();
  const edit=p.locator("#block-list article").last().locator('[data-action="edit"]');
  assert.match(await edit.getAttribute("aria-label"),/nivel 2/);
  const focused = p.locator(":focus");
  assert.equal(await focused.getAttribute("data-action"), "move");
  assert.equal(await focused.getAttribute("data-path"), await edit.getAttribute("data-path"));
  assert.equal(await p.locator("#structure-move-status").innerText(), "Sin cambios de numeración");
});
