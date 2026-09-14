/**
 * Árbol de bloques: rutas estables y operaciones puras.
 *
 * Un bloque es { type, title, content, children }. Una ruta es un array de
 * índices ("2.0" = tercer bloque de la raíz, primer hijo). Ningún nodo se
 * identifica por su texto ni por un índice de primer nivel, de modo que mover
 * o eliminar un hermano no invalida la identidad del resto.
 *
 * Todas las operaciones devuelven un árbol nuevo y nunca modifican el que
 * reciben. Una ruta inválida devuelve null: la persona que llama conserva el
 * estado anterior y lo comunica, en lugar de trabajar sobre un árbol corrupto.
 */
(function (global) {
  "use strict";
  const TexNotes = global.TexNotes || (global.TexNotes = {});

  /** Versión del borrador persistido. La 1 era una lista plana sin children. */
  const DRAFT_VERSION = 2;

  function isPath(path) {
    return Array.isArray(path) && path.every((index) => Number.isInteger(index) && index >= 0);
  }

  function cloneBlocks(list) {
    return (Array.isArray(list) ? list : []).map((block) => ({ ...block, children: cloneBlocks(block.children) }));
  }

  /**
   * Sanea una lista de bloques a cualquier profundidad. Descarta lo que no es
   * un bloque utilizable y, cuando un tipo no admite hijos, los conserva como
   * hermanos posteriores en vez de perderlos. Así el resto de la aplicación
   * puede dar por cierto que solo un tipo con `container` tiene descendencia.
   */
  function normalizeBlocks(list) {
    if (!Array.isArray(list)) return [];
    const blocks = [];
    for (const raw of list) {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      const children = normalizeBlocks(raw.children);
      const hasContent = typeof raw.content === "string";
      if (!hasContent && !children.length) continue;
      const type = typeof raw.type === "string" ? raw.type : "text";
      const block = { type, title: typeof raw.title === "string" ? raw.title : "", content: hasContent ? raw.content : "", children: [] };
      blocks.push(block);
      if (TexNotes.acceptsChildren(type)) block.children = children;
      else blocks.push(...children);
    }
    return blocks;
  }

  function normalizeBlock(raw) {
    return normalizeBlocks([raw])[0] || null;
  }

  /** Devuelve el bloque de `path`, o null si la ruta no existe. */
  function blockAtPath(blocks, path) {
    if (!Array.isArray(blocks) || !isPath(path) || !path.length) return null;
    let list = blocks;
    let block = null;
    for (const index of path) {
      if (!Array.isArray(list) || index >= list.length) return null;
      block = list[index];
      list = block.children;
    }
    return block;
  }

  /** Lista de hermanos que contiene a `path` dentro de `blocks`; [] es la raíz. */
  function siblingsAtPath(blocks, path) {
    if (!isPath(path)) return null;
    if (path.length <= 1) return blocks;
    const parent = blockAtPath(blocks, path.slice(0, -1));
    return parent ? parent.children : null;
  }

  /**
   * Inserta `block` dentro de `parentPath` ([] = raíz). `index` por debajo de
   * cero añade al final. Devuelve { blocks, path } o null.
   */
  function insertBlock(blocks, parentPath, block, index = -1) {
    if (!isPath(parentPath)) return null;
    const normalized = normalizeBlock(block);
    if (!normalized) return null;
    const next = cloneBlocks(blocks);
    let list = next;
    if (parentPath.length) {
      const parent = blockAtPath(next, parentPath);
      if (!parent || !TexNotes.acceptsChildren(parent.type)) return null;
      list = parent.children;
    }
    const position = Number.isInteger(index) && index >= 0 && index <= list.length ? index : list.length;
    list.splice(position, 0, normalized);
    return { blocks: next, path: [...parentPath, position] };
  }

  /**
   * Reemplaza type, title y content de `path` conservando su descendencia.
   * Rechaza el cambio si el tipo nuevo no admite los hijos que ya tiene: el
   * árbol se queda como estaba y la interfaz explica por qué.
   */
  function updateBlock(blocks, path, patch = {}) {
    if (!isPath(path) || !path.length) return null;
    const next = cloneBlocks(blocks);
    const target = blockAtPath(next, path);
    if (!target) return null;
    const type = typeof patch.type === "string" ? patch.type : target.type;
    if (target.children.length && !TexNotes.acceptsChildren(type)) return null;
    target.type = type;
    if (typeof patch.title === "string") target.title = patch.title;
    if (typeof patch.content === "string") target.content = patch.content;
    return next;
  }

  /** Elimina el bloque de `path` con toda su descendencia. */
  function removeBlock(blocks, path) {
    if (!isPath(path) || !path.length) return null;
    const next = cloneBlocks(blocks);
    const siblings = siblingsAtPath(next, path);
    const position = path[path.length - 1];
    if (!siblings || position >= siblings.length) return null;
    siblings.splice(position, 1);
    return next;
  }

  /**
   * Mueve el bloque `offset` posiciones entre sus hermanos. Nunca cambia de
   * nivel ni de padre: fuera del rango de hermanos la operación no se aplica.
   */
  function moveBlock(blocks, path, offset) {
    if (!isPath(path) || !path.length || !Number.isInteger(offset)) return null;
    const next = cloneBlocks(blocks);
    const siblings = siblingsAtPath(next, path);
    const position = path[path.length - 1];
    if (!siblings || position >= siblings.length) return null;
    const target = position + offset;
    if (target < 0 || target >= siblings.length) return null;
    const [block] = siblings.splice(position, 1);
    siblings.splice(target, 0, block);
    return { blocks: next, path: [...path.slice(0, -1), target] };
  }

  /** Cuenta el bloque y toda su descendencia. */
  function countBlocks(list) {
    return (Array.isArray(list) ? list : []).reduce((total, block) => total + 1 + countBlocks(block.children), 0);
  }

  /**
   * Recorre el árbol en el orden en que se lee, aportando a cada nodo su ruta,
   * su nivel (1 en la raíz), su padre y cuántos hermanos tiene. Es lo que la
   * interfaz necesita para nombrar cada botón sin recalcular el contexto.
   */
  function flattenBlocks(blocks, parent = null, parentPath = []) {
    const entries = [];
    (Array.isArray(blocks) ? blocks : []).forEach((block, index) => {
      const path = [...parentPath, index];
      entries.push({ block, path, parent, parentPath, depth: path.length, position: index, siblings: blocks.length });
      entries.push(...flattenBlocks(block.children, block, path));
    });
    return entries;
  }

  /** Clave para un atributo data-*, y su inversa. */
  const pathToKey = (path) => (isPath(path) ? path.join(".") : "");
  function keyToPath(key) {
    if (typeof key !== "string" || !key.trim()) return [];
    const path = key.split(".").map((part) => Number(part));
    return isPath(path) ? path : [];
  }

  /** Numeración visible: [1, 0] -> "2.1". */
  const pathLabel = (path) => (isPath(path) ? path.map((index) => index + 1).join(".") : "");

  /**
   * Acepta un borrador plano de la versión 1 y el árbol de la versión 2, y
   * devuelve siempre { version, metadata, blocks } o null. No lanza: un valor
   * mal formado a cualquier profundidad se descarta al normalizar.
   */
  function normalizeDraft(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const version = Number(raw.version);
    if (!Number.isInteger(version) || version < 1 || version > DRAFT_VERSION) return null;
    if (!raw.metadata || typeof raw.metadata !== "object" || Array.isArray(raw.metadata)) return null;
    const metadata = Object.fromEntries(Object.entries(raw.metadata).filter(([, value]) => typeof value === "string"));
    return { version, metadata, blocks: normalizeBlocks(raw.blocks) };
  }

  Object.assign(TexNotes, {
    DRAFT_VERSION, cloneBlocks, normalizeBlock, normalizeBlocks, blockAtPath, siblingsAtPath,
    insertBlock, updateBlock, removeBlock, moveBlock, countBlocks, flattenBlocks,
    pathToKey, keyToPath, pathLabel, normalizeDraft,
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
