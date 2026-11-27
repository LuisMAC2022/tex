import test from "node:test";
import assert from "node:assert/strict";
import { loadTexNotes } from "./load-app.mjs";
const T=await loadTexNotes(["block-types.js","math-preview.js","selection-scope.js"]);
function example(marked,mode="math") {
  const start=marked.indexOf("§"), value=marked.replace("§",""), initial={start,end:start};
  const levels=Array.from(T.scopeLevels(value,initial,mode));
  let previous=initial;
  for (const r of levels) {
    assert.ok(r.start<=previous.start && previous.end<=r.end);
    assert.ok(r.end-r.start>previous.end-previous.start);
    previous=r;
  }
  return {value,levels,texts:levels.map(r=>value.slice(r.start,r.end))};
}
test("fracciones anidadas, relaciones y delimitadores amplían rangos estrictamente crecientes", () => {
  const {texts}=example("Sea $p + \\frac{\\frac{§x}{y}}{z} \\le q$ después");
  assert.deepEqual(texts,["x","{x}","\\frac{x}{y}","{\\frac{x}{y}}","\\frac{\\frac{x}{y}}{z}","p + \\frac{\\frac{x}{y}}{z}",
    "p + \\frac{\\frac{x}{y}}{z} \\le q","$p + \\frac{\\frac{x}{y}}{z} \\le q$"]);
  const nested=example("\\textbf{Sea $\\al§pha+x$.}").texts;
  assert.equal(nested[0],"\\alpha");assert.equal(nested.at(-1),"$\\alpha+x$");
});
test("la raíz con índice y los subíndices y superíndices compuestos incluyen su base", () => {
  const root=example("\\sqrt[§3]{x_{i+1}} + y").texts;
  assert.ok(root.includes("[3]"));assert.ok(root.includes("\\sqrt[3]{x_{i+1}}"));
  const sub=example("x_{i_{§j+1}}^{2}+y").texts;
  for(const piece of ["j","{j+1}","i_{j+1}","x_{i_{j+1}}","x_{i_{j+1}}^{2}"]) assert.ok(sub.includes(piece),piece);
});
test("left y right forman un grupo y las llaves escapadas y comentarios son atómicos", () => {
  const group=example("a+\\left( §b+c \\right)=d").texts;
  assert.ok(group.includes("\\left( b+c \\right)"));assert.ok(group.includes("a+\\left( b+c \\right)"));
  assert.equal(example("x+\\§{ y \\}").texts[0],"\\{");
  assert.equal(example("a % x§+{z}=q\n + b").texts[0],"% x+{z}=q");
  assert.equal(example("\\% + \\in§cognita=x").texts[0],"\\incognita");
});
test("los entornos de matriz distinguen celda, fila y fórmula con delimitadores", () => {
  const {value,levels}=example("\\begin{pmatrix}a&§b+c\\\\d&e\\end{pmatrix}");
  const pick=name=>{const r=levels.find(r=>r.name===name);return r&&value.slice(r.start,r.end);};
  assert.equal(pick("Celda"),"b+c");assert.equal(pick("Fila"),"a&b+c");
  assert.equal(pick("Fórmula con delimitadores"),value);
});
test("la prosa española y text dentro de matemáticas usan palabras y oraciones", () => {
  assert.deepEqual(example("Álgebra útil. Una §órbita gira.\n\nOtro párrafo.","text").texts,
    ["órbita","Una órbita gira.","Álgebra útil. Una órbita gira.","Álgebra útil. Una órbita gira.\n\nOtro párrafo."]);
  const text=example("$1+\\text{una §palabra más}=x$").texts;
  assert.equal(text[0],"palabra");assert.ok(text.includes("\\text{una palabra más}"));
  assert.equal(T.scopeModeAt("Sea $x+y$.",{start:5,end:6},"text"),"math");
  assert.equal(T.scopeModeAt("% $x+y$",{start:4,end:4},"text"),"text");
});
test("reducir recupera exactamente una selección hacia atrás y respeta extremos y grafemas", () => {
  const value="Árbol y órbita.", initial={start:1,end:3,direction:"backward"};
  const a=T.expandScope(value,initial,"text"), b=T.expandScope(value,a.range,"text",a.stack);
  const back=T.shrinkScope(b.range,b.stack), original=T.shrinkScope(back.range,back.stack);
  assert.deepEqual(structuredClone(original.range),initial);
  assert.deepEqual(structuredClone(T.scopeLevels("",{start:0,end:0},"math")),[]);
  assert.equal(example("§👩‍🔬+x").texts[0],"👩‍🔬");
  assert.equal(example("a+e\u0301§").texts[0],"e\u0301");
  assert.equal(example("x+\\😀§").texts[0],"\\😀");
  assert.equal(example("\\!\u0301§+y").texts[0],"+");
  const full={start:0,end:value.length};assert.deepEqual(structuredClone(T.expandScope(value,full,"text").range),full);
});
