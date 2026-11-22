/**
 * Árbol de bloques: identificadores estables, rutas de posición y operaciones puras.
 *
 * Un bloque es { type, title, content, children }, con options en imágenes
 * y listFormat en listas.
 * Una ruta es un array de índices ("2.0" = tercer bloque de la raíz, primer
 * hijo). Ningún nodo se identifica por su texto ni por un índice de primer
 * nivel, de modo que mover o eliminar un hermano no invalida la identidad del
 * resto.
 *
 * Todas las operaciones devuelven un árbol nuevo y nunca modifican el que
 * reciben. Una ruta inválida devuelve null: la persona que llama conserva el
 * estado anterior y lo comunica, en lugar de trabajar sobre un árbol corrupto.
 */
(function (global) {
  "use strict";
  const TexNotes = global.TexNotes || (global.TexNotes = {});

  /** Versión del borrador persistido. La 1 era una lista plana sin children. */
  const DRAFT_VERSION = 4;
  const blockIdPattern = /^b[0-9a-z]{8}$/;
  function newId(prefix = "b") {
    const digits = new Uint8Array(8);
    if (global.crypto?.getRandomValues) global.crypto.getRandomValues(digits);
    else for (let i = 0; i < digits.length; i++) digits[i] = Math.floor(Math.random() * 256);
    return prefix + Array.from(digits, byte => (byte % 36).toString(36)).join("");
  }
  function pathOfId(blocks, id) {
    if (!id) return null;
    return flattenBlocks(blocks).find(entry => entry.block.id === id)?.path ?? null;
  }

  function isPath(path) {
    return Array.isArray(path) && path.every((index) => Number.isInteger(index) && index >= 0);
  }

  function applyBlockOptions(block, options) {
    if (options !== undefined && TexNotes.blockType(block.type)?.kind === "image") {
      block.options = TexNotes.normalizeImageOptions(options);
    } else {
      delete block.options;
    }
    return block;
  }

  function applyListFormat(block, format, fallback) {
    const known = format === "flat" || format === "outline" ? format : fallback;
    if ((known === "flat" || known === "outline") && TexNotes.blockType(block.type)?.kind === "list") block.listFormat = known;
    else delete block.listFormat;
    return block;
  }

  function listFormatAfterEdit(block, content) {
    if (block?.listFormat !== "flat") return "outline";
    if (typeof content !== "string") return "flat";
    return TexNotes.normalizeLineBreaks(content) === TexNotes.normalizeLineBreaks(block.content) ? "flat" : "outline";
  }

  function cloneBlocks(list) {
    return (Array.isArray(list) ? list : []).map((block) => {
      const copy = { ...block, children: cloneBlocks(block.children) };
      applyBlockOptions(copy, block.options);
      return applyListFormat(copy, block.listFormat);
    });
  }

  /**
   * Sanea una lista de bloques a cualquier profundidad. Descarta lo que no es
   * un bloque utilizable y, cuando un tipo no admite hijos, los conserva como
   * hermanos posteriores en vez de perderlos. Así el resto de la aplicación
   * puede dar por cierto que solo un tipo con `container` tiene descendencia.
   */
  function cleanBlocks(list, defaultListFormat) {
    if (!Array.isArray(list)) return [];
    const blocks = [];
    for (const raw of list) {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      const children = cleanBlocks(raw.children, defaultListFormat);
      const hasContent = typeof raw.content === "string";
      if (!hasContent && !children.length) continue;
      const type = typeof raw.type === "string" ? raw.type : "text";
      const block = { type, title: typeof raw.title === "string" ? raw.title : "", content: hasContent ? raw.content : "", children: [] };
      if (typeof raw.id === "string" && blockIdPattern.test(raw.id)) block.id = raw.id;
      applyBlockOptions(block, raw.options);
      blocks.push(applyListFormat(block, raw.listFormat, defaultListFormat));
      if (TexNotes.acceptsChildren(type)) block.children = children;
      else blocks.push(...children);
    }
    return blocks;
  }

  function normalizeBlocks(list, defaultListFormat = "outline", generate = newId, existing = new Set(), fresh = false) {
    const blocks = cleanBlocks(list, defaultListFormat);
    const entries = flattenBlocks(blocks), used = new Set(existing), reserved = new Set(existing);
    for (const { block } of entries) if (block.id) reserved.add(block.id);
    let fallback = 0;
    for (const { block } of entries) {
      if (fresh || !block.id || used.has(block.id)) {
        let id = generate("b");
        if (typeof id !== "string" || !blockIdPattern.test(id) || reserved.has(id)) {
          do { id = "b" + (fallback++).toString(36).padStart(8, "0"); } while (reserved.has(id));
        }
        block.id = id; reserved.add(id);
      }
      used.add(block.id);
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
  function insertBlock(blocks, parentPath, block, index = -1, generate = newId) {
    if (!isPath(parentPath)) return null;
    const used = new Set(flattenBlocks(blocks).map(entry => entry.block.id));
    const [normalized] = normalizeBlocks([block], "outline", generate, used, true);
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
    return { blocks: next, path: [...parentPath, position], id: normalized.id };
  }

  /**
   * Copia profunda de un bloque suelto, saneada como cualquier otro bloque que
   * entra al árbol. Es lo que toma «Copiar» y lo que entrega «Pegar»: cada
   * pegado produce objetos nuevos, de modo que dos pegados del mismo bloque no
   * comparten estado y editar uno no toca al otro.
   */
  function cloneBlock(block) {
    return normalizeBlock(block ? cloneBlocks([block])[0] : null);
  }

  /**
   * Duplica el bloque de `path` con toda su descendencia e inserta la copia
   * inmediatamente después del original, entre sus mismos hermanos: conserva
   * padre y nivel. Devuelve { blocks, path } con la ruta de la copia, o null si
   * la ruta no existe.
   *
   * No comparte objetos con el original: es una copia profunda, no una
   * referencia. Editar o eliminar cualquiera de los dos deja intacto al otro.
   */
  function duplicateBlock(blocks, path, generate = newId) {
    const source = blockAtPath(blocks, path);
    if (!source) return null;
    return insertBlock(blocks, path.slice(0, -1), source, path.at(-1) + 1, generate);
  }

  /**
   * Reemplaza type, title, content y options de `path` conservando su descendencia.
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
    const listFormat = listFormatAfterEdit(target, patch.content);
    target.type = type;
    if (typeof patch.title === "string") target.title = patch.title;
    if (typeof patch.content === "string") target.content = patch.content;
    applyBlockOptions(target, Object.hasOwn(patch, "options") ? patch.options : target.options);
    applyListFormat(target, listFormat);
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

  /**
   * Mueve una rama a otro padre ([] = raíz). Como en insertBlock, si no se
   * indica una posición válida, se añade al final. La posición se cuenta
   * entre los hermanos que quedan después de retirar la rama.
   */
  function moveBlockTo(blocks, fromPath, toParentPath, index = -1) {
    if (!Array.isArray(fromPath) || !Array.isArray(toParentPath)) return null;
    const sourcePath = [...fromPath];
    const destinationPath = [...toParentPath];
    if (!blockAtPath(blocks, sourcePath) || !isPath(destinationPath)) return null;
    if (sourcePath.every((part, depth) => part === destinationPath[depth])) return null;
    if (destinationPath.length) {
      const parent = blockAtPath(blocks, destinationPath);
      if (!parent || !TexNotes.acceptsChildren(parent.type)) return null;
    }

    const next = cloneBlocks(blocks);
    const sourceParent = sourcePath.slice(0, -1);
    const depth = sourceParent.length;
    const sourceIndex = sourcePath[depth];
    const [block] = siblingsAtPath(next, sourcePath).splice(sourceIndex, 1);

    // Solo cambia la ruta si el destino parte de un hermano posterior.
    if (sourceParent.every((part, level) => part === destinationPath[level]) && destinationPath[depth] > sourceIndex) {
      destinationPath[depth] -= 1;
    }
    const destination = destinationPath.length ? blockAtPath(next, destinationPath).children : next;
    const position = Number.isInteger(index) && index >= 0 && index <= destination.length ? index : destination.length;
    destination.splice(position, 0, block);
    return { blocks: next, path: [...destinationPath, position] };
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
   * Acepta un borrador plano de la versión 1 y los árboles de las versiones 2 y 3, y
   * devuelve siempre { version, metadata, blocks, macros } o null. No lanza: un valor
   * mal formado a cualquier profundidad se descarta al normalizar.
   */
  function normalizeDraft(raw, generate = newId) {
    try {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
      const source = Number(raw.version);
      if (!Number.isInteger(source) || source < 1 || source > DRAFT_VERSION) return null;
      if (!raw.metadata || typeof raw.metadata !== "object" || Array.isArray(raw.metadata)) return null;
      const metadata = Object.fromEntries(Object.entries(raw.metadata).filter(([, value]) => typeof value === "string"));
      const documentId = typeof raw.documentId === "string" && /^d[a-z0-9]{8}$/.test(raw.documentId) ? raw.documentId : generate("d");
      return { version: DRAFT_VERSION, ...(source < DRAFT_VERSION ? { migratedFrom: source } : {}), documentId, metadata,
        blocks: normalizeBlocks(raw.blocks, "flat", generate), macros: source >= 3 ? normalizeMacros(raw.macros) : [] };
    } catch { return null; }
  }

  function normalizeMacros(raw) {
    return (Array.isArray(raw) ? raw : []).filter(m => m && typeof m.name === "string" && /^[A-Za-z]+$/.test(m.name)
      && Number.isInteger(m.params) && m.params >= 0 && m.params <= 9 && typeof m.body === "string")
      .map(({ name, params, body }) => ({ name, params, body }));
  }

  function sessionHasContent(session) {
    const nonempty = (value) => typeof value === "string" && Boolean(value.trim());
    return Boolean(session && ((Array.isArray(session.blocks) && session.blocks.some((block) => block && typeof block === "object"))
      || nonempty(session.metadata?.title) || nonempty(session.editor?.content) || nonempty(session.editor?.title) || nonempty(session.editor?.image?.content)));
  }

  Object.assign(TexNotes, {
    DRAFT_VERSION, newId, pathOfId, normalizeMacros, sessionHasContent, cloneBlocks, cloneBlock, normalizeBlock, normalizeBlocks, blockAtPath, siblingsAtPath,
    insertBlock, duplicateBlock, updateBlock, removeBlock, moveBlock, moveBlockTo, countBlocks, flattenBlocks,
    pathToKey, keyToPath, pathLabel, normalizeDraft, listFormatAfterEdit,
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
