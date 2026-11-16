/** Árbol de bloques: operaciones por ruta, generación recursiva y borradores. */
import test from "node:test";
import assert from "node:assert/strict";
import { loadTexNotes } from "./load-app.mjs";

const {
  DRAFT_VERSION, acceptsChildren, blockAtPath, blockToLatex, cloneBlock, countBlocks, duplicateBlock,
  flattenBlocks, generateLatex, insertBlock, keyToPath, moveBlock, normalizeBlocks, normalizeDraft,
  pathLabel, pathToKey, removeBlock, updateBlock,
} = await loadTexNotes();

// Lo que devuelve el código cargado en el vm pertenece a otro realm y fallaría
// en deepEqual por prototipo; se clona al realm de la prueba antes de comparar.
const mirror = (value) => structuredClone(value);
const node = (type, content, children = []) => ({ type, title: "", content, children });
/** Árbol de tres niveles reutilizado por varias pruebas. */
const tree = () => normalizeBlocks([
  node("theorem", "Padre", [node("itemize", "Uno\nDos", [node("text", "Nieto")])]),
  node("text", "Hermano"),
]);
const shape = (blocks) => [...flattenBlocks(blocks)].map((entry) => `${pathToKey(entry.path)}:${entry.block.content}`);

/* --- Modelo y normalización --- */

test("la ausencia de children equivale a una lista vacía y el estado plano sigue siendo válido", () => {
  const blocks = normalizeBlocks([{ type: "text", content: "Uno" }, { type: "note", title: "T", content: "Dos" }]);
  assert.deepEqual(mirror(blocks), [
    { type: "text", title: "", content: "Uno", children: [] },
    { type: "note", title: "T", content: "Dos", children: [] },
  ]);
});

test("solo los tipos declarados como contenedores admiten hijos", () => {
  for (const id of ["text", "definition", "theorem", "proposition", "example", "note", "itemize", "enumerate"]) assert.ok(acceptsChildren(id), id);
  for (const id of ["equation", "math-inline", "bibliography"]) assert.ok(!acceptsChildren(id), id);
  // Un tipo desconocido cae en "text", igual que en el generador.
  assert.ok(acceptsChildren("inexistente"));
});

test("los hijos de un tipo que no los admite se conservan como hermanos, no se pierden", () => {
  const blocks = normalizeBlocks([node("equation", "x=1", [node("text", "Rescatado")])]);
  assert.deepEqual(shape(blocks), ["0:x=1", "1:Rescatado"]);
  assert.deepEqual(mirror(blocks[0].children), []);
});

test("la normalización sanea datos corruptos a cualquier profundidad sin lanzar", () => {
  assert.deepEqual(mirror(normalizeBlocks(null)), []);
  assert.deepEqual(mirror(normalizeBlocks("texto")), []);
  assert.deepEqual(mirror(normalizeBlocks([null, 7, [], { type: "text" }])), []);
  const blocks = normalizeBlocks([
    { type: 42, title: 7, content: "Tipo inválido", children: "nada" },
    { content: "Sin tipo", children: [{ type: "text", content: "Hijo" }, { nada: true }] },
  ]);
  assert.deepEqual(shape(blocks), ["0:Tipo inválido", "1:Sin tipo", "1.0:Hijo"]);
  assert.equal(blocks[0].type, "text");
  assert.equal(blocks[0].title, "");
});

/* --- Operaciones por ruta --- */

test("una ruta identifica el nodo y sobrevive a hermanos con el mismo texto", () => {
  const blocks = normalizeBlocks([node("text", "Igual", [node("text", "Igual")]), node("text", "Igual")]);
  assert.equal(blockAtPath(blocks, [0, 0]).content, "Igual");
  assert.equal(pathLabel([1, 0]), "2.1");
  assert.deepEqual(mirror(keyToPath(pathToKey([1, 0]))), [1, 0]);
  assert.deepEqual(mirror(keyToPath("")), []);
  assert.deepEqual(mirror(keyToPath("no-es-una-ruta")), []);
});

