import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { loadTexNotes } from "./load-app.mjs";
import { exampleState as example, nestedSection } from "./example-state.mjs";

const {
  BLOCK_TYPES, blockToLatex, buildPreamble, buildTheoremDefs,
  contentToLatex, escapeMetadata, generateLatex, normalizeLineBreaks, outlineEntries, sanitizeFilename,
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
    ["text", "equation", "math-inline", "definition", "theorem", "proposition", "proof", "example", "note", "itemize", "enumerate", "bibliography", "image"]);
});
test("un tipo desconocido no rompe la generación y cae en texto", () => {
  assert.equal(blockToLatex({ type: "inexistente", content: "Hola & adiós" }), "Hola & adiós");
});
test("el bloque nota usa su propio entorno", () => {
  assert.equal(blockToLatex({ type: "note", title: "Aviso", content: "Texto" }), "\\begin{note}[Aviso]\nTexto\n\\end{note}");
});

test("el preámbulo deriva un \\newtheorem por cada tipo declarado", () => {
  const defs = buildTheoremDefs();
  const declared = BLOCK_TYPES.filter((type) => type.kind === "theorem" && !type.predefined);
  for (const type of declared) assert.match(defs, new RegExp(`\\\\newtheorem\\{${type.environment}\\}\\{${type.heading}\\}`));
  assert.equal((defs.match(/\\newtheorem/g) || []).length, declared.length);
  assert.ok(buildPreamble().includes(defs), "el preámbulo debe incluir las declaraciones derivadas");
});
test("el preámbulo solo carga paquetes de la lista blanca", () => {
  const packages = [...buildPreamble().matchAll(/^[ \t]*\\usepackage\s*(?:\[[^\]]*\]\s*)?\{([^}]+)\}/gm)]
    .flatMap((match) => match[1].split(",").map((name) => name.trim()));
  assert.deepEqual(packages, ["fontenc", "inputenc", "babel", "amsmath", "amssymb", "amsthm", "graphicx"]);
  const conditional = buildPreamble([], [{type:"text", content:"\\citep{x} \\href{u}{v}"}]);
  assert.deepEqual(Array.from(conditional.matchAll(/^\\usepackage(?:\[[^\]]*\])?\{([^}]+)\}/gm), match => match[1]),
    [...packages, "natbib", "hyperref"]);
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
test("una lista anidada cierra sus subniveles antes de emitir los bloques hijos", () => {
  const list = { type: "itemize", content: "Padre\n  1. Hijo", children: [{ type: "text", content: "Un párrafo" }] };
  assert.equal(blockToLatex(list), "\\begin{itemize}\n\\item Padre\n  \\begin{enumerate}\n  \\item Hijo\n  \\end{enumerate}\n\nUn párrafo\n\\end{itemize}");
  assert.equal(blockToLatex({ ...list, content: " \n " }), "Un párrafo");
});
test("la profundidad de lista sigue los entornos abiertos al atravesar bloques de texto y teoremas", () => {
  const child = { type: "itemize", content: "Primer elemento\n  1. Segundo elemento\n    - Tercer elemento" };
  const theorem = { type: "theorem", content: "Teorema", children: [child] };
  const text = { type: "text", content: "Texto", children: [theorem] };
  let state = text;
  for (const type of ["itemize", "itemize", "enumerate", "enumerate"]) {
    state = { type, content: "Elemento padre", children: [state] };
  }
  const result = blockToLatex(state);
  assert.equal(result.match(/\\begin\{/g).length, 6);
  assert.match(result, /\\begin\{theorem\}\nTeorema\n\\begin\{itemize\}\n\\item Primer elemento\n\\item Segundo elemento\n\\item Tercer elemento\n\\end\{itemize\}\n\\end\{theorem\}/);
});
test("una lista completamente recortada conserva sus elementos y sus bloques hijos", () => {
  const list = { type: "enumerate", content: "A\n  - B", children: [{ type: "text", content: "Hijo" }] };
  const result = blockToLatex(list, { depthContext: { total: 4, itemize: 0, enumerate: 4 } });
  assert.equal(result, "A\n\nB\n\nHijo");
});
test("la bibliografía genera claves predecibles y conserva literalmente cada referencia", () => {
  assert.equal(blockToLatex({ type: "bibliography", title: "No se usa", content: "Leithold, L. (1992). El cálculo con geometría. México: Harla.\nSpivak, M. (1993). Cálculo infinitesimal. México: Reverté." }),
    "\\begin{thebibliography}{9}\n\\bibitem{ref1} Leithold, L. (1992). El cálculo con geometría. México: Harla.\n\\bibitem{ref2} Spivak, M. (1993). Cálculo infinitesimal. México: Reverté.\n\\end{thebibliography}");
});
test("la bibliografía admite una referencia y omite el entorno vacío", () => {
  assert.equal(blockToLatex({ type: "bibliography", content: "Referencia única" }), "\\begin{thebibliography}{9}\n\\bibitem{ref1} Referencia única\n\\end{thebibliography}");
  assert.equal(blockToLatex({ type: "bibliography", content: " \n\n " }), "");
});
test("la bibliografía recorta líneas y ajusta el ancho para diez o más referencias", () => {
  const references = Array.from({ length: 10 }, (_, index) => `  Referencia ${index + 1}  `).join("\n");
  const latex = blockToLatex({ type: "bibliography", content: `\n${references}\n` });
  assert.match(latex, /^\\begin\{thebibliography\}\{99\}\n/);
  assert.match(latex, /\\bibitem\{ref1\} Referencia 1\n/);
  assert.match(latex, /\\bibitem\{ref10\} Referencia 10\n\\end\{thebibliography\}$/);
});

test("una imagen conserva la ruta literal y escapa el pie de figura", () => {
  assert.equal(blockToLatex({ type: "image", title: "Gráfica de f_1 & su eje", content: "  figuras/grafica_1.png  ", options: { width: 0.6, angle: 90, label: "Gráfica-1" } }), [
    "\\begin{figure}[htbp]", "\\centering",
    "\\includegraphics[width=0.6\\textwidth,angle=90]{figuras/grafica_1.png}",
    "\\caption{Gráfica de f\\_1 \\& su eje}", "\\label{fig:grafica-1}", "\\end{figure}",
  ].join("\n"));
});

test("una imagen sin opciones ni pie usa el ancho por defecto y omite los campos vacíos", () => {
  assert.equal(blockToLatex({ type: "image", title: "  ", content: "grafica.pdf" }), [
    "\\begin{figure}[htbp]", "\\centering", "\\includegraphics[width=0.8\\textwidth]{grafica.pdf}", "\\end{figure}",
  ].join("\n"));
});

test("la imagen ordena los límites de escala antes del giro y admite alineación lateral", () => {
  const image = { type: "image", content: "figura.jpg", options: { width: 0.4, height: 3.2, angle: -90, placement: "pt", align: "left" } };
  assert.equal(blockToLatex(image), [
    "\\begin{figure}[tp]", "\\raggedright",
    "\\includegraphics[width=0.4\\textwidth,height=3.2cm,keepaspectratio,angle=-90]{figura.jpg}", "\\end{figure}",
  ].join("\n"));
  assert.match(blockToLatex({ ...image, options: { align: "right" } }), /\\raggedleft/);
});

test("una imagen anidada en un teorema permanece junto al texto y usa un pie como párrafo", () => {
  const image = { type: "image", title: "Área & perímetro", content: "plano.png", options: { placement: "p" } };
  assert.equal(blockToLatex({ type: "theorem", content: "Demostración.", children: [{ type: "text", content: "El dibujo", children: [image] }] }), [
    "\\begin{theorem}", "Demostración.", "", "El dibujo",
    "\\begin{center}", "\\includegraphics[width=0.8\\textwidth]{plano.png}", "\\par", "Área \\& perímetro", "\\end{center}", "\\end{theorem}",
  ].join("\n"));
});

test("una imagen a la derecha en una lista acota su alineación y no abre un flotante", () => {
  const image = { type: "image", content: "plano.png", options: { align: "right", label: "plano" } };
  assert.equal(blockToLatex({ type: "itemize", content: "El dibujo", children: [image] }), [
    "\\begin{itemize}", "\\item El dibujo", "\\par\\begingroup", "\\raggedleft",
    "\\includegraphics[width=0.8\\textwidth]{plano.png}", "\\refstepcounter{figure}", "\\label{fig:plano}", "\\par\\endgroup", "\\end{itemize}",
  ].join("\n"));
});

test("una imagen con etiqueta y sin pie establece la referencia de figura", () => {
  const image = { type: "image", content: "plano.png", options: { label: "plano" } };
  assert.match(blockToLatex(image), /\\refstepcounter\{figure\}\n\\label\{fig:plano\}/);
});

test("los hijos de una imagen con ruta vacía se emiten aunque se omita la imagen", () => {
  const image = { type: "image", title: "Sin archivo", content: " \n  ", options: { label: "plano" } };
  assert.equal(blockToLatex(image), "");
  assert.equal(blockToLatex({ ...image, children: [{ type: "text", content: "Se conserva." }] }), "Se conserva.");
  assert.equal(blockToLatex({ type: "enumerate", content: " ", children: [{ type: "image", content: "plano.png" }] }),
    blockToLatex({ type: "image", content: "plano.png" }));
});

test("Demostración usa proof predefinido y su título opcional sin redeclararlo", () => {
 const proof=blockToLatex({type:'proof',title:'Prueba & caso',content:'Es cierto.',children:[]});
 assert.equal(proof, '\\begin{proof}[Prueba \\& caso]\nEs cierto.\n\\end{proof}');
 assert.doesNotMatch(buildPreamble(),/\\newtheorem\{proof\}/);
});

test("hyperref se carga al final de la lista blanca únicamente con enlaces activos en el contenido", () => {
  for (const command of ["\\href{x}{y}", "\\url{x}"]) {
    const preamble = buildPreamble([], [{ type: "text", children: [{ content: command }] }]);
    const packages = [...preamble.matchAll(/\\usepackage(?:\[[^\]]*\])?\{([^}]+)\}/g)].map(m => m[1]);
    assert.deepEqual(packages, ["fontenc","inputenc","babel","amsmath","amssymb","amsthm","graphicx","hyperref"]);
    assert.ok(preamble.includes("\\usepackage[hidelinks]{hyperref}"));
  }
  for (const content of ["% \\href{x}{y}", "\\\\url{x}", "\\urlname", "sin enlace"]) {
    assert.ok(!buildPreamble([], [{ content }]).includes("hyperref"));
  }
});

test("los comandos y títulos emitidos coinciden en orden con el esquema", () => {
  const texto = (title, children = []) => ({ type: "text", title, content: "Contenido", children });
  let profunda = texto("Nivel 7");
  for (let i = 6; i >= 1; i--) profunda = texto("Nivel " + i, [profunda]);
  const casos = [
    [texto("A & B"), texto("Costo {neto} al 5%")],
    [nestedSection],
    [profunda],
    [texto("Raíz", [texto(" ", [texto("Interior")])])],
    [{ type: "definition", children: [texto("Texto en definición")] }],
  ];
  for (const blocks of casos) {
    for (const topic of ["", "Tema #1"]) {
      const state = { metadata: { topic }, blocks };
      const emitidos = Array.from(generateLatex(state).matchAll(
        /^\\(section|subsection|subsubsection|paragraph|subparagraph)\{(.*)\}$/gm
      ), ([, command, title]) => [command, title]);
      const esperados = Array.from(outlineEntries(state))
        .filter(entry => entry.kind === "heading" || entry.kind === "topic")
        .map(entry => [entry.command, escapeMetadata(entry.title)]);
      assert.deepEqual(emitidos, esperados, "los comandos y títulos emitidos coinciden en orden con el esquema");
    }
  }
});
