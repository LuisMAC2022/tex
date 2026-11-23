import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTexNotes } from './load-app.mjs';
const T = await loadTexNotes(['block-types.js','math-preview.js','editing-assist.js']);
const state = (text) => { const i=text.indexOf('§'); return {value:text.replace('§',''),selectionStart:i,selectionEnd:i}; };
const view = (edit) => edit.value.slice(0,edit.selectionStart)+'§'+edit.value.slice(edit.selectionEnd);
const pair = (text,data,mode='math',pending=[]) => T.autoPair(state(text),data,{mode,pending});

test("el contexto matemático incluye aperturas incompletas, escapes, entornos y comentarios", () => {
 for(const [text,type,want] of [[String.raw`Sea $x§`,'text','math'],[String.raw`Sea $x$ y§`,'text','text'],[String.raw`Cuesta 5\$ y (§`,'text','text'],[String.raw`$\text{si §}x$`,'text','text'],[String.raw`\begin{align} a§`,'text','math'],['% $x§','text','comment'],[String.raw`\\(§`,'text','text'],[String.raw`\(x§`,'text','math'],['% $x§','equation','math'],[String.raw`$\textbf{a {b} c§}x$`,'text','text'],[String.raw`$\text{a}x§$`,'text','math'],['% x\ny§','text','text'],[String.raw`\begin{align*}x\end{align*}§`,'text','text']]){
  const s=state(text); assert.equal(T.mathContextAt(s.value,s.selectionStart,type),want,text);
 }
});
test("autocierra llaves literales y escapadas, delimitadores y left en su contexto", () => {
 for(const [before,data,mode,after] of [['§','{','text','{§}'],[String.raw`\§`,'{','text',String.raw`\{§\}`],[String.raw`\left\§`,'{','math',String.raw`\left\{§\right\}`],['§','(','math','(§)'],['§','[','math','[§]'],[String.raw`\left§`,'(','math',String.raw`\left(§\right)`],[String.raw`\left§`,'[','math',String.raw`\left[§\right]`],[String.raw`\left§`,'|','math',String.raw`\left|§\right|`],[String.raw`\§`,'(','text',String.raw`\(§\)`],[String.raw`\§`,'[','text',String.raw`\[§\]`],['§','$','text','$§$']]) assert.equal(view(pair(before,data,mode).edit),after,before+data);
});
test("el autocierre respeta prosa, comentarios, escapes y el carácter siguiente", () => {
 for(const [text,data,mode] of [['§palabra','$','text'],['§palabra','{','math'],['§','(','text'],['§','[','text'],['§','{','comment'],[String.raw`\§`,'$','text'],['§','^2','math'],['§','^','text'],['x§','^','math'],['x§','_','math']]) assert.equal(pair(text,data,mode),null);
 for(const next of ['', ' ',')',']','}','$',',','.',';',':','\n']) assert.ok(pair('§'+next,'{'));
});
test("un segundo dólar convierte un par vacío en fórmula destacada y el siguiente salta", () => {
 const first=pair('§','$','text'); const second=T.autoPair(first.edit,'$',{mode:'math',pending:first.pending});
 assert.equal(view(second.edit),'$$§$$');
 assert.equal(view(T.autoPair(second.edit,'$',{mode:'math',pending:second.pending}).edit),'$$$$§');
});
test("los exponentes y subíndices escritos de corrido no abren llaves", () => {
 let s={value:'',selectionStart:0,selectionEnd:0};
 for(const ch of 'x^2 + y_1 = r^2') {
  const r=T.autoPair(s,ch,{mode:'math'});
  s=r ? r.edit : {value:s.value+ch,selectionStart:s.selectionStart+1,selectionEnd:s.selectionStart+1};
 }
 assert.equal(s.value,'x^2 + y_1 = r^2');
 assert.equal(view(pair('x^§','{').edit),'x^{§}');
});
test("^ y _ envuelven la selección como exponente o subíndice", () => {
 for(const [data,want] of [['^','x^{ab}'],['_','x_{ab}']]) {
  const r=T.autoPair({value:'xab',selectionStart:1,selectionEnd:3},data,{mode:'math'});
  assert.equal(r.edit.value,want); assert.equal(r.edit.value.slice(r.edit.selectionStart,r.edit.selectionEnd),'ab');
 }
 assert.equal(T.autoPair({value:'xab',selectionStart:1,selectionEnd:3},'^',{mode:'text'}),null);
});
test("el autocierre envuelve selecciones y conserva el texto seleccionado", () => {
 for(const [data,mode,end] of [['{','text','}'],['$','text','$'],['(','math',')'],['[','math',']']]) {
  const r=T.autoPair({value:'hola',selectionStart:0,selectionEnd:4},data,{mode});
  assert.equal(r.edit.value,data+'hola'+end); assert.equal(r.edit.value.slice(r.edit.selectionStart,r.edit.selectionEnd),'hola');
 }
});
test("las dobles barras de un salto no abren delimitador matemático en prosa", () => {
 assert.equal(pair(String.raw`\\§`,'[','text'),null);
 const r=pair(String.raw`\\§`,'[','math'); assert.equal(view(r.edit),String.raw`\\[§]`);
 const typed={...r.edit,value:r.edit.value.slice(0,r.edit.selectionStart)+'2pt'+r.edit.value.slice(r.edit.selectionStart),selectionStart:r.edit.selectionStart+3,selectionEnd:r.edit.selectionEnd+3};
 assert.equal(view(T.autoPair(typed,']',{mode:'math',pending:r.pending}).edit),String.raw`\\[2pt]§`);
});
test("el guion literal de lista se escribe con llaves automáticas y salto del cierre", () => {
 const first=pair('§','{','text'); const second=T.autoPair(first.edit,'}',{mode:'text',pending:first.pending});
 assert.equal(view(second.edit),'{}§'); assert.equal(second.edit.value+'- ','{}- ');
});
test("los cierres conservan su distancia, se validan y se descartan al salir", () => {
 const r=pair('§','('); const s={value:'(abc)',selectionStart:4,selectionEnd:4};
 assert.equal(T.activePairs(s,r.pending).length,1);
 assert.equal(view(T.autoPair(s,')',{mode:'math',pending:r.pending}).edit),'(abc)§');
 assert.equal(T.activePairs({...s,value:'(abc]'},r.pending).length,0);
 assert.equal(T.activePairs({...s,selectionStart:0,selectionEnd:0},r.pending).length,0);
});
test("Retroceso elimina un par vacío pendiente y no toca un par con contenido", () => {
 const r=pair('a§','{','text'); assert.equal(view(T.deleteEmptyPair(r.edit,r.pending).edit),'a§');
 assert.equal(T.deleteEmptyPair({value:'a{x}',selectionStart:2,selectionEnd:2},r.pending),null);
});
test("Intro completa entornos con argumentos y no actúa en listas, bibliografía ni pares cerrados", () => {
 for(const text of [String.raw`\begin{align}§`,String.raw`\begin{array}{cc}§`,String.raw`\begin{equation}[x]§`]){
  const r=T.completeEnvironment(state(text),'text'); assert.ok(r); assert.equal(r.value.slice(r.selectionStart,r.selectionStart+1),'\n'); assert.ok(r.value.includes('\\end{'));
 }
 for(const type of ['itemize','enumerate','bibliography']) assert.equal(T.completeEnvironment(state(String.raw`\begin{align}§`),type),null);
 for(const text of [String.raw`\begin{align}§\end{align}`,String.raw`\\begin{align}§`,String.raw`% \begin{align}§`]) assert.equal(T.completeEnvironment(state(text),'text'),null);
});