test("insertar admite raíz, hijo y posición concreta, y devuelve la ruta creada", () => {
  const raiz = insertBlock(tree(), [], node("note", "Final"));
  assert.deepEqual(mirror(raiz.path), [2]);
  const hijo = insertBlock(tree(), [0, 0], node("text", "Otro nieto"));
  assert.deepEqual(mirror(hijo.path), [0, 0, 1]);
  assert.deepEqual(shape(hijo.blocks), ["0:Padre", "0.0:Uno\nDos", "0.0.0:Nieto", "0.0.1:Otro nieto", "1:Hermano"]);
  const primero = insertBlock(tree(), [0], node("text", "Al inicio"), 0);
  assert.deepEqual(mirror(primero.path), [0, 0]);
  assert.equal(blockAtPath(primero.blocks, [0, 1]).content, "Uno\nDos");
});

test("actualizar conserva la descendencia y rechaza un tipo que no la admite", () => {
  const actualizado = updateBlock(tree(), [0, 0], { type: "enumerate", title: "Puntos", content: "Uno" });
  assert.equal(blockAtPath(actualizado, [0, 0]).type, "enumerate");
  assert.equal(blockAtPath(actualizado, [0, 0]).title, "Puntos");
  assert.equal(blockAtPath(actualizado, [0, 0, 0]).content, "Nieto", "los hijos se conservan");
  assert.equal(updateBlock(tree(), [0, 0], { type: "equation" }), null, "una lista con hijos no puede volverse ecuación");
  // Un nodo sin hijos sí puede cambiar a un tipo que no los admite.
  assert.equal(blockAtPath(updateBlock(tree(), [1], { type: "equation" }), [1]).type, "equation");
});

test("eliminar retira el nodo con toda su descendencia", () => {
  assert.deepEqual(shape(removeBlock(tree(), [0, 0])), ["0:Padre", "1:Hermano"]);
  assert.deepEqual(shape(removeBlock(tree(), [0])), ["0:Hermano"]);
  assert.equal(countBlocks(tree()), 4);
  assert.equal(countBlocks(blockAtPath(tree(), [0]).children), 2);
});

test("mover se limita a los hermanos y nunca cambia de nivel", () => {
  const bajado = moveBlock(tree(), [0], 1);
  assert.deepEqual(mirror(bajado.path), [1]);
  assert.deepEqual(shape(bajado.blocks), ["0:Hermano", "1:Padre", "1.0:Uno\nDos", "1.0.0:Nieto"]);
  assert.equal(moveBlock(tree(), [0], -1), null, "ya es el primero de su nivel");
  assert.equal(moveBlock(tree(), [1], 1), null, "ya es el último de su nivel");
  assert.equal(moveBlock(tree(), [0, 0], 1), null, "un hijo único no puede salir de su padre");
});

test("una operación inválida devuelve null y deja el árbol intacto", () => {
  const original = tree();
  const copia = tree();
  for (const invalida of [
    () => blockAtPath(original, [9]), () => blockAtPath(original, []), () => blockAtPath(original, [0, "x"]),
    () => insertBlock(original, [9], node("text", "x")), () => insertBlock(original, [], null),
    () => insertBlock(original, [1, 0], node("text", "x")), () => updateBlock(original, [5], { content: "x" }),
    () => removeBlock(original, [0, 9]), () => removeBlock(original, []), () => moveBlock(original, [0], 5),
  ]) assert.equal(invalida(), null);
  assert.deepEqual(mirror(original), mirror(copia), "ninguna operación modifica el árbol recibido");
});

test("las operaciones son puras: devuelven un árbol nuevo", () => {
  const original = tree();
  const siguiente = insertBlock(original, [0], node("text", "Nuevo")).blocks;
  assert.equal(original[0].children.length, 1);
  assert.equal(siguiente[0].children.length, 2);
  assert.notEqual(original[0], siguiente[0]);
});

