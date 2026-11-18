import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { loadTexNotes } from "./load-app.mjs";
import { exampleState } from "./example-state.mjs";

const { checkContent, checkBlock, checkDocument, generateLatex } = await loadTexNotes([
  "block-types.js", "block-tree.js", "latex-generator.js", "math-preview.js", "content-check.js",
]);

const codes = (issues) => Array.from(issues, ({ code }) => code);

test("detecta llaves desparejadas y respeta las escapadas", () => {
  assert.deepEqual(codes(checkContent(String.raw`Cierra } y abre \textbf{`, "text")), ["brace", "brace"]);
  assert.deepEqual(codes(checkContent(String.raw`\{\} y \textbf{{x}}`, "text")), []);
  assert.deepEqual(codes(checkContent(String.raw`\\{`, "text")), ["brace"]);
});

test("detecta los cuatro delimitadores matemáticos sin pareja", () => {
  for (const delimiter of ["$", "$$", "\\(", "\\["]) {
    assert.deepEqual(codes(checkContent(delimiter + " x", "text")), ["math-delimiter"]);
  }
  assert.deepEqual(codes(checkContent(String.raw`x \]`, "text")), ["math-delimiter"]);
  assert.deepEqual(codes(checkContent(String.raw`Precio \$5. $x_0^2$ $$x^2$$ \(x_1\) \[x_2\]`, "text")), []);
  assert.deepEqual(codes(checkContent(String.raw`\(x_1`, "math-inline")), ["math-delimiter"]);
});

test("detecta entornos abiertos, cierres sueltos y cierres con otro nombre", () => {
  assert.deepEqual(codes(checkContent(String.raw`\begin{align}x &= y`, "text")), ["environment"]);
  assert.deepEqual(codes(checkContent(String.raw`\end{align}`, "text")), ["environment"]);
  assert.deepEqual(codes(checkContent(String.raw`\begin{align}x &= y\end{equation}`, "text")), ["environment"]);
  assert.deepEqual(codes(checkContent(String.raw`\begin{quote}\begin{align*}x_i &= y^2\end{align*}\end{quote}`, "text")), []);
});

test("el porcentaje sin escapar es un aviso y el resto de su línea se ignora", () => {
  const value = String.raw`1\%, 2\\% comentario { $ _ & #` + "\r\n" + "$x^2$";
  const issues = checkContent(value, "text");
  assert.deepEqual(codes(issues), ["comment"]);
  assert.deepEqual(structuredClone(issues[0]), {
    code: "comment", severity: "aviso", line: 1, column: 9,
    message: "El % comenta el resto de la línea. Escribe \\% si quieres imprimirlo.",
    guide: "docs/guia-de-uso.md#falta-un-trozo-de-texto-en-el-pdf-pero-no-hay-ningún-error",
  });
  assert.deepEqual(codes(checkContent("$x% no cierra con este $\nx$", "text")), ["comment"]);
  assert.deepEqual(codes(checkContent(String.raw`Solo 10\%`, "text")), []);
});

test("detecta guiones bajos y circunflejos fuera del modo matemático", () => {
  assert.deepEqual(codes(checkContent("x_1 y y^2", "text")), ["underscore", "caret"]);
  assert.deepEqual(codes(checkContent(String.raw`x\_1 y y\textasciicircum{}2`, "text")), []);
  assert.deepEqual(codes(checkContent("x_1^2", "equation")), []);
  assert.deepEqual(codes(checkContent("x_1^2", "math-inline")), []);
});

test("detecta el signo & fuera de matemáticas y tablas", () => {
  assert.deepEqual(codes(checkContent("Ciencia & arte", "text")), ["ampersand"]);
  assert.deepEqual(codes(checkContent(String.raw`Ciencia \& arte; $a & b$`, "text")), []);
  assert.deepEqual(codes(checkContent(String.raw`\begin{tabular}{ll} a & b \end{tabular} &`, "text")), ["ampersand"]);
  assert.deepEqual(codes(checkContent(String.raw`\begin{align} a &= b \end{align}`, "text")), []);
});

