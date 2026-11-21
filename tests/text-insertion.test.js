import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTexNotes } from './load-app.mjs';
const { diffEdit } = await loadTexNotes(['text-insertion.js']);
test('diffEdit calcula inserciones, borrados y reemplazos mínimos sin cambios ficticios', () => {
 for (const [oldValue,newValue,want] of [['abc','abc',null],['ac','abc',{start:1,end:1,text:'b'}],['abc','ac',{start:1,end:2,text:''}],['abc','axc',{start:1,end:2,text:'x'}],['bc','abc',{start:0,end:0,text:'a'}],['ab','abc',{start:2,end:2,text:'c'}]]) assert.deepEqual(structuredClone(diffEdit(oldValue,newValue)),want);
});
test('diffEdit nunca divide un par sustituto UTF-16 en sus límites', () => {
 for(const [a,b] of [['x𝔸y','x𝔹y'],['𝔸','𝔸x'],['x𝔸','𝔸'],['𝔸',''],['𝔸','𝕀']]){
  const e=diffEdit(a,b); assert.equal(a.slice(0,e.start)+e.text+a.slice(e.end),b);
  for(const i of [e.start,e.end]) assert.ok(!(i>0&&i<a.length&&/[\uD800-\uDBFF]/.test(a[i-1])&&/[\uDC00-\uDFFF]/.test(a[i])));
 }
});