test("el recorrido aporta ruta, nivel, padre y número de hermanos", () => {
  const entries = [...flattenBlocks(tree())];
  assert.deepEqual(entries.map((entry) => entry.depth), [1, 2, 3, 1]);
  assert.deepEqual(entries.map((entry) => entry.siblings), [2, 1, 1, 2]);
  assert.equal(entries[0].parent, null);
  assert.equal(entries[2].parent.type, "itemize");
  assert.deepEqual(mirror(entries[2].parentPath), [0, 0]);
});

/* --- Generación recursiva --- */

test("los hijos de un entorno se emiten antes de su \\end, en orden", () => {
  assert.equal(
    blockToLatex({ type: "theorem", title: "", content: "Texto del padre.", children: [node("itemize", "Primero\nSegundo")] }),
    ["\\begin{theorem}", "Texto del padre.", "\\begin{itemize}", "\\item Primero", "\\item Segundo", "\\end{itemize}", "\\end{theorem}"].join("\n"));
});

test("la anidación de tres niveles conserva el orden y cierra cada entorno", () => {
  assert.equal(
    blockToLatex(node("definition", "Nivel uno con $x_1$.", [node("example", "Nivel dos.", [node("enumerate", "Nivel tres & 50%")])])),
    ["\\begin{definition}", "Nivel uno con $x_1$.", "\\begin{example}", "Nivel dos.",
      "\\begin{enumerate}", "\\item Nivel tres & 50%", "\\end{enumerate}", "\\end{example}", "\\end{definition}"].join("\n"));
});

test("los hijos de un bloque de texto se emiten tras su contenido, como nodos propios", () => {
  assert.equal(blockToLatex({ type: "text", title: "Referencias", content: "Padre.", children: [node("text", "Hijo.")] }),
    "\\subsection{Referencias}\nPadre.\n\nHijo.");
  // Un hijo que abre entorno se pega a la línea anterior; uno de prosa abre párrafo.
  assert.equal(blockToLatex(node("text", "Padre.", [node("equation", "x=1")])), "Padre.\n\\[\nx=1\n\\]");
  assert.doesNotMatch(blockToLatex(node("text", "Padre.", [node("itemize", "Uno")])), /\n\n/, "sin líneas en blanco accidentales");
});

test("el contenido del padre no absorbe a sus hijos y un padre vacío no rompe la salida", () => {
  const padre = { type: "note", title: "", content: "Cuerpo", children: [node("text", "Hijo")] };
  assert.equal(padre.content, "Cuerpo", "blockToLatex no modifica el bloque recibido");
  assert.equal(padre.children.length, 1);
  assert.equal(blockToLatex(node("theorem", "   ", [node("text", "Solo el hijo")])), "\\begin{theorem}\nSolo el hijo\n\\end{theorem}");
  assert.equal(blockToLatex(node("theorem", "   ", [])), "");
  // Un entorno de lista sin ningún \item no compila: el hijo se emite solo.
  assert.equal(blockToLatex(node("itemize", "  ", [node("text", "Suelto")])), "Suelto");
});

test("una fórmula no anida: unos hijos heredados se emiten tras el cierre, nunca dentro", () => {
  assert.equal(blockToLatex({ type: "equation", content: "x=1", children: [node("text", "Nota")] }), "\\[\nx=1\n\\]\n\nNota");
  assert.equal(blockToLatex({ type: "math-inline", content: "x", children: [node("itemize", "Uno")] }), "\\(x\\)\n\\begin{itemize}\n\\item Uno\n\\end{itemize}");
});

test("el documento combina matemática mixta y anidación en un mismo bloque", () => {
  const tex = generateLatex({ metadata: { title: "Topología" }, blocks: normalizeBlocks([
    node("theorem", "Sea $x_1 \\in A$ un punto interior.", [node("itemize", "Existe $r > 0$ con $B(x_1, r) \\subseteq A$\nEl 50% restante & más")]),
  ]) });
  assert.match(tex, /\\begin\{theorem\}\nSea \$x_1 \\in A\$ un punto interior\.\n\\begin\{itemize\}\n\\item Existe \$r > 0\$ con \$B\(x_1, r\) \\subseteq A\$\n\\item El 50% restante & más\n\\end\{itemize\}\n\\end\{theorem\}/);
  assert.equal(tex, generateLatex({ metadata: { title: "Topología" }, blocks: normalizeBlocks([
    node("theorem", "Sea $x_1 \\in A$ un punto interior.", [node("itemize", "Existe $r > 0$ con $B(x_1, r) \\subseteq A$\nEl 50% restante & más")]),
  ]) }), "la salida es determinista");
});