test("detecta un signo # suelto y respeta el signo escapado y un parámetro", () => {
  assert.deepEqual(codes(checkContent("Sección #", "text")), ["hash"]);
  assert.deepEqual(codes(checkContent(String.raw`Sección \#; \newcommand{\f}[1]{#1}`, "text")), []);
});

test("señala el séptimo entorno literal y respeta seis niveles", () => {
  const environments = (depth) => "\\begin{quote}\n".repeat(depth) + "Texto\n" + "\\end{quote}\n".repeat(depth);
  assert.deepEqual(codes(checkContent(environments(6), "text")), []);
  const issues = checkContent(environments(7), "text");
  assert.deepEqual(codes(issues), ["depth"]);
  assert.equal(issues[0].line, 7);
  assert.equal(issues[0].severity, "aviso");
});

test("cuenta los entornos emitidos por el árbol y omite ancestros de texto", () => {
  const chain = (types) => types.reduceRight((children, type) => [{ type, content: "Texto", children }], []);
  const types = ["theorem", "text", "itemize", "enumerate", "text", "note", "example", "itemize"];
  const blocks = chain(types);
  assert.deepEqual(codes(checkBlock({ type: "text", content: "Hoja" }, blocks, Array(8).fill(0))), []);
  const literal = checkBlock({ type: "text", content: String.raw`\begin{quote}Hoja\end{quote}` }, blocks, Array(8).fill(0));
  assert.deepEqual(codes(literal), ["depth"]);
  assert.deepEqual(structuredClone(checkDocument({ blocks })), []);
  const results = checkDocument({ blocks: chain([...types, "theorem"]) });
  assert.equal(results.length, 1);
  assert.deepEqual(Array.from(results[0].path), Array(9).fill(0));
  assert.deepEqual(codes(results[0].issues), ["depth"]);
});

test("agrupa por ruta y ordena avisos por línea y columna en español", async () => {
  const state = { metadata: { title: "Prueba" }, blocks: [
    { type: "theorem", content: "Bien", children: [{ type: "text", content: "📐_\r\n}" }] },
    { type: "text", content: "% omite _" },
  ] };
  const original = structuredClone(state);
  const latex = generateLatex(state);
  const results = checkDocument(state);
  assert.deepEqual(state, original);
  assert.equal(generateLatex(state), latex);
  assert.match(latex, /📐_\n}/);
  assert.match(latex, /% omite _/);
  assert.deepEqual(Array.from(results, ({ path }) => Array.from(path)), [[0, 0], [1]]);
  const [first, second] = results[0].issues;
  assert.deepEqual([first.line, first.column, second.line, second.column], [1, 2, 2, 1]);
  assert.equal(first.severity, "error");
  assert.match(first.message, /^El guion bajo/);
  assert.match(second.message, /^Esta llave de cierre/);

  const guide = await readFile(new URL("../docs/guia-de-uso.md", import.meta.url), "utf8");
  const anchors = new Set([...guide.matchAll(/^### (.+)$/gm)].map(([, heading]) => heading.toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/ /g, "-")));
  const examples = ["}", "$", String.raw`\end{align}`, "%", "_", "^", "&", "#", "\\begin{quote}".repeat(7)];
  for (const content of examples) {
    for (const issue of checkContent(content, "text")) {
      assert.match(issue.message, /^(?:El|Esta) /);
      assert.ok(anchors.has(issue.guide.split("#")[1]), issue.guide);
    }
  }
});

test("el estado de referencia no produce avisos y una ruta de imagen se revisa aparte", () => {
  assert.deepEqual(codes(checkDocument(exampleState)), []);
  assert.deepEqual(codes(checkContent("figuras/grafica_final.png", "image")), []);
});
