import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { T, fragmentBlocks } from "./radial-fixtures.mjs";

import { nestedSection } from "./example-state.mjs";

const available = spawnSync("pdflatex", ["--version"], { encoding: "utf8" });
test("pdflatex compila los fragmentos radiales y el enlace en un documento", { skip: available.error?.code === "ENOENT" && "pdflatex no está instalado" }, async () => {
  const dir = await mkdtemp(join(tmpdir(), "notas-latex-"));
  try {
    const tex = T.generateLatex({metadata:{title:"Prueba de los menús"}, blocks:fragmentBlocks});
    await writeFile(join(dir,"fragmentos.tex"), tex);
    const result = spawnSync("pdflatex", ["-interaction=nonstopmode","-halt-on-error","-no-shell-escape","fragmentos.tex"],
      {cwd:dir, encoding:"utf8", timeout:45000});
    assert.ifError(result.error);
    assert.equal(result.status,0,(result.stdout + result.stderr).slice(-3500));
  } finally { await rm(dir,{recursive:true,force:true}); }
});

const optional = { skip: available.error?.code === "ENOENT" && "pdflatex no está instalado" };
async function compileTwice(state, files = {}, readResult = dir => readFile(join(dir, "nota.aux"), "utf8")) {
  const dir = await mkdtemp(join(tmpdir(), "notas-referencias-"));
  try {
    for (const [name, bytes] of Object.entries(files)) await writeFile(join(dir, name), bytes);
    await writeFile(join(dir, "nota.tex"), T.generateLatex(state));
    for (let pass = 0; pass < 2; pass++) {
      const run = spawnSync("pdflatex", ["-interaction=nonstopmode", "-halt-on-error", "-no-shell-escape", "nota.tex"],
        { cwd: dir, encoding: "utf8", timeout: 45000 });
      assert.ifError(run.error);
      assert.equal(run.status, 0, (run.stdout + run.stderr).slice(-3500));
    }
    const log = await readFile(join(dir, "nota.log"), "utf8");
    assert.doesNotMatch(log, /(?:Reference|Citation) .+ undefined|undefined (?:references|citations)/i);
    return await readResult(dir);
  } finally { await rm(dir, {recursive: true, force: true}); }
}

test("pdflatex confirma los números de cada destino tras dos compilaciones", optional, async () => {
  const blocks = T.BLOCK_TYPES.filter(type => type.labelPrefix).map(type => ({
    type: type.id, label: type.labelPrefix + ":prueba", title: "Título",
    content: type.id === "image" ? "imagen.png" : "x",
  }));
  blocks.unshift({type:"theorem", content:"Previo"}, {type:"equation", content:"a=b"});
  blocks.push({type:"theorem", content:"Con figura", children:[{type:"image", content:"imagen.png", label:"fig:interna"}]});
  const state = {metadata:{title:"Destinos"}, blocks};
  const targets = T.referenceTargets(state);
  blocks.push({type:"text", content:targets.map(t => (t.typeId === "equation" ? "\\eqref" : "\\ref") + "{" + t.label + "}").join(", ")});
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNgYGAAAAAEAAH2FzhVAAAAAElFTkSuQmCC", "base64");
  const aux = await compileTwice(state, {"imagen.png": png});
  for (const t of targets) assert.ok(aux.includes(`\\newlabel{${t.label}}{{${t.number}}`), aux);
});

async function checkCourseCitations(style) {
    const references = T.COURSE_REFERENCES;
    const state = { metadata:{title:"Libros del curso"}, references, bibliography:{style}, blocks:[
      {type:"text",content:"Según \\citet{larson1995}, véase \\citep[p.~912]{stewart1994,spivak1993}.", children:[
        {type:"text",content:"También \\citep{zill1996,leithold1992,swokowski1989}."}]},
      {type:"text",content:"\\citeauthor{boyce1994} y \\citeyear{stein1995}."},
    ]};
    const aux = await compileTwice(state);
    const keys = [...aux.matchAll(/\\bibcite\{([^}]+)\}/g)].map(m => m[1]);
    assert.equal(keys.length, 8);
    assert.deepEqual(keys, Array.from(T.printedReferences(state), r => r.entry.key));
}
test("pdflatex confirma las ocho citas del curso y el orden de bibcite en IEEE", optional, () => checkCourseCitations("ieee"));
test("pdflatex confirma las ocho citas del curso y el orden de bibcite en APA", optional, () => checkCourseCitations("apa"));

