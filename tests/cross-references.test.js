import test from "node:test";
import assert from "node:assert/strict";
import { loadTexNotes } from "./load-app.mjs";
import { T } from "./radial-fixtures.mjs";

const plain = structuredClone;
const block = (type, content, label, title = "", children = []) => ({ type, content, label, title, children });

test("las etiquetas de bloque son únicas en todo el árbol", async () => {
  const templates = await loadTexNotes(["block-types.js", "block-tree.js", "image-options.js", "templates.js"]);
  const raw = [block("theorem", "A", "teo:uno", "A", [
    block("equation", "x", "ec:a"), block("theorem", "B", "teo:uno"), block("proof", "P", "teo:p")
  ]), { type: "image", content: "figura.png", options: { label: "Gráfica 1" } }];
  for (const version of [1, 2, 3, 4]) {
    const draft = T.normalizeDraft({ version, metadata: {}, blocks: raw });
    assert.equal(draft.version, T.DRAFT_VERSION);
    assert.equal(draft.migratedFrom, version);
    const [root, image] = draft.blocks;
    assert.equal(root.label, "teo:uno");
    assert.equal(root.children[1].label, undefined);
    assert.equal(root.children[2].label, undefined);
    assert.equal(image.label, "fig:grafica1");
    assert.equal(image.options.label, undefined);
    assert.equal(T.blockToLatex(image), T.blockToLatex(raw[1]));
    const dup = T.duplicateBlock(draft.blocks, [0]);
    const pasted = T.insertBlock([], [], T.copyWithoutLabels(root));
    for (const copy of [dup.blocks[1], pasted.blocks[0]])
      assert.ok(T.flattenBlocks([copy]).every(entry => !entry.block.label));
    const t = templates.templateFromBranch(root, { id:"p", name:"P", trigger:"pp" });
    assert.ok(t.steps.every(step => !step.block.label));
    assert.equal(T.copyWithoutLabels(raw[1]).label, undefined);
    assert.equal(T.moveBlock(draft.blocks, [0], 1).blocks[1].children[0].label, "ec:a");
  }
});

test("la normalización y la propuesta de etiqueta usan prefijos, acentos y sufijos libres", () => {
  assert.equal(T.normalizeLabel(" Fig:Árbol-2{} ", "fig"), "fig:arbol-2");
  assert.equal(T.normalizeLabel("fig:", "fig"), "");
  assert.equal(T.labelFromTitle("Límite de F", "teo", ["teo:limite-de-f","teo:limite-de-f-2"]), "teo:limite-de-f-3");
  assert.equal(T.labelFromTitle("", "ec", ["ec:1"]), "ec:2");
  assert.equal(T.normalizeLabel("texto", undefined), "");
});

test("las etiquetas se emiten tras el título y solo numeran ecuaciones etiquetadas", () => {
  assert.equal(T.blockToLatex(block("theorem", "Texto", "teo:c", "Clairaut")), "\\begin{theorem}[Clairaut]\\label{teo:c}\nTexto\n\\end{theorem}");
  assert.equal(T.blockToLatex(block("equation", "a=b", "ec:c")), "\\begin{equation}\\label{ec:c}\na=b\n\\end{equation}");
  assert.equal(T.blockToLatex(block("equation", "a=b")), "\\[\na=b\n\\]");
  assert.equal(T.blockToLatex(block("theorem", "", "teo:v", "", [block("text", "")])), "");
});

test("los contadores siguen la emisión de entornos, ecuaciones y figuras flotantes o anidadas", () => {
  const f = (label, title="") => block("image", "a.png", label, title);
  const blocks = [block("theorem", ""), block("theorem", "A", undefined, "", [f(undefined, "Pie"), f("fig:interna")]),
    block("proof", "P"), block("theorem", "B", "teo:b"), block("proposition", "C", "prop:c"),
    block("equation", "z"), block("equation", "y", "ec:y"), f(undefined, "Pie"), f(), f("fig:fin"),
    block("image", " ", "fig:vacia"), block("text", "% \\caption{ignorar}\n% \\begin{align}")];
  const numbers = entries => Object.fromEntries(entries.map(e => [e.label, e.number]));
  assert.deepEqual(numbers(T.referenceTargets({blocks})), {"fig:interna":1,"teo:b":2,"prop:c":1,"ec:y":1,"fig:fin":3});
  for (const [manual, key] of [["\\begin{align}", "ec:y"], ["\\begin{theorem}", "teo:b"], ["\\caption{p}", "fig:fin"]])
    assert.equal(numbers(T.referenceTargets({blocks:[...blocks, block("text", manual)]}))[key], null);
  assert.equal(numbers(T.referenceTargets({blocks:[...blocks,block("text","\\begin{align*} \\end{align*}")]}))["ec:y"],1);
});

test("las sugerencias de referencia respetan el contexto, la palabra previa y los cierres", () => {
  const targets = T.referenceTargets({blocks:[block("theorem","x","teo:c","Clairaut"),block("equation","x","ec:x")]});
  for (const [prefix, mode, expected] of [["el ", "text", "Teorema~\\ref{teo:c}"],["el teorema ", "text","\\ref{teo:c}"],
    ["Teorema~","text","\\ref{teo:c}"],["", "math", "\\ref{teo:c}"]]) {
    const before = prefix+"\\eqref{te", value=before+"}", cursor=before.length;
    const token=T.completionToken({value,selectionStart:cursor,selectionEnd:cursor});
    assert.equal(token.query,"te"); assert.equal(token.end,value.length);
    const entries=T.referenceOptions(targets,token,value,mode);
    assert.equal(entries[0].label,"Teorema 1 · Clairaut"); assert.equal(entries[0].insert,expected);
    assert.equal(entries[1].insert,"\\eqref{ec:x}");
  }
  assert.equal(T.referenceOptions([{...targets[0],number:null}],{start:0},"","text")[0].label,"Teorema · Clairaut");
});

test("la comprobación de etiquetas localiza referencias rotas, duplicadas y de tipo incorrecto", () => {
  const blocks=[block("theorem","A","teo:a"),block("text","Una línea\n  \\ref{x} y \\eqref{teo:a}.\n\\label{teo:a} % \\label{fantasma}\n\\begin{equation}x\\label{manual}\\end{equation}\n\\eqref{manual} \\ref{fantasma}")];
  const issues=T.checkDocument({blocks}).flatMap(row=>row.issues);
  assert.deepEqual(Array.from(issues.filter(i=>i.code==="missing-label"), i=>[i.line,i.column]),[[2,3],[5,16]]);
  assert.ok(issues.some(i=>i.code==="duplicate-label" && i.severity==="error"));
  assert.equal(issues.filter(i=>i.code==="section-label").length,1);
  assert.equal(issues.filter(i=>i.code==="eqref-type").length,1);
  assert.deepEqual(plain(T.crossReferenceIssues({blocks:[block("equation","x % \\ref{oculta}"),block("text","\\\\ref{no-es-comando}")]})),[]);
});
