import test from "node:test";
import assert from "node:assert/strict";
import { loadTexNotes } from "./load-app.mjs";
const T=await loadTexNotes(["block-types.js","block-tree.js","math-symbols.js","math-preview.js","references.js","completion.js","templates.js","suggestion-sources.js"]);
test("la prioridad y la aceptación son de la misma fuente",()=>{
  const registry=T.createSuggestionSources();
  for(const id of ["primera","segunda"]) registry.register({id,match:()=>({kind:id}),entries:t=>[t.kind],accept:(e,t)=>({id,entry:e,kind:t.kind})});
  const first=registry.find({},null,"text");assert.equal(first.entries[0],"primera");
  assert.equal(registry.accept(first.entries[0],first.token).id,"primera");
  assert.equal(registry.find({},null,"text","segunda").token.kind,"segunda");
  assert.equal(registry.find({},null,"comment"),null);
  assert.throws(()=>registry.register({id:"primera"}));
});
test("barra diagonal, referencias, citas, comandos y entornos reconocen sus tokens",()=>{
  const sources=T.createWritingSources({slashActive:()=>true,templates:()=>[],references:()=>[],targets:()=>[],macros:()=>[],usage:()=>({}),now:()=>0});
  const value="/def",state={value,selectionStart:value.length,selectionEnd:value.length};
  const match=sources.find(state,null,"text");assert.equal(match.token.sourceId,"slash");
  assert.equal(sources.accept(match.entries[0],match.token).typeId,"definition");
  const ordinary=T.createWritingSources({slashActive:()=>false,templates:()=>[],references:()=>[],targets:()=>[],macros:()=>[],usage:()=>({}),now:()=>0});
  for(const [input,id] of [["\\ref{","document"],["\\citep{","document"],["\\al","commands"],["\\begin{","commands"]]){
    const result=ordinary.find({value:input,selectionStart:input.length,selectionEnd:input.length},null,"text");
    assert.equal(result.token.sourceId,id);
  }
});