const extractor = spawnSync("pdftotext", ["-v"], { encoding: "utf8" });
const optionalPdfText = {
  skip: optional.skip || (extractor.error?.code === "ENOENT" && "pdftotext no está instalado"),
};
function pdfText(dir) {
  const result = spawnSync("pdftotext", ["-layout", "nota.pdf", "-"], { cwd: dir, encoding: "utf8" });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.normalize("NFC");
}

test("el PDF imprime los números de los encabezados en el orden del esquema", optionalPdfText, async () => {
  const state = { metadata: { title: "Prueba de niveles", topic: "Recintos" }, blocks: [nestedSection] };
  const texto = await compileTwice(state, {}, pdfText);
  const headings = Array.from(T.outlineEntries(state))
    .filter(entry => entry.kind === "topic" || entry.kind === "heading");
  const impresos = [];
  for (const line of texto.split(/\r?\n/)) {
    // El punto final del número depende de babel. Un párrafo puede compartir línea con su texto.
    const [, number, body] = line.trim().match(/^(?:(\d+(?:\.\d+)*)\.?\s+)?(.*)$/);
    const heading = headings.find(entry => body === entry.title || body.startsWith(entry.title + " "));
    if (heading) impresos.push([number ?? null, heading.title]);
  }
  assert.deepEqual(impresos, headings.map(entry => [entry.number, entry.title]), texto);
});

test("el PDF coincide con el esquema a cinco niveles y reinicia los teoremas por sección", optionalPdfText, async () => {
  const text = (title, children) => ({ type: "text", title, content: "Introducción.", children });
  const theorem = { type: "theorem", content: "Enunciado.", label: "teo:inicial" };
  const definition = { type: "definition", content: "Concepto.", label: "def:inicial" };
  const fiveLevels = text("Primera parte", [definition, theorem,
    text("Método", [text("Demostraciones", [text("Detalle", [text("Observación")])]), { ...theorem, label: "teo:metodo" }])]);
  const state = { metadata: { title: "Prueba de numeración" }, numbering: { levels: 5, theoremsBySection: true },
    blocks: [{ ...theorem, label: "teo:previo" }, fiveLevels, text("Segunda parte", [
      { ...theorem, label: "teo:final" }, { ...definition, label: "def:final" },
    ])] };
  const entries = Array.from(T.outlineEntries(state)).filter(e => e.kind === "heading" || e.kind === "theorem");
  const expected = entries.map(e => [e.number, e.heading ?? e.title]);
  const headingTitles = entries.filter(e => e.kind === "heading").map(e => e.title);
  const theoremNames = [...new Set(entries.filter(e => e.kind === "theorem").map(e => e.heading))];
  const printed = [];
  const { texto, aux } = await compileTwice(state, {}, async dir => ({
    texto: pdfText(dir),
    aux: await readFile(join(dir, "nota.aux"), "utf8"),
  }));
  for (const line of texto.split(/\r?\n/).map(line => line.trim())) {
    const heading = line.match(/^(\d+(?:\.\d+)*)\.?\s+(.+)$/);
    const title = heading && headingTitles.find(title => heading[2] === title || heading[2].startsWith(title + " "));
    if (title) printed.push([heading[1], title]);
    const theorem = line.match(/^(\S+)\s+(\d+(?:\.\d+)+)\b/);
    if (theorem && theoremNames.includes(theorem[1])) printed.push([theorem[2], theorem[1]]);
  }
  assert.deepEqual(printed, expected, texto);
  for (const target of T.referenceTargets(state)) {
    assert.ok(aux.includes("\\newlabel{" + target.label + "}{{" + target.number + "}"), aux);
  }
});
