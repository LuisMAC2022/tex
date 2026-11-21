import test from "node:test";
import assert from "node:assert/strict";
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {loadTexNotes} from './load-app.mjs';
const T = await loadTexNotes(['block-types.js','block-tree.js','latex-generator.js','math-symbols.js','math-preview.js','image-options.js','list-outline.js','content-check.js','editing-assist.js','completion.js','templates.js']);
const ctx=vm.createContext({}); vm.runInContext(await readFile('assets/vendor/katex/katex.min.js','utf8'),ctx);
const plain=x=>structuredClone(x);

test("las once plantillas incluidas son válidas, renderizan sus fórmulas y no producen errores previos", () => {
 assert.equal(T.BUILTIN_TEMPLATES.length,11);
 for(const template of T.BUILTIN_TEMPLATES){
  assert.deepEqual(plain(T.validateTemplate(template,T.BUILTIN_TEMPLATES.filter(t=>t.id!==template.id))),[],template.id);
  for(const {block} of template.steps){
   const content=T.parseSnippet(block.content).text;
   for(const segment of T.mathSegments(content,block.type)) assert.doesNotThrow(()=>ctx.katex.renderToString(segment.math,{throwOnError:true,strict:false}),template.id);
   assert.deepEqual(plain(T.checkBlock({...block,content})).filter(i=>i.severity==='error'),[],template.id);
  }
 }
});
test("las plantillas rechazan saltos de profundidad, padres incompatibles, tipos y comandos duplicados", () => {
 const base=T.BUILTIN_TEMPLATES[1];
 for(const template of [{...base,trigger:'def'},{...base,trigger:'UP'},{...base,steps:[]},{...base,steps:[{...base.steps[0],depth:1}]},{...base,steps:[base.steps[0],{...base.steps[1],depth:2}]},{...base,steps:[{...base.steps[0],block:{type:'equation',title:'',content:'x'}},base.steps[1]]},{...base,steps:[{depth:0,block:{type:'desconocido',title:'',content:'x'}}]}]) assert.ok(T.validateTemplate(template,[]).length);
 assert.ok(T.validateTemplate(base,[base]).length);
});
test("el menú / deriva tipos de la tabla, tolera acentos y separa el título", () => {
 const state=text=>({value:text,selectionStart:text.length,selectionEnd:text.length});
 for(const type of T.BLOCK_TYPES) for(const command of type.slash) assert.ok(T.slashCompletions(state('/'+command)).entries.some(e=>e.typeId===type.id));
 const r=T.slashCompletions(state('/teo Fubini')); assert.equal(r.entries[0].typeId,'theorem'); assert.equal(r.token.title,'Fubini');
 assert.equal(T.slashCompletions(state('/definición')).entries[0].typeId,'definition');
 assert.equal(T.slashCompletions(state('/inexistente título')).entries.length,0);
 assert.equal(T.slashCompletions(state('texto /teo')),null);
 assert.equal(T.slashCompletions(state('/ejres')).entries[0].kind,'template');
});
test("la cola usa las rutas insertadas y el teorema y su demostración son hermanos", () => {
 let s={template:T.BUILTIN_TEMPLATES[1],index:0,basePath:[3],paths:[]};
 assert.deepEqual(plain(T.templateParent(s)),[3]); s=T.advanceTemplate(s,[3,2]);
 assert.deepEqual(plain(T.templateParent(s)),[3,2]); s=T.advanceTemplate(s,[3,2,0]);
 assert.deepEqual(plain(T.templateParent(s)),[3,2]); assert.equal(T.advanceTemplate(s,[3,2,1]),null);
 const theorem={template:T.BUILTIN_TEMPLATES[0],index:0,basePath:[],paths:[]};
 assert.deepEqual(plain(T.templateParent(T.advanceTemplate(theorem,[0]))),[]);
});
test("omitir un padre omite su descendencia y capturar una rama conserva opciones de imagen", () => {
 const s={template:T.BUILTIN_TEMPLATES[1],index:0,basePath:[],paths:[]}; assert.equal(T.advanceTemplate(s,null),null);
 const block={type:'text',title:'x',content:'y',children:[{type:'image',title:'pie',content:'a.png',options:{width:0.4,angle:90},children:[]}]};
 const template=T.templateFromBranch(block,{id:'propia',name:'Propia',trigger:'propia'});
 assert.deepEqual(plain(template.steps.map(s=>s.depth)),[0,1]); assert.equal(template.steps[1].block.options.width,0.4);
 assert.equal(template.steps[1].block.options.angle,90); assert.equal(template.steps[0].block.children,undefined);
});
