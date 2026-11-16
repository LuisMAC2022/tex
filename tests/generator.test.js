import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { loadTexNotes } from "./load-app.mjs";
import { exampleState as example } from "./example-state.mjs";

const {
  BLOCK_TYPES, blockToLatex, buildPreamble, buildTheoremDefs,
  contentToLatex, escapeMetadata, generateLatex, normalizeLineBreaks, sanitizeFilename,
} = await loadTexNotes();


test("los metadatos y los títulos escapan todos los caracteres reservados", () => {
  assert.equal(escapeMetadata("# $ % & _ { } ~ ^ \\"), "\\# \\$ \\% \\& \\_ \\{ \\} \\textasciitilde{} \\textasciicircum{} \\textbackslash{}");
});
test("el contenido de un bloque no recibe ningún escape", () => {
  assert.equal(contentToLatex("# $ % & _ { } ~ ^ \\"), "# $ % & _ { } ~ ^ \\");
  assert.equal(contentToLatex("\\textbf{A}\r\n50%"), "\\textbf{A}\n50%");
});
test("normaliza CRLF y CR", () => assert.equal(normalizeLineBreaks("a\r\nb\rc"), "a\nb\nc"));
test("omite bloques vacíos y tolera título vacío", () => {
  const tex = generateLatex({ metadata: { title: "" }, blocks: [{ type: "text", content: "" }] });
  assert.match(tex, /\\title\{\}/); assert.doesNotMatch(tex, /\\subsection/); assert.match(tex, /\\end\{document\}\n$/);
});
test("preserva ecuaciones multilínea sin escapar", () => assert.equal(blockToLatex({ type: "equation", content: "x_1 &= 2 \\\\\r\ny &= 3" }), "\\[\nx_1 &= 2 \\\\\ny &= 3\n\\]"));
test("conserva párrafos y no toca el texto", () => assert.equal(blockToLatex({ type: "text", content: "Uno & dos\r\n\r\n100%" }), "Uno & dos\n\n100%"));
test("el ejemplo genera exactamente el archivo de referencia", async () => assert.equal(generateLatex(example), await readFile(new URL("../examples/calculo-3.tex", import.meta.url), "utf8")));
test("el nombre descargable es portable y tiene alternativa", () => { assert.equal(sanitizeFilename("Álgebra / Tema 1"), "algebra-tema-1.tex"); assert.equal(sanitizeFilename(""), "notas-calculo-3.tex"); });

test("la tabla declara los tipos del temario en el orden de la interfaz", () => {
  assert.deepEqual(BLOCK_TYPES.map((type) => type.id),
    ["text", "equation", "math-inline", "definition", "theorem", "proposition", "example", "note", "itemize", "enumerate"]);
});
test("un tipo desconocido no rompe la generación y cae en texto", () => {
  assert.equal(blockToLatex({ type: "inexistente", content: "Hola & adiós" }), "Hola & adiós");
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

test("una proposición usa su entorno, con y sin título", () => {
  assert.equal(blockToLatex({ type: "proposition", title: "Modus ponens", content: "Si P implica Q y P, entonces Q." }),
    "\\begin{proposition}[Modus ponens]\nSi P implica Q y P, entonces Q.\n\\end{proposition}");
  assert.equal(blockToLatex({ type: "proposition", title: "", content: "Todo conjunto es subconjunto de sí mismo." }),
    "\\begin{proposition}\nTodo conjunto es subconjunto de sí mismo.\n\\end{proposition}");
});
test("una proposición escapa su título, conserva su contenido y omite el cuerpo vacío", () => {
  assert.equal(blockToLatex({ type: "proposition", title: "50 % & más", content: "P_1 \\land P_2 usa # y ~." }),
    "\\begin{proposition}[50 \\% \\& más]\nP_1 \\land P_2 usa # y ~.\n\\end{proposition}");
  assert.equal(blockToLatex({ type: "proposition", title: "Sin cuerpo", content: "   \n\n  " }), "");
});
test("la proposición se declara con contador propio, junto a los entornos de estilo plain", () => {
  assert.match(buildTheoremDefs(), /\\newtheorem\{proposition\}\{Proposición\}/);
  assert.doesNotMatch(buildTheoremDefs(), /\\newtheorem\{proposition\}\[/, "no debe compartir contador con otro entorno");
  assert.match(buildPreamble(), /\\usepackage\{amssymb\}/, "amssymb hace falta para los \\mathbb del tablero");
});
test("una proposición se combina con fórmulas en línea y destacadas", () => {
  const tex = generateLatex({ metadata: { title: "Lógica" }, blocks: [
    { type: "proposition", title: "Distributiva", content: "Para todo par de proposiciones se cumple la equivalencia siguiente." },
    { type: "math-inline", title: "", content: "P \\land (Q \\lor R)" },
    { type: "equation", title: "", content: "P \\land (Q \\lor R) \\Leftrightarrow (P \\land Q) \\lor (P \\land R)" },
  ] });
  assert.match(tex, /\\begin\{proposition\}\[Distributiva\]\n/);
  assert.match(tex, /\\\(P \\land \(Q \\lor R\)\\\)/);
  assert.match(tex, /\\\[\nP \\land \(Q \\lor R\) \\Leftrightarrow \(P \\land Q\) \\lor \(P \\land R\)\n\\\]/);
});
test("la matemática en línea se conserva literalmente y en una sola línea", () => {
  assert.equal(blockToLatex({ type: "math-inline", content: "  \\forall x \\in \\mathbb{R}  " }), "\\(\\forall x \\in \\mathbb{R}\\)");
  assert.equal(blockToLatex({ type: "math-inline", content: "   " }), "");
});
test("las listas toman un elemento por línea y conservan su texto", () => {
  assert.equal(blockToLatex({ type: "itemize", content: "Uno & dos\r\n\nEl 100%\n" }), "\\begin{itemize}\n\\item Uno & dos\n\\item El 100%\n\\end{itemize}");
  assert.equal(blockToLatex({ type: "enumerate", content: "Primero" }), "\\begin{enumerate}\n\\item Primero\n\\end{enumerate}");
  assert.equal(blockToLatex({ type: "itemize", content: "\n \n" }), "");
});
