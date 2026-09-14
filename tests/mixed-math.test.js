/** Matemática delimitada dentro del contenido en prosa. */
import test from "node:test";
import assert from "node:assert/strict";
import { loadTexNotes } from "./load-app.mjs";

const { blockToLatex, escapeLatexText, escapeMixedText, generateLatex, splitMixedContent } = await loadTexNotes();

const kinds = (value) => [...splitMixedContent(value)].map((segment) => `${segment.kind}:${segment.value}`);

test("una fórmula entre prosa conserva delimitadores y sintaxis interior", () => {
  assert.equal(escapeMixedText("El costo es 50% y $x_1 \\in A & B$."), "El costo es 50\\% y $x_1 \\in A & B$.");
  assert.equal(escapeMixedText("Sea ${x^2}\\{y\\}$ el conjunto."), "Sea ${x^2}\\{y\\}$ el conjunto.");
});

test("dos fórmulas en el mismo párrafo se conservan por separado", () => {
  assert.equal(escapeMixedText("Si $x_1 \\in A$ y $y^2 \\notin B$, entonces 100% seguro."),
    "Si $x_1 \\in A$ y $y^2 \\notin B$, entonces 100\\% seguro.");
  assert.deepEqual(kinds("a $x$ b $y$ c"),
    ["text:a ", "math:$x$", "text: b ", "math:$y$", "text: c"]);
});

test("una fórmula destacada puede ocupar varias líneas", () => {
  assert.equal(escapeMixedText("Antes & después:\n$$\n\\iint_A f(x,y) \\, dx \\, dy \\\\\ng_1 &= 2\n$$\nY 50% más."),
    "Antes \\& después:\n$$\n\\iint_A f(x,y) \\, dx \\, dy \\\\\ng_1 &= 2\n$$\nY 50\\% más.");
});

test("los caracteres reservados se escapan antes y después de la fórmula", () => {
  assert.equal(escapeMixedText("#_{~} $a^b$ 100% & \\fin"),
    "\\#\\_\\{\\textasciitilde{}\\} $a^b$ 100\\% \\& \\textbackslash{}fin");
});

test("un delimitador sin pareja se imprime como texto y no abre modo matemático", () => {
  assert.equal(escapeMixedText("Cuesta 5$ en total_1"), "Cuesta 5\\$ en total\\_1");
  assert.equal(escapeMixedText("Abre $$ y nunca cierra_1"), "Abre \\$\\$ y nunca cierra\\_1");
  assert.deepEqual(kinds("5$ solo"), ["text:5$ solo"]);
});

test("un dólar escapado por la persona es un dólar literal", () => {
  assert.equal(escapeMixedText("Cuesta 5\\$ exactos."), "Cuesta 5\\$ exactos.");
  assert.equal(escapeMixedText("\\$ y $x$"), "\\$ y $x$");
  // Dentro de la fórmula, \$ tampoco la cierra: es la regla de TeX.
  assert.equal(escapeMixedText("Vale $a \\$ b$ pesos"), "Vale $a \\$ b$ pesos");
});

test("un teorema y un elemento de lista aceptan contenido mixto", () => {
  assert.equal(blockToLatex({ type: "theorem", title: "Fubini", content: "Si $f$ es continua en $[0,1] \\times [0,2]$, el 100% de las veces conmuta." }),
    "\\begin{theorem}[Fubini]\nSi $f$ es continua en $[0,1] \\times [0,2]$, el 100\\% de las veces conmuta.\n\\end{theorem}");
  assert.equal(blockToLatex({ type: "itemize", content: "Sea $x_1 \\in A$ & su vecindad\nEl 50% restante" }),
    "\\begin{itemize}\n\\item Sea $x_1 \\in A$ \\& su vecindad\n\\item El 50\\% restante\n\\end{itemize}");
});

test("metadatos, títulos y bloques matemáticos no cambian de comportamiento", () => {
  // El escapado completo sigue disponible y es el que usan metadatos y títulos.
  assert.equal(escapeLatexText("Sea $x_1$"), "Sea \\$x\\_1\\$");
  assert.equal(blockToLatex({ type: "text", title: "Costo $ total", content: "Hola" }), "\\subsection{Costo \\$ total}\nHola");
  assert.equal(blockToLatex({ type: "note", title: "Al 50% $x$", content: "Cuerpo" }), "\\begin{note}[Al 50\\% \\$x\\$]\nCuerpo\n\\end{note}");
  assert.equal(blockToLatex({ type: "equation", content: "x_1 $ y^2" }), "\\[\nx_1 $ y^2\n\\]");
  assert.equal(blockToLatex({ type: "math-inline", content: "\\forall x \\in \\mathbb{R}" }), "\\(\\forall x \\in \\mathbb{R}\\)");
  const tex = generateLatex({ metadata: { title: "50% $x$", topic: "Tema $1" }, blocks: [] });
  assert.match(tex, /\\title\{50\\% \\\$x\\\$\}/);
  assert.match(tex, /\\section\{Tema \\\$1\}/);
});
