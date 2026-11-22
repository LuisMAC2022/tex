import test from "node:test";
import assert from "node:assert/strict";
import { loadTexNotes } from "./load-app.mjs";
const T=await loadTexNotes(["block-types.js","block-tree.js","latex-generator.js","image-options.js","list-outline.js","versions.js"]);
const doc="d00000001", other="d00000002", when="2026-11-22T00:00:00.000Z";
const block=(id,content,other={})=>({id,type:"text",title:"",content,children:[],...other});
const state=(title="Uno",blocks=[])=>({version:4,documentId:doc,metadata:{title},blocks,macros:[]});
const options=(id,origin="manual")=>({id,origin,label:id,createdAt:when});
const plain=x=>structuredClone(x);
class MemoryStore {
  rows=[];
  async read(){return structuredClone(this.rows);}
  async update(change){this.rows=plain(change(await this.read()));return this.read();}
}
test("el historial limita cien pasos, restaura en ambas direcciones y descarta la rama rehecha", () => {
  let h={past:[],future:[]};
  for(let i=0;i<103;i++) h=T.rememberHistory(h,T.historyEntry(state(String(i)),"b00000001"));
  assert.equal(h.past.length,100); assert.equal(h.past[0].state.metadata.title,"3");
  const current=T.historyEntry(state("fin"),null), undo=T.travelHistory(h,current,"undo");
  assert.equal(undo.entry.state.metadata.title,"102");
  const redo=T.travelHistory(undo.history,undo.entry,"redo");
  assert.equal(redo.entry.state.metadata.title,"fin");
  assert.equal(T.rememberHistory(undo.history,current).future.length,0);
});
test("las diferencias por id abarcan posición, padre, opciones, lista, macros y líneas", () => {
  const a=state("Uno",[block("b00000001","a\nb"),block("b00000002","quito"),block("b00000003","muevo")]);
  const b=state("Dos",[block("b00000004","nuevo"),block("b00000001","a\nc",{type:"itemize",title:"T",options:{width:.4},listFormat:"outline",children:[a.blocks[2]]})]);
  b.macros=[{name:"R",params:0,body:"R"}];
  const diff=T.diffDocuments(a,b);
  assert.equal(diff.added[0].id,"b00000004");assert.equal(diff.removed[0].id,"b00000002");
  assert.equal(diff.moved.length,2);assert.equal(diff.moved[1].to.parent,"b00000001");
  assert.deepEqual(plain(diff.modified[0].fields),["type","title","content","options","listFormat"]);
  assert.deepEqual(plain(diff.modified[0].lines.changes),[{kind:"removed",line:2,text:"b"},{kind:"added",line:2,text:"c"}]);
  assert.equal(diff.metadata[0].key,"title");assert.equal(diff.macros[0].key,"R");
  assert.ok(T.diffLines("a\n".repeat(300),"x").truncated);
});
test("la retención conserva las manuales y cuenta las automáticas por documento", () => {
  let rows=[];
  for (const documentId of [doc,other]) {
    rows=T.addVersion(rows,{...state(),documentId},options("m"+documentId));
    for(let i=0;i<35;i++) rows=T.addVersion(rows,{...state(String(i)),documentId},options(documentId+i,"respaldo"));
  }
  assert.equal(rows.length,62);
  const few=T.pruneVersions(rows,8);assert.equal(few.length,18);
  assert.ok(few.some(v=>v.id===doc+34));assert.ok(!few.some(v=>v.id===doc+1));
});
test("las exportaciones se deduplican por contenido y la migración del borrador es idempotente", async () => {
  const store=new MemoryStore(), raw={version:2,metadata:{title:"Viejo"},blocks:[]};
  for (let i=0;i<2;i++) await store.update(rows=>T.migrateSingleDraft(rows,raw,{documentId:doc,createdAt:when}).rows);
  assert.equal(store.rows.length,1);assert.equal(store.rows[0].label,"Borrador guardado (migrado)");
  for (const [id,title] of [["a","Uno"],["b","Uno"],["c","Dos"]]) {
    await store.update(rows=>T.addVersion(rows,state(title),options(id,"exportación")));
  }
  assert.equal(store.rows.length,3);assert.ok(!store.rows.some(v=>v.id==="b"));
});
test("el proyecto valida, informa qué versiones omite y combina por id sin sobrescribir", () => {
  const current=state(), [v]=T.addVersion([],current,options("v"));
  const project={kind:"notas-latex-proyecto",version:1,documentId:doc,exportedAt:when,current,versions:[v,v,null,{...v,id:"dañada",state:{version:7}}]};
  const checked=T.validateProject(JSON.stringify(project));
  assert.equal(checked.error,null);assert.deepEqual(plain(checked.skipped),["v","posición 3","dañada"]);
  assert.equal(checked.project.versions.length,1);
  assert.equal(T.mergeVersions([v],[{...v,label:"sustituto"}])[0].label,"v");
  for(const raw of ["{",null,{...project,version:7},{...project,current:{version:7}},{...project,current:{version:4,metadata:{},blocks:"texto",macros:[]}}]) assert.ok(T.validateProject(raw).error);
});
