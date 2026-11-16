import test from "node:test";
import assert from "node:assert/strict";
import { loadTexNotes } from "./load-app.mjs";

const { BLOCK_TYPES, mathSegments, analyzeContent } = await loadTexNotes([
  "block-types.js", "latex-generator.js", "math-preview.js",
]);
const segments = (content, type = "text") => structuredClone(mathSegments(content, type));

test("extrae cada delimitador y conserva posiciones y prosa literal", () => {
  const content = "Sea $x \\in A$, luego $$y^2$$; también \\(z\\) y \\[w\\].";
  const result = segments(content);
  assert.deepEqual(result.map(({ math, displayMode }) => ({ math, displayMode })), [
    { math: "x \\in A", displayMode: false },
    { math: "y^2", displayMode: true },
    { math: "z", displayMode: false },
    { math: "w", displayMode: true },
  ]);
  let cursor = 0;
  const prose = [];
  for (const segment of result) { prose.push(content.slice(cursor, segment.start)); cursor = segment.end; }
  prose.push(content.slice(cursor));
  assert.deepEqual(prose, ["Sea ", ", luego ", "; también ", " y ", "."]);
});

test("prioriza dobles dólares e ignora dólares escapados o sin pareja", () => {
  assert.deepEqual(segments("$$x$$").map(({ math, displayMode }) => ({ math, displayMode })), [{ math: "x", displayMode: true }]);
  assert.deepEqual(segments("precio \\$5 y $sin cierre"), []);
  assert.deepEqual(segments("precio \\$5 y $sí$ con \\$fin").map(({ math }) => math), ["sí"]);
});

test("normaliza CRLF y acepta varios tramos y contenido vacío", () => {
  assert.equal(segments("a $x\r\ny$ b")[0].math, "x\ny");
  assert.equal(segments("$a$ / $b$").length, 2);
  assert.deepEqual(segments(""), []);
});

test("los tipos matemáticos usan todo el contenido y derivan displayMode de la tabla", () => {
  assert.deepEqual(segments("  \\frac{1}{2}\r\n", "equation"), [{ math: "\\frac{1}{2}", displayMode: true, start: 2, end: 13 }]);
  assert.deepEqual(segments(" x+y ", "math-inline"), [{ math: "x+y", displayMode: false, start: 1, end: 4 }]);
});

test("todos los kinds no matemáticos extraen tramos delimitados", () => {
  for (const type of BLOCK_TYPES.filter(({ kind }) => kind !== "equation")) {
    assert.equal(segments("antes $x$ después", type.id)[0].math, "x", type.id);
  }
});

test("analyzeContent clasifica resultados y fallos del renderizador inyectado", () => {
  const result = structuredClone(analyzeContent("$bien$ y $mal$", "text", (math, displayMode) =>
    math === "mal" ? { ok: false, message: "incompleta" } : { ok: true, html: `<b>${math}:${displayMode}</b>` }));
  assert.equal(result.segments[0].html, "<b>bien:false</b>");
  assert.deepEqual(result.failures.map(({ math, message }) => ({ math, message })), [{ math: "mal", message: "incompleta" }]);
});
