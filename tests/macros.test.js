import test from "node:test";
import assert from "node:assert/strict";
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {loadTexNotes} from './load-app.mjs';
const T=await loadTexNotes(['block-types.js','block-tree.js','latex-generator.js','math-symbols.js','math-preview.js','image-options.js','list-outline.js','content-check.js','editing-assist.js','completion.js','templates.js','macros.js']);
const ctx=vm.createContext({}); vm.runInContext(await readFile('assets/vendor/katex/katex.min.js','utf8'),ctx);
const macros=[{name:'R',params:0,body:String.raw`\mathbb{R}`},{name:'abs',params:1,body:String.raw`\left|#1\right|`}];
const plain=x=>structuredClone(x);

test("borrador v3 conserva macros, migra v1/v2 sin macros y rechaza v4", () => {
 for(const version of [1,2]) assert.deepEqual(plain(T.normalizeDraft({version,metadata:{},blocks:[],macros}).macros),[]);
 const draft={version:3,metadata:{title:'Notas'},blocks:[],macros};
 assert.deepEqual(plain(T.normalizeDraft(JSON.parse(JSON.stringify(draft)))),draft);
 assert.equal(T.normalizeDraft({...draft,version:4}),null);
 const corrupt=[...macros,{name:'x1',params:0,body:'x'},{name:'Good',params:10,body:'x'},{name:'Good',params:1.5,body:'x'},{name:'Good',params:0,body:3},null];
 assert.deepEqual(plain(T.normalizeDraft({...draft,macros:corrupt}).macros),macros);
});
test("el preámbulo añade newcommand literal tras graphicx y no cambia sin macros", () => {
 const preamble=T.buildPreamble(macros);
 assert.ok(preamble.includes(String.raw`\newcommand{\R}{\mathbb{R}}`));
 assert.ok(preamble.includes(String.raw`\newcommand{\abs}[1]{\left|#1\right|}`));
 assert.ok(preamble.indexOf('% Macros personales')>preamble.indexOf('\\usepackage{graphicx}'));
 assert.ok(preamble.indexOf('% Macros personales')<preamble.indexOf('% Los entornos siguientes'));
 assert.equal(T.buildPreamble(),T.buildPreamble([]));
 assert.doesNotMatch(preamble,/\\providecommand/);
 assert.ok(T.generateLatex({metadata:{title:'x'},blocks:[],macros}).includes('\\newcommand{\\R}'));
});
test("la validación de macros protege nombres reservados del catálogo y entornos", () => {
 for(const macro of macros) assert.deepEqual(plain(T.validateMacro(macro)),[]);
 for(const name of ['S','section','frac','forall','alpha','proof','theorem','definition','itemize']) assert.ok(T.validateMacro({name,params:0,body:'x'}).length,name);
 assert.match(T.validateMacro({name:'S',params:0,body:'x'})[0],/signo de sección/);
 assert.ok(T.validateMacro(macros[0],macros).length);
});
test("la definición de macro valida llaves, escapes, una línea y parámetros declarados", () => {
 for(const body of ['', 'x\ny','x\ry','{x','}x{','#0','##','#2']) assert.ok(T.validateMacro({name:'Custom',params:1,body}).length,body);
 for(const body of [String.raw`\{#1\}`,String.raw`\# y {#1}`,String.raw`#1#1`]) assert.deepEqual(plain(T.validateMacro({name:'Custom',params:1,body})),[],body);
 for(const params of [-1,10,0.5,'1']) assert.ok(T.validateMacro({name:'Custom',params,body:'x'}).length);
});
test("la vista previa consume todos los argumentos y aísla gdef entre llamadas", () => {
 const render=(source,list=macros)=>ctx.katex.renderToString(T.macroPreviewDefinitions(list)+source,{macros:T.katexMacros(list),throwOnError:true,strict:false});
 assert.doesNotThrow(()=>render(String.raw`\R + \abs{x}`));
 const unused=render(String.raw`\Custom{x}`,[{name:'Custom',params:1,body:'R'}]);
 assert.ok(unused.includes('<mi>R</mi>')); assert.ok(!unused.includes('<mi>x</mi>'));
 const contaminated=T.katexMacros(macros); ctx.katex.renderToString(String.raw`\gdef\PrivateFoo{x}`,{macros:contaminated});
 assert.ok(contaminated['\\PrivateFoo']); assert.equal(T.katexMacros(macros)['\\PrivateFoo'],undefined);
 assert.throws(()=>render(String.raw`\PrivateFoo`));
});
test("cada comando de katex-only es aceptado por el KaTeX incluido y se señala como error", () => {
 for(const name of T.KATEX_ONLY){
  assert.doesNotThrow(()=>ctx.katex.renderToString('\\'+name+'{x}',{throwOnError:true,strict:false}),name);
  const issues=T.checkContent('\\'+name+'{x}','equation');
  assert.ok(issues.some(i=>i.code==='katex-only'&&i.severity==='error'),name);
 }
});
test("las macros del documento suprimen katex-only y empty/th conservan avisos de significado", () => {
 assert.equal(T.checkBlock({type:'equation',content:'\\R'},[],[],{macros}).length,0);
 assert.equal(T.checkDocument({blocks:[{type:'equation',content:'\\R',children:[]}],macros}).length,0);
 assert.equal(T.checkDocument({blocks:[{type:'equation',content:'\\R',children:[]}]}).length,1);
 for(const name of ['empty','th']) assert.ok(T.checkContent('\\'+name,'equation').some(i=>i.code==='katex-meaning'&&i.severity==='aviso'));
 assert.equal(T.checkContent(String.raw`\\R`,'equation').length,0);
 assert.equal(T.checkContent('% \\R','text').filter(i=>i.code==='katex-only').length,0);
 assert.match(T.checkContent('\\R','equation')[0].message,/\\mathbb\{R\}/);
});
test("las macros aparecen antes del catálogo y se validan al importar configuración", () => {
 const entries=T.completionEntries(macros); assert.equal(entries[0].key,'macro:R');
 assert.equal(T.rankCompletions('abs',entries,{},0,'math')[0].key,'macro:abs');
 const config={kind:'notas-latex-config',version:1,aliases:[],templates:[],prefs:{autoPair:true},macros};
 assert.deepEqual(plain(T.validateConfiguration(config)),[]);
 assert.ok(T.validateConfiguration({...config,macros:[{name:'S',params:0,body:'x'}]}).length);
});
