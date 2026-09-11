import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { blockToLatex, escapeLatexText, generateLatex, normalizeLineBreaks } from "../assets/js/latex-generator.js";
import { sanitizeFilename } from "../assets/js/file-download.js";

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
