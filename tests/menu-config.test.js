import test from "node:test";
import assert from "node:assert/strict";
import { loadTexNotes } from "./load-app.mjs";
const T = await loadTexNotes(["block-types.js","block-tree.js","math-symbols.js","math-preview.js","editing-assist.js","completion.js","shortcuts.js","actions.js","menus.js","radial.js","config-parts.js","menu-config.js"]);
const ring = (id,slices,replaces=null) => ({id,label:id,replaces,slices});
test("la resolución mantiene las ocho posiciones e incorpora los sectores predeterminados", () => {
  const data = T.defaultMenus();
  data.rings.push(ring("uno",[null,{symbol:"beta"},{action:"edit.undo"}],"formula"));
  assert.equal(T.validateMenus(data).length,0);
  const result = T.resolveMenu(data,"formula","equation").slices;
  assert.equal(result.length,8); assert.equal(result[0].id,"frac"); assert.equal(result[1].action.symbol,"beta");
  assert.equal(result[2].action.id,"edit.undo"); assert.equal(result[7].id,"greek");
  assert.equal(T.resolveMenu(data,"text","text").slices[0].id,"bold");
  for (const bar of [false,true]) {
    const r=T.fitMenu({x:160,y:180,bar},{width:320,height:450},8);
    assert.ok(r.outer-r.inner >= 44 && r.span*(r.outer+r.inner)/2/r.n >= 44);
  }
});
test("cada error identifica su campo y los ciclos incluyen enlaces de submenú", () => {
  const data=T.defaultMenus();
  data.rings=[ring("uno",[{submenu:[{ring:"dos"}]}],"text"),ring("dos",[{ring:"uno"},{symbol:"ausente"},{snippet:"#11",label:"",icon:"muy largo"},{action:"?"}],"text")];
  const errors=T.validateMenus(data).join(" ");
  for (const s of ["crea un ciclo","replaces","symbol","snippet","label","icon","action"]) assert.ok(errors.includes(s));
  const invalid={...data,button:"ring:desconocido",rings:Array(7).fill(ring("uno",Array(9).fill(null)))};
  for (const field of ["rings","id","slices","button"]) assert.match(T.validateMenus(invalid).join(" "),new RegExp(field+":"));
});
test("un anillo independiente conserva enlaces, huecos y submenús en el archivo portátil", () => {
  const data=T.defaultMenus(); data.rings=[ring("uno",[{ring:"dos"}]),ring("dos",[{submenu:[null,{action:"edit.redo"}]}])];
  data.button="ring:uno";
  const migrated = T.migrateMenus(data);
  const checked=T.validateConfig({kind:"notas-latex-config",version:2,parts:{menus:{version:1,value:migrated}}});
  assert.equal(checked.errors.length,0); assert.equal(checked.values.menus.button,data.button);
  assert.equal(T.resolveMenu(data,"text","text",{},"uno").slices[0].action.id,"dos");
  assert.equal(T.resolveMenu(data,"text","text",{},"dos").slices[0].children[0].disabled,true);
  assert.equal(T.migrateMenus(null).button,"edit.undo");
});
