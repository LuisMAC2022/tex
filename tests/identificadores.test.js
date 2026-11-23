import test from "node:test";
import assert from "node:assert/strict";
import { loadTexNotes } from "./load-app.mjs";
import { exampleState } from "./example-state.mjs";
const T = await loadTexNotes(["block-types.js","block-tree.js","latex-generator.js","image-options.js","list-outline.js","templates.js"]);
const generator = () => { let i = 0; return prefix => prefix + (++i).toString(36).padStart(8,"0"); };
const ids = tree => Array.from(T.flattenBlocks(tree), e => e.block.id);
const node = (content, id, children = []) => ({type:"text",content,id,children});
test("los identificadores de bloque son únicos en todo el árbol", () => {
  const gen = generator(), fixed = "b00000003";
  const raw = [node("padre",undefined,[node("hijo",fixed)]),node("otro",fixed),node("mal",55)];
  const original = T.normalizeDraft({version:2,metadata:{},blocks:raw},gen);
  assert.equal(original.blocks[0].children[0].id,fixed);
  const dup = T.duplicateBlock(original.blocks,[0],gen);
  const pasted = T.insertBlock(dup.blocks,[],T.cloneBlock(dup.blocks[0]),-1,gen);
  const template = T.templateFromBranch(original.blocks[0],{id:"prueba",name:"Prueba",trigger:"prueba"});
  let tree = pasted.blocks;
  for (let n=0;n<2;n++) for (const step of template.steps) {
    assert.ok(!Object.hasOwn(step.block,"id"));
    tree = T.insertBlock(tree,[],step.block,-1,gen).blocks;
  }
  const identifiers = ids(tree);
  assert.equal(new Set(identifiers).size,identifiers.length);
  assert.ok(identifiers.every(id => /^b[0-9a-z]{8}$/.test(id)));
  assert.ok(dup.id !== original.blocks[0].id);
  const moved = T.moveBlockTo(tree,[0],[2]);
  assert.equal(T.blockAtPath(moved.blocks,T.pathOfId(moved.blocks,fixed)).content,"hijo");
  assert.deepEqual(ids(moved.blocks).sort(),identifiers.sort());
  const edited = T.updateBlock(moved.blocks,T.pathOfId(moved.blocks,fixed),{content:"nuevo"});
  assert.equal(T.blockAtPath(edited,T.pathOfId(edited,fixed)).content,"nuevo");
});
test("los borradores anteriores migran al esquema vigente y conservan su identidad al volver a abrir", () => {
  for (const version of [1,2,3,4]) {
    const draft=T.normalizeDraft({version,metadata:{},blocks:[node("a"),node("b")]},generator());
    assert.equal(draft.migratedFrom,version); assert.equal(draft.version,T.DRAFT_VERSION); assert.match(draft.documentId,/^d[0-9a-z]{8}$/);
    const restored=T.normalizeDraft(JSON.parse(JSON.stringify(draft)),generator());
    assert.deepEqual(ids(restored.blocks),ids(draft.blocks)); assert.equal(restored.documentId,draft.documentId);
  }
  assert.equal(T.normalizeDraft({version:T.DRAFT_VERSION+1,metadata:{}}),null);
  const circular=node("ciclo"); circular.children.push(circular);
  assert.equal(T.normalizeDraft({version:4,metadata:{},blocks:[circular]}),null);
});
test("los identificadores del estado de ejemplo no alteran un byte de LaTeX", () => {
  const draft=T.normalizeDraft({version:4,...exampleState},generator());
  assert.equal(T.generateLatex(draft),T.generateLatex(exampleState));
});
