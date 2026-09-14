import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { blockToLatex, buildPreamble, escapeLatexText, generateLatex, normalizeLineBreaks } from "../assets/js/latex-generator.js";
import { BLOCK_TYPES } from "../assets/js/block-types.js";
import { sanitizeFilename } from "../assets/js/file-download.js";
import { MAX_TEX_FILE_SIZE, normalizeTexLineBreaks, parseTexDocument, validateTexFile } from "../assets/js/tex-import.js";

const example = { metadata: { title: "Notas de Cálculo III", author: "Ana Pérez", course: "Cálculo III", teacher: "Dr. Ruiz", date: "2026-09-11", topic: "Integrales múltiples" }, blocks: [
  { type: "definition", title: "Integral doble", content: "Sea f: A → R. La integral sobre A se escribe en la ecuación siguiente." },
  { type: "equation", title: "", content: "\\iint_A f(x,y) \\, dx \\, dy" },
  { type: "example", title: "Rectángulo", content: "Para f(x,y)=x+y en [0,1] \\times [0,2], calculamos el valor por iteración.\n\nEste bloque tiene dos párrafos y conserva el signo = como texto." },
  { type: "exercise", title: "Práctica #1", content: "Calcula el área de A = [0,2] \\times [0,3]." },
  { type: "solution", title: "", content: "El área es 2 \\times 3 = 6 unidades cuadradas." }
] };

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

test("hace ida y vuelta de estado a .tex y estado, incluido UTF-8", () => {
  assert.deepEqual(parseTexDocument(generateLatex(example)), example);
});
test("normaliza CRLF antes de reconocer el formato", () => {
  assert.deepEqual(parseTexDocument(generateLatex(example).replace(/\n/g, "\r\n")), example);
  assert.equal(normalizeTexLineBreaks("á\r\nβ\rc"), "á\nβ\nc");
});
test("rechaza archivos vacíos, demasiado grandes o de tipo incorrecto", () => {
  assert.throws(() => validateTexFile({ name: "vacio.tex", type: "text/x-tex", size: 0 }), /vacío/);
  assert.throws(() => validateTexFile({ name: "grande.tex", type: "text/x-tex", size: MAX_TEX_FILE_SIZE + 1 }), /1 MB/);
  assert.throws(() => validateTexFile({ name: "notas.txt", type: "text/plain", size: 10 }), /\.tex/);
  assert.equal(validateTexFile({ name: "notas.tex", type: "", size: 10 }), true);
  assert.throws(() => parseTexDocument(""), /vacío/);
});
test("rechaza versiones desconocidas y marcadores incompletos", () => {
  const tex = generateLatex(example);
  assert.throws(() => parseTexDocument(tex.replace("FORMAT:1", "FORMAT:99")), /versión 99/);
  assert.throws(() => parseTexDocument(tex.replace("% TEX-NOTES:METADATA:END", "% marcador ausente")), /incompletos/);
  assert.throws(() => parseTexDocument(tex.replace("% TEX-NOTES:BLOCK:END", "% marcador ausente")), /incompletos/);
});
test("el contenido que parece marcador no altera el sobre", () => {
  const stateWithMarker = { metadata: { title: "Marcadores", author: "", course: "", teacher: "", date: "", topic: "" }, blocks: [
    { type: "equation", title: "", content: "% TEX-NOTES:METADATA:BEGIN\nx=1\n% TEX-NOTES:BLOCK:END" },
  ] };
  assert.deepEqual(parseTexDocument(generateLatex(stateWithMarker)), stateWithMarker);
});

test("una proposición usa su entorno, con y sin título", () => {
  assert.equal(blockToLatex({ type: "proposition", title: "Modus ponens", content: "Si P implica Q y P, entonces Q." }),
    "\\begin{proposition}[Modus ponens]\nSi P implica Q y P, entonces Q.\n\\end{proposition}");
  assert.equal(blockToLatex({ type: "proposition", title: "", content: "Todo conjunto es subconjunto de sí mismo." }),
    "\\begin{proposition}\nTodo conjunto es subconjunto de sí mismo.\n\\end{proposition}");
});
test("una proposición escapa los caracteres reservados y omite el contenido vacío", () => {
  assert.equal(blockToLatex({ type: "proposition", title: "50 % & más", content: "P_1 \\land P_2 usa # y ~." }),
    "\\begin{proposition}[50 \\% \\& más]\nP\\_1 \\textbackslash{}land P\\_2 usa \\# y \\textasciitilde{}.\n\\end{proposition}");
  assert.equal(blockToLatex({ type: "proposition", title: "Sin cuerpo", content: "   \n\n  " }), "");
});
test("el preámbulo declara la proposición junto a los demás entornos", () => {
  const preamble = buildPreamble();
  assert.match(preamble, /\\newtheorem\{proposition\}\{Proposición\}/);
  assert.match(preamble, /\\usepackage\{amssymb\}/);
  assert.equal(BLOCK_TYPES.filter((type) => type.declaration).length, (preamble.match(/\\new(?:theorem|environment)\{/g) || []).length);
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
test("las listas toman un elemento por línea y escapan su texto", () => {
  assert.equal(blockToLatex({ type: "itemize", content: "Uno & dos\r\n\nEl 100%\n" }), "\\begin{itemize}\n\\item Uno \\& dos\n\\item El 100\\%\n\\end{itemize}");
  assert.equal(blockToLatex({ type: "enumerate", content: "Primero" }), "\\begin{enumerate}\n\\item Primero\n\\end{enumerate}");
  assert.equal(blockToLatex({ type: "itemize", content: "\n \n" }), "");
});
test("un tipo desconocido se trata como texto y no inventa un entorno", () => {
  assert.equal(blockToLatex({ type: "no-existe", title: "T", content: "Contenido" }), "\\subsection{T}\nContenido");
});
