/**
 * Contrato del contenido: lo que se escribe en un bloque llega al .tex tal
 * cual. La aplicación no inserta caracteres de escape en el contenido; solo
 * los metadatos y los títulos se escapan por completo, porque van dentro de un
 * argumento que genera la propia aplicación.
 *
 * Esta prueba sustituye a tests/mixed-math.test.js. Aquel fijaba el escapado
 * parcial de la prosa alrededor de `$…$`; el contrato nuevo lo subsume: si
 * nada se escapa, un tramo matemático se conserva por definición. Las
 * comprobaciones observables de aquel archivo —`$…$`, `$$…$$`, `\$`,
 * delimitadores sin pareja— siguen aquí, con su salida nueva.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { loadTexNotes } from "./load-app.mjs";

const { blockToLatex, escapeMetadata, generateLatex } = await loadTexNotes();

/** Los tipos cuyo contenido es prosa: los que antes pasaban por el escapado. */
const PROSE_TYPES = ["text", "definition", "theorem", "proposition", "example", "note"];
const bodyOf = (type, content) => {
  const latex = blockToLatex({ type, content });
  return type === "text" ? latex : latex.split("\n").slice(1, -1).join("\n");
};

test("la barra invertida y las llaves se conservan en todo tipo de prosa", () => {
  for (const type of PROSE_TYPES) {
    assert.equal(bodyOf(type, "Usa \\textbf{este término}."), "Usa \\textbf{este término}.", type);
    assert.equal(bodyOf(type, "Sea A = {1, 2}."), "Sea A = {1, 2}.", type);
    assert.equal(bodyOf(type, "\\forall x \\in \\mathbb{R}"), "\\forall x \\in \\mathbb{R}", type);
  }
});

test("un elemento de lista conserva comandos, llaves y llaves sueltas", () => {
  assert.equal(blockToLatex({ type: "itemize", content: "\\textbf{Uno}\n\\mathbb{R} y una llave } suelta\n{ abre sin cerrar" }),
    "\\begin{itemize}\n\\item \\textbf{Uno}\n\\item \\mathbb{R} y una llave } suelta\n\\item { abre sin cerrar\n\\end{itemize}");
  assert.equal(blockToLatex({ type: "enumerate", content: "\\item ya escrito por la persona" }),
    "\\begin{enumerate}\n\\item \\item ya escrito por la persona\n\\end{enumerate}");
});

test("ningún carácter reservado se escapa en el contenido", () => {
  // Lo que antes se convertía en \# \% \& \_ \textasciitilde{} \textasciicircum{}.
  for (const type of PROSE_TYPES) assert.equal(bodyOf(type, "# % & _ ~ ^"), "# % & _ ~ ^", type);
  assert.equal(bodyOf("text", "50% & valor_1"), "50% & valor_1");
  // Quien quiera el carácter impreso escribe el escape, y ese escape llega intacto.
  assert.equal(bodyOf("text", "50\\% \\& valor\\_1"), "50\\% \\& valor\\_1");
});

test("una tabla o un align pegados desde otro documento no se corrompen", () => {
  const align = "\\begin{align}\na &= b \\\\\nc &= d\n\\end{align}";
  assert.equal(bodyOf("text", align), align);
  const tabla = "\\begin{tabular}{c|c}\n1 & 2 \\\\\n3 & 4\n\\end{tabular}";
  assert.equal(bodyOf("note", tabla), tabla);
});

test("la matemática delimitada sigue intacta, incluida la que no cierra", () => {
  assert.equal(bodyOf("text", "El costo es 50\\% y $x_1 \\in A & B$."), "El costo es 50\\% y $x_1 \\in A & B$.");
  assert.equal(bodyOf("theorem", "Antes:\n$$\n\\iint_A f \\, dx\n$$\nDespués."), "Antes:\n$$\n\\iint_A f \\, dx\n$$\nDespués.");
  assert.equal(bodyOf("text", "Cuesta 5\\$ exactos."), "Cuesta 5\\$ exactos.");
  // Sin pareja: antes salía «5\$ en total\_1»; ahora se entrega lo escrito y la
  // corrección, si hace falta, se hace en Overleaf.
  assert.equal(bodyOf("text", "Cuesta 5$ en total_1"), "Cuesta 5$ en total_1");
});

test("los bloques matemáticos no cambian de comportamiento", () => {
  assert.equal(blockToLatex({ type: "equation", content: "x_1 $ y^2" }), "\\[\nx_1 $ y^2\n\\]");
  assert.equal(blockToLatex({ type: "math-inline", content: "\\forall x \\in \\mathbb{R}" }), "\\(\\forall x \\in \\mathbb{R}\\)");
});

test("los metadatos y los títulos conservan el escapado completo, barra y llaves incluidas", () => {
  assert.equal(escapeMetadata("Sea $x_1$"), "Sea \\$x\\_1\\$");
  assert.equal(escapeMetadata("\\mathbb{R}"), "\\textbackslash{}mathbb\\{R\\}");
  assert.equal(blockToLatex({ type: "text", title: "Costo $ total", content: "Hola" }), "\\subsection{Costo \\$ total}\nHola");
  assert.equal(blockToLatex({ type: "note", title: "Al 50% \\mathbb{R}", content: "Cuerpo" }),
    "\\begin{note}[Al 50\\% \\textbackslash{}mathbb\\{R\\}]\nCuerpo\n\\end{note}");
  const tex = generateLatex({ metadata: { title: "50% $x$", author: "A_1 & B", topic: "Tema \\{1" }, blocks: [] });
  assert.match(tex, /\\title\{50\\% \\\$x\\\$\}/);
  assert.match(tex, /\\author\{A\\_1 \\& B\}/);
  assert.match(tex, /\\section\{Tema \\textbackslash\{\}\\\{1\}/);
});

test("el contenido se emite igual dentro de un bloque anidado", () => {
  const latex = blockToLatex({ type: "theorem", title: "Con hijos", content: "Sea $f$ continua y 100% acotada.",
    children: [{ type: "itemize", content: "\\mathbb{R}^2 & su frontera", children: [] }] });
  assert.match(latex, /Sea \$f\$ continua y 100% acotada\./);
  assert.match(latex, /\\item \\mathbb\{R\}\^2 & su frontera/);
});
