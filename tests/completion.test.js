import test from "node:test";
import assert from "node:assert/strict";
import { loadTexNotes } from "./load-app.mjs";
const T = await loadTexNotes(['block-types.js','math-symbols.js','math-preview.js','editing-assist.js','completion.js']);
const state = (value, cursor=value.length) => ({value,selectionStart:cursor,selectionEnd:cursor});
const plain = value => structuredClone(value);

test("los fragmentos ordenan marcadores numéricos, preservan escapes y encuentran llaves vacías", () => {
 assert.deepEqual(plain(T.parseSnippet('a#2b#1c#0d')), {text:'abcd',holes:[2,1],final:3});
 assert.deepEqual(plain(T.parseSnippet(String.raw`\#1 #1 #0`)),{text:String.raw`\#1  `,holes:[4],final:5});
 assert.deepEqual(plain(T.parseSnippet(String.raw`\frac{}{}+\sqrt{}`)),{text:String.raw`\frac{}{}+\sqrt{}`,holes:[6,8,16],final:17});
 assert.deepEqual(plain(T.parseSnippet({before:'{',after:'}'})),{text:'{}',holes:[1],final:2});
});
test("los huecos permanecen estables al escribir y Tab termina en la posición final", () => {
 const inserted=T.snippetEdit({value:'fr',selectionStart:0,selectionEnd:2},String.raw`\frac{#1}{#2}#0`);
 let s={...inserted.edit,value:inserted.edit.value.slice(0,6)+'hola'+inserted.edit.value.slice(6),selectionStart:10,selectionEnd:10};
 const next=T.nextSnippetHole(s,inserted.session); assert.equal(next.edit.selectionStart,12);
 const final=T.nextSnippetHole(next.edit,next.session); assert.equal(final.edit.selectionStart,s.value.length); assert.equal(final.session,null);
 assert.equal(T.activeSnippet({...s,selectionStart:0,selectionEnd:0},{...inserted.session,start:1}),null);
});
test("aceptar matemáticas en prosa envuelve el fragmento y registra su cierre pendiente", () => {
 const r=T.snippetEdit(state(''),String.raw`\alpha`,true);
 assert.equal(r.edit.value,String.raw`$\alpha$`); assert.equal(r.edit.selectionStart,r.edit.value.length-1);
 const close=T.skipPendingClose(r.edit,r.pending); assert.equal(close.edit.selectionStart,r.edit.value.length);
});
test("el ranking usa el catálogo real, acentos, cuatro niveles y desempates deterministas", () => {
 const entries=T.completionEntries();
 assert.ok(T.rankCompletions('fr',entries,{},0,'math')[0].trigger.startsWith('\\frac'));
 assert.ok(T.rankCompletions('fraccion',entries,{},0,'text').some(e=>e.label==='fracción'));
 const sample=[{key:'a',trigger:'\\abc',label:'otro'},{key:'b',trigger:'\\zabc',label:'otro'},{key:'c',trigger:'\\xyz',label:'abc palabra'},{key:'d',trigger:'\\xyz',label:'zabc'}];
 assert.deepEqual(plain(T.rankCompletions('ab',sample,{},0,'text')).map(e=>e.key),['a','b','c','d']);
 const twins=[{key:'a',trigger:'\\a',label:'a'},{key:'b',trigger:'\\ab',label:'b'}];
 assert.equal(T.rankCompletions('a',twins,{b:{n:2,t:0}},0,'math')[0].key,'b');
 assert.equal(T.rankCompletions('',entries,{},0,'math').length,8);
 assert.equal(T.rankCompletions('a',entries,{},0,'comment').length,0);
});
test("el uso decae por semanas, se limita a 300 y descarta datos corruptos", () => {
 assert.equal(T.usageScore({n:8,t:0},7*86400000),4);
 const usage=Object.fromEntries(Array.from({length:301},(_,i)=>['key:'+i,{n:i+1,t:0}]));
 const next=T.recordUsage({...usage,bad:null},'new',1000);
 assert.equal(Object.keys(next).length,300); assert.equal(next.bad,undefined); assert.equal(next['key:0'],undefined);
 assert.equal(T.recordUsage({},'alias:fr',123)['alias:fr'].t,123);
});
test("solo una barra sin escapar y letras abren sugerencias, también los nombres de entorno", () => {
 assert.equal(T.completionToken(state(String.raw`\fr`)).query,'fr');
 assert.equal(T.completionToken(state(String.raw`\\`)),null);
 assert.equal(T.completionToken(state(String.raw`\\fr`)),null);
 assert.equal(T.completionToken(state(String.raw`\fr `)),null);
 assert.equal(T.completionToken({...state(String.raw`\fr`),selectionStart:0}),null);
 assert.equal(T.completionToken(state(String.raw`\begin{al`)).kind,'environment');
});
test("los alias solo coinciden con un token Unicode completo que no sea un comando", () => {
 const a=T.DEFAULT_ALIASES;
 assert.equal(T.aliasAt(state('fr'),a,'math').alias.trigger,'fr');
 assert.equal(T.aliasAt(state('x fr'),a,'text').start,2);
 assert.equal(T.aliasAt(state(String.raw`\fr`),a,'math'),null);
 assert.equal(T.aliasAt(state('lím'),a,'math'),null);
 assert.equal(T.aliasAt(state('xfrr'),a,'math'),null);
 assert.equal(T.aliasAt(state('fr'),a,'comment'),null);
});
test("los alias predeterminados son válidos y no invaden palabras cortas del español", () => {
 for(const a of T.DEFAULT_ALIASES){ assert.deepEqual(plain(T.validateAlias(a,[])),[]); assert.ok(!T.SHORT_WORDS.includes(a.trigger)); }
 for(const a of [{trigger:'en',expansion:'x',mode:'math'},{trigger:'a',expansion:'x',mode:'math'},{trigger:'abc',expansion:'#10',mode:'math'},{trigger:'abc',expansion:'#x',mode:'math'},{trigger:'abc',expansion:'',mode:'math'}]) assert.ok(T.validateAlias(a,[]).length);
 assert.ok(T.validateAlias(T.DEFAULT_ALIASES[0],T.DEFAULT_ALIASES).length);
});
test("la configuración se valida completa antes de aplicar cambios", () => {
 const config={kind:'notas-latex-config',version:1,aliases:T.DEFAULT_ALIASES,templates:[],macros:[],prefs:{autoPair:true}};
 assert.deepEqual(plain(T.validateConfiguration(config)),[]);
 for(const c of [{...config,version:2},{...config,aliases:[{trigger:'en'}]},{...config,prefs:{}},{...config,templates:[null]},{...config,macros:[null]}]) assert.ok(T.validateConfiguration(c).length);
});