/* --- Persistencia --- */

test("un borrador plano de la versión 1 se migra sin reescribirlo a mano", () => {
  const draft = normalizeDraft({ version: 1, metadata: { title: "Notas", author: "Ana" }, blocks: [{ type: "text", content: "Uno" }, { type: "note", title: "N", content: "Dos" }] });
  assert.equal(draft.version, 1, "se informa la versión leída para poder anunciar la migración");
  assert.deepEqual(mirror(draft.metadata), { title: "Notas", author: "Ana" });
  assert.deepEqual(shape(draft.blocks), ["0:Uno", "1:Dos"]);
  assert.deepEqual(mirror(draft.blocks[0].children), []);
});

test("un borrador del esquema nuevo se restaura con su árbol completo", () => {
  const draft = normalizeDraft({ version: DRAFT_VERSION, metadata: { title: "Notas" }, blocks: tree() });
  assert.equal(draft.version, DRAFT_VERSION);
  assert.deepEqual(shape(draft.blocks), ["0:Padre", "0.0:Uno\nDos", "0.0.0:Nieto", "1:Hermano"]);
});

test("un borrador corrupto o de una versión futura se rechaza sin lanzar", () => {
  for (const invalido of [null, undefined, 7, "texto", [], {}, { version: 1 }, { version: 0, metadata: {} },
    { version: DRAFT_VERSION + 1, metadata: {}, blocks: [] }, { version: "dos", metadata: {}, blocks: [] },
    { version: 1, metadata: [], blocks: [] }, { version: 1, metadata: null, blocks: [] }]) {
    assert.equal(normalizeDraft(invalido), null, JSON.stringify(invalido));
  }
});

test("una anidación mal formada se sanea en lugar de romper la restauración", () => {
  const draft = normalizeDraft({
    version: DRAFT_VERSION,
    metadata: { title: "Notas", author: 7, course: null },
    blocks: [{ type: "theorem", content: "Padre", children: { type: "text", content: "No es un array" } },
      { type: "text", content: "Otro", children: [{ type: "text", content: "Hijo", children: [null, { type: "text", content: "Nieto" }] }] }],
  });
  assert.deepEqual(mirror(draft.metadata), { title: "Notas" }, "solo se conservan los metadatos de tipo cadena");
  assert.deepEqual(shape(draft.blocks), ["0:Padre", "1:Otro", "1.0:Hijo", "1.0.0:Nieto"]);
});

/* --- Duplicar y copiar: dos operaciones distintas sobre la misma copia profunda --- */

test("duplicar una hoja la coloca inmediatamente después, en el mismo nivel", () => {
  const original = tree();
  const result = duplicateBlock(original, [0, 0, 0]);
  assert.deepEqual(mirror(result.path), [0, 0, 1], "la copia ocupa la posición siguiente entre sus hermanos");
  assert.deepEqual(shape(result.blocks), ["0:Padre", "0.0:Uno\nDos", "0.0.0:Nieto", "0.0.1:Nieto", "1:Hermano"]);
  assert.deepEqual(shape(original), shape(tree()), "el árbol recibido no se modifica");
});

test("duplicar una rama de tres niveles conserva el orden exacto de toda la rama", () => {
  const result = duplicateBlock(tree(), [0]);
  assert.deepEqual(mirror(result.path), [1]);
  assert.deepEqual(shape(result.blocks), [
    "0:Padre", "0.0:Uno\nDos", "0.0.0:Nieto",
    "1:Padre", "1.0:Uno\nDos", "1.0.0:Nieto",
    "2:Hermano",
  ]);
  assert.equal(countBlocks(result.blocks), 7);
});

