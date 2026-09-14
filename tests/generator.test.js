import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { loadTexNotes } from "./load-app.mjs";
import { exampleState as example } from "./example-state.mjs";

const {
  BLOCK_TYPES, blockToLatex, buildPreamble, buildTheoremDefs,
  escapeLatexText, generateLatex, normalizeLineBreaks, sanitizeFilename,
} = await loadTexNotes();


test("escapa todos los caracteres reservados en texto", () => {
  assert.equal(escapeLatexText("# $ % & _ { } ~ ^ \\"), "\\# \\$ \\% \\& \\_ \\{ \\} \\textasciitilde{} \\textasciicircum{} \\textbackslash{}");
});
test("normaliza CRLF y CR", () => assert.equal(normalizeLineBreaks("a\r\nb\rc"), "a\nb\nc"));
test("omite bloques vacíos y tolera título vacío", () => {
  const tex = generateLatex({ metadata: { title: "" }, blocks: [{ type: "text", content: "" }] });
  assert.match(tex, /\\title\{\}/); assert.doesNotMatch(tex, /\\subsection/); assert.match(tex, /\\end\{document\}\n$/);
});
test("preserva ecuaciones multilínea sin escapar", () => assert.equal(blockToLatex({ type: "equation", content: "x_1 &= 2 \\\\\r\ny &= 3" }), "\\[\nx_1 &= 2 \\\\\ny &= 3\n\\]"));
test("conserva párrafos y escapa texto", () => assert.equal(blockToLatex({ type: "text", content: "Uno & dos\r\n\r\n100%" }), "Uno \\& dos\n\n100\\%"));
test("el ejemplo genera exactamente el archivo de referencia", async () => assert.equal(generateLatex(example), await readFile(new URL("../examples/calculo-3.tex", import.meta.url), "utf8")));
test("el nombre descargable es portable y tiene alternativa", () => { assert.equal(sanitizeFilename("Álgebra / Tema 1"), "algebra-tema-1.tex"); assert.equal(sanitizeFilename(""), "notas-calculo-3.tex"); });

test("los seis tipos de bloque del temario están disponibles", () => {
  assert.deepEqual(BLOCK_TYPES.map((type) => type.id), ["text", "equation", "definition", "theorem", "example", "note"]);
});
test("un tipo desconocido no rompe la generación y cae en texto", () => {
  assert.equal(blockToLatex({ type: "inexistente", content: "Hola & adiós" }), "Hola \\& adiós");
});
test("el bloque nota usa su propio entorno", () => {
  assert.equal(blockToLatex({ type: "note", title: "Aviso", content: "Texto" }), "\\begin{note}[Aviso]\nTexto\n\\end{note}");
});

test("el preámbulo deriva un \\newtheorem por cada tipo declarado", () => {
  const defs = buildTheoremDefs();
  const declared = BLOCK_TYPES.filter((type) => type.kind === "theorem");
  for (const type of declared) assert.match(defs, new RegExp(`\\\\newtheorem\\{${type.environment}\\}\\{${type.heading}\\}`));
  assert.equal((defs.match(/\\newtheorem/g) || []).length, declared.length);
  assert.ok(buildPreamble().includes(defs), "el preámbulo debe incluir las declaraciones derivadas");
});
test("no repite \\theoremstyle al agrupar entornos del mismo estilo", () => {
  const styles = buildTheoremDefs().match(/\\theoremstyle\{(\w+)\}/g) || [];
  assert.deepEqual(styles, [...new Set(styles)], "cada \\theoremstyle aparece una sola vez");
});

test("el documento es autocontenido y no lleva sobre de reimportación", () => {
  const tex = generateLatex(example);
  assert.match(tex, /^\\documentclass/, "el archivo empieza por el preámbulo visible");
  assert.doesNotMatch(tex, /TEX-NOTES/, "no debe quedar rastro del sobre de ida y vuelta");
  assert.doesNotMatch(tex, /\\usepackage\{[^}]*\.sty/, "no debe depender de un .sty externo");
});

test("las opciones de index.html coinciden con la tabla de tipos", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const select = html.match(/<select id="block-type"[^>]*>([\s\S]*?)<\/select>/);
  assert.ok(select, "falta el selector de tipo de bloque");
  const options = [...select[1].matchAll(/<option value="([^"]+)">([^<]+)<\/option>/g)].map((match) => ({ id: match[1], label: match[2] }));
  assert.deepEqual(options, BLOCK_TYPES.map((type) => ({ id: type.id, label: type.label })));
});
