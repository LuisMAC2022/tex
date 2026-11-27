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
  assert.deepEqual(mirror(blocks).map(({id, ...block}) => block), [
    { type: "text", title: "", content: "Uno", children: [] },
    { type: "note", title: "T", content: "Dos", children: [] },
  ]);
});

test("solo los tipos declarados como contenedores admiten hijos", () => {
  for (const id of ["text", "definition", "theorem", "proposition", "example", "note", "itemize", "enumerate"]) assert.ok(acceptsChildren(id), id);
  for (const id of ["equation", "math-inline", "bibliography", "image"]) assert.ok(!acceptsChildren(id), id);
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
  const copia = mirror(original);
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
  assert.equal(draft.migratedFrom, 1, "se informa la versión leída para poder anunciar la migración");
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

/* --- Mover una rama a otro padre --- */

const { moveBlockTo } = await loadTexNotes(["block-types.js", "block-tree.js"]);

test("mover a otro padre rechaza rutas inexistentes, ciclos y destinos sin hijos", () => {
  const original = [tree()[0], node("equation", "x=1")];
  const snapshot = mirror(original);
  for (const source of [[], [9], [0, 8], [-1], [0.5], Array(1), "0", null]) {
    assert.equal(moveBlockTo(original, source, []), null);
  }
  for (const destination of [[8], [0, 5], [0], [0, 0], [0, 0, 0], [1], [-1], Array(1), "", null]) {
    assert.equal(moveBlockTo(original, [0], destination), null);
  }
  assert.deepEqual(mirror(original), snapshot);
});

test("mover una rama ajusta la ruta profunda de un destino desplazado y conserva sus hijos", () => {
  const original = [
    tree()[0], node("text", "Entre medias"),
    node("text", "Destino", [node("note", "Sección", [node("text", "Interior", [node("text", "Primero")])])]),
  ];
  const snapshot = mirror(original);
  const source = [0];
  const destination = [2, 0, 0];
  const result = moveBlockTo(original, source, destination);
  assert.deepEqual(mirror(result.path), [1, 0, 0, 1]);
  const moved = blockAtPath(result.blocks, result.path);
  assert.deepEqual(mirror(moved), snapshot[0]);
  assert.notEqual(moved.children, original[0].children);
  assert.equal(blockAtPath(result.blocks, [1, 0, 0, 0]).content, "Primero");
  assert.deepEqual(mirror(original), snapshot);
  assert.deepEqual(source, [0]);
  assert.deepEqual(destination, [2, 0, 0]);
});

test("al mover entre ramas solo se ajusta el índice de un hermano del origen", () => {
  const original = [
    node("text", "Padre", [node("text", "Mover"), node("text", "Hermano", [node("text", "Destino local")])]),
    node("text", "Otro padre", [node("text", "Primero"), node("text", "Destino externo")]),
  ];
  const local = moveBlockTo(original, [0, 0], [0, 1, 0]);
  assert.deepEqual(mirror(local.path), [0, 0, 0, 0]);
  assert.equal(blockAtPath(local.blocks, [0, 0, 0]).content, "Destino local");
  const external = moveBlockTo(original, [0, 0], [1, 1]);
  assert.deepEqual(mirror(external.path), [1, 1, 0]);
  assert.equal(blockAtPath(external.blocks, [1, 1]).content, "Destino externo");
});

test("mover a la raíz elige por ruta entre hermanos idénticos", () => {
  const original = [node("text", "Padre", [node("text", "Igual"), node("text", "Entre medias"), node("text", "Igual")])];
  const result = moveBlockTo(original, [0, 2], [], 0);
  assert.deepEqual(mirror(result.path), [0]);
  assert.deepEqual(shape(result.blocks), ["0:Igual", "1:Padre", "1.0:Igual", "1.1:Entre medias"]);
});

test("mover al mismo padre reordena entre hermanos como subir y bajar", () => {
  const original = [node("text", "Padre", [node("text", "Uno"), node("text", "Dos")])];
  const first = moveBlockTo(original, [0, 1], [0], 0);
  const last = moveBlockTo(original, [0, 0], [0]);
  assert.deepEqual(mirror(first), mirror(moveBlock(original, [0, 1], -1)));
  assert.deepEqual(mirror(last), mirror(moveBlock(original, [0, 0], 1)));
  assert.equal(moveBlock(original, [0, 0], -1), null);
  assert.equal(moveBlock(original, [0, 1], 1), null);
});

test("mover un bloque a un teorema emite su contenido literal dentro del entorno", () => {
  const original = [node("text", "Se cumple $x_1 = 0$."), node("theorem", "Sea $x_1$ fijo.")];
  const result = moveBlockTo(original, [0], [1]);
  assert.equal(blockToLatex(result.blocks[0]), "\\begin{theorem}\nSea $x_1$ fijo.\n\nSe cumple $x_1 = 0$.\n\\end{theorem}");
});

test("las opciones de imagen sobreviven a duplicar, copiar, pegar y restaurar la versión 2", () => {
  const rawImage = { type: "image", content: "figura.png", options: { width: "0.60", height: 3, angle: 90, label: "Gráfica" } };
  const options = { width: 0.6, height: 3, angle: 90, align: "center", placement: "htbp" };
  const original = normalizeBlocks([node("theorem", "Padre", [rawImage])]);
  const duplicated = duplicateBlock(original, [0, 0]);
  const copied = cloneBlock(blockAtPath(duplicated.blocks, [0, 1]));
  const pasted = insertBlock(duplicated.blocks, [], copied);
  const restored = normalizeDraft(JSON.parse(JSON.stringify({ version: 2, metadata: {}, blocks: pasted.blocks })));
  assert.equal(restored.migratedFrom, 2);
  assert.equal(blockAtPath(restored.blocks, [0, 0]).label, "fig:grafica");
  for (const path of [[0, 1], [1]]) assert.equal(blockAtPath(restored.blocks, path).label, undefined);
  for (const path of [[0, 0], [0, 1], [1]]) assert.deepEqual(mirror(blockAtPath(restored.blocks, path).options), options);
  assert.notEqual(blockAtPath(duplicated.blocks, [0, 0]).options, blockAtPath(duplicated.blocks, [0, 1]).options);
  assert.notEqual(blockAtPath(duplicated.blocks, [0, 1]).options, copied.options);
  assert.notEqual(blockAtPath(pasted.blocks, [1]).options, copied.options);
});

test("editar normaliza las opciones de imagen y las descarta al cambiar a otro tipo", () => {
  const image = [{ type: "image", content: "plano.jpg", children: [] }];
  assert.equal(Object.hasOwn(normalizeBlocks(image)[0], "options"), false);
  const edited = updateBlock(image, [0], { options: { width: 0.4, angle: -90 } });
  assert.equal(edited[0].options.width, 0.4);
  assert.equal(updateBlock(edited, [0], { title: "Plano" })[0].options.angle, -90);
  assert.equal(Object.hasOwn(updateBlock(edited, [0], { type: "text", options: { width: 0.5 } })[0], "options"), false);
  assert.equal(Object.hasOwn(normalizeBlocks([{ type: "text", content: "Prosa", options: { width: 0.5 } }])[0], "options"), false);
  assert.equal(Object.hasOwn(cloneBlock({ type: "text", content: "Prosa", options: { width: 0.5 } }), "options"), false);
});

test("restaurar listas antiguas de ambas versiones mantiene los prefijos literales y la lista plana", () => {
  const content = "- Guion literal\r\n  1. Número literal\r\n\t* Asterisco literal";
  const oldList = { type: "itemize", content };
  const oldLatex = "\\begin{itemize}\n\\item - Guion literal\n\\item 1. Número literal\n\\item * Asterisco literal\n\\end{itemize}";
  for (const version of [1, 2]) {
    const draft = normalizeDraft({ version, metadata: {}, blocks: [oldList] });
    assert.equal(draft.blocks[0].content, content);
    assert.equal(blockToLatex(draft.blocks[0]), oldLatex);
    assert.ok(generateLatex(draft).includes(oldLatex));
    const unchanged = updateBlock(draft.blocks, [0], { title: "Otro título", content: content.replaceAll("\r\n", "\n") });
    assert.equal(blockToLatex(unchanged[0]), oldLatex);
    const changed = updateBlock(unchanged, [0], { content: "- Primer elemento\n  1. Segundo nivel" });
    assert.equal(blockToLatex(changed[0]), "\\begin{itemize}\n\\item Primer elemento\n  \\begin{enumerate}\n  \\item Segundo nivel\n  \\end{enumerate}\n\\end{itemize}");
    assert.equal(Object.hasOwn(updateBlock(draft.blocks, [0], { type: "text" })[0], "listFormat"), false);
  }
});

test("listas nuevas y antiguas conservan su propio formato al copiar, duplicar, mover, guardar y restaurar", () => {
  const content = "- Padre\n  1. Hijo";
  const raw = { type: "itemize", content };
  const old = normalizeDraft({ version: 2, metadata: {}, blocks: [raw, { type: "text", content: "Destino" }] });
  const added = insertBlock(old.blocks, [], raw);
  const duplicated = duplicateBlock(added.blocks, [0]);
  const pasted = insertBlock(duplicated.blocks, [], cloneBlock(duplicated.blocks[0]));
  const moved = moveBlockTo(pasted.blocks, [4], [2]);
  const snapshot = JSON.parse(JSON.stringify({ version: DRAFT_VERSION, metadata: {}, blocks: moved.blocks }));
  const restored = normalizeDraft(snapshot);
  assert.equal(restored.version, DRAFT_VERSION);
  for (const path of [[0], [1], [2, 0]]) {
    assert.match(blockToLatex(blockAtPath(restored.blocks, path)), /\\item - Padre\n\\item 1\. Hijo/);
  }
  const newLatex = "\\begin{itemize}\n\\item Padre\n  \\begin{enumerate}\n  \\item Hijo\n  \\end{enumerate}\n\\end{itemize}";
  assert.equal(blockToLatex(restored.blocks[3]), newLatex);
  assert.equal(blockToLatex(raw), newLatex, "un estado directo usa la sintaxis anidada por defecto");
});

test("una sesión vacía no borra el autoguardado y el bloque en curso cuenta como trabajo", async () => {
 const {sessionHasContent}=await loadTexNotes();
 for(const session of [null,{}, {metadata:{title:'',course:'Cálculo III'},blocks:[],editor:{type:'text',title:'',content:''}}, {editor:{content:23,title:{}}}]) assert.equal(sessionHasContent(session),false);
 for(const session of [{blocks:[{content:'x'}]},{metadata:{title:'Notas de clase'}},{editor:{title:'En curso'}},{editor:{content:'$x'}},{editor:{image:{content:'grafica.png'}}}]) assert.equal(sessionHasContent(session),true);
});
test("la fecha inicial es la local del día, con ceros, no la UTC", async () => {
 const {localDateValue}=await loadTexNotes();
 assert.equal(localDateValue(new Date(2026, 0, 5, 23, 59)),'2026-01-05');
 assert.equal(localDateValue(new Date(2026, 10, 23, 0, 0)),'2026-11-23');
 assert.match(localDateValue(),/^\d{4}-\d{2}-\d{2}$/);
});