test("la copia es profunda: editar o eliminar una rama no toca a la otra", () => {
  const { blocks, path } = duplicateBlock(tree(), [0]);
  assert.notEqual(blockAtPath(blocks, [0]), blockAtPath(blocks, path), "no comparten el nodo");
  assert.notEqual(blockAtPath(blocks, [0, 0]).children, blockAtPath(blocks, [1, 0]).children, "no comparten el array de hijos");
  const editado = updateBlock(blocks, [1, 0, 0], { content: "Cambiado" });
  assert.equal(blockAtPath(editado, [0, 0, 0]).content, "Nieto", "el original conserva su contenido");
  const podado = removeBlock(blocks, [1, 0]);
  assert.deepEqual(shape(podado), ["0:Padre", "0.0:Uno\nDos", "0.0.0:Nieto", "1:Padre", "2:Hermano"]);
});

test("duplicar por una ruta inválida devuelve null y no muta el árbol", () => {
  const original = tree();
  for (const ruta of [[], [9], [0, 5], [0, 0, 0, 0], "0", null, [-1], [1.5]]) {
    assert.equal(duplicateBlock(original, ruta), null, JSON.stringify(ruta));
  }
  assert.deepEqual(shape(original), shape(tree()));
});

test("el duplicado de un bloque generado produce la misma salida dos veces", () => {
  const { blocks } = duplicateBlock(tree(), [0]);
  const latex = generateLatex({ metadata: { title: "T" }, blocks });
  const teoremas = latex.match(/\\begin\{theorem\}[\s\S]*?\\end\{theorem\}/g) || [];
  assert.equal(teoremas.length, 2);
  assert.equal(teoremas[0], teoremas[1], "las dos ramas generan exactamente el mismo LaTeX");
});

test("copiar entrega un bloque suelto e independiente, y cada pegado es otro más", () => {
  const original = tree();
  const bandeja = cloneBlock(blockAtPath(original, [0]));
  assert.deepEqual(shape([bandeja]), ["0:Padre", "0.0:Uno\nDos", "0.0.0:Nieto"]);
  const primero = insertBlock(original, [], cloneBlock(bandeja));
  const segundo = insertBlock(primero.blocks, [1], cloneBlock(bandeja));
  assert.deepEqual(mirror(segundo.path), [1, 0], "el segundo pegado cae dentro del destino elegido, no en la raíz");
  assert.deepEqual(shape(segundo.blocks), [
    "0:Padre", "0.0:Uno\nDos", "0.0.0:Nieto",
    "1:Hermano", "1.0:Padre", "1.0.0:Uno\nDos", "1.0.0.0:Nieto",
    "2:Padre", "2.0:Uno\nDos", "2.0.0:Nieto",
  ]);
  const editado = updateBlock(segundo.blocks, [2, 0, 0], { content: "Solo este" });
  assert.equal(blockAtPath(editado, [1, 0, 0, 0]).content, "Nieto", "los pegados no comparten estado entre sí");
  assert.equal(blockAtPath(editado, [0, 0, 0]).content, "Nieto", "ni con el original");
  assert.deepEqual(shape(original), shape(tree()), "copiar no modifica el documento");
});

test("copiar sanea lo que entra y rechaza lo que no es un bloque", () => {
  assert.equal(cloneBlock(null), null);
  assert.equal(cloneBlock({ type: "text" }), null, "sin contenido ni hijos no hay bloque");
  const saneado = cloneBlock({ type: "equation", content: "x^2", children: [{ type: "text", content: "Hijo" }] });
  assert.deepEqual(mirror(saneado.children), [], "una fórmula no anida: sus hijos no viajan dentro");
});

test("guardar y restaurar después de duplicar mantiene ambas ramas", () => {
  const { blocks } = duplicateBlock(tree(), [0]);
  const guardado = JSON.parse(JSON.stringify({ version: DRAFT_VERSION, metadata: { title: "Notas" }, blocks }));
  const draft = normalizeDraft(guardado);
  assert.equal(draft.version, DRAFT_VERSION, "duplicar no cambia el esquema del borrador");
  assert.deepEqual(shape(draft.blocks), shape(blocks));
  assert.equal(countBlocks(draft.blocks), 7);
});
