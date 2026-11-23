/** Destinos, contadores y comandos que se emiten desde el árbol. */
(function (T) {
  "use strict";
  const numberedMath = new Set(["equation", "align", "gather", "multline", "flalign", "alignat"]);

  function emittedBlocks(state) {
    const entries = [];
    function visit(blocks, path, context) {
      (blocks || []).forEach((block, index) => {
        if (!T.blockIsEmitted(block)) return;
        const position = [...path, index];
        const { childContext, type } = T.emissionContext(block, context);
        entries.push({ block, type, path: position, context });
        visit(block.children, position, childContext);
      });
    }
    visit(state.blocks, [], {});
    return entries;
  }

  // Se conservan los índices de origen incluso al ignorar comentarios entre
  // un comando y su argumento. Una barra escapada no inicia otro comando.
  function documentCommands(block) {
    if (block.type === "image") return [];
    const content = T.normalizeLineBreaks(block.content);
    const visible = content.replace(/\\[^\n]|%[^\n]*/g, token => token[0] === "%" ? " ".repeat(token.length) : token);
    const argument = /\s*(?:\[(?:[^\]\\]|\\.)*\]\s*){0,2}\{([^{}]*)\}/y;
    const commands = [];
    for (const match of visible.matchAll(/\\([A-Za-z]+)\*?|\\[\s\S]/g)) {
      if (!match[1]) continue;
      argument.lastIndex = match.index + match[0].length;
      const arg = argument.exec(visible);
      commands.push({ name: match[1], index: match.index, arg: arg?.[1]?.trim(),
        argStart: arg ? argument.lastIndex - arg[1].length - 1 : null });
    }
    return commands;
  }

  function counterForEnvironment(name) {
    if (numberedMath.has(name)) return "equation";
    return T.BLOCK_TYPES.find(type => type.labelPrefix && type.environment === name)?.id;
  }

  function referenceTargets(state) {
    const counters = new Map(), uncertain = new Set(), targets = [];
    for (const { block, type, path, context } of emittedBlocks(state)) {
      for (const { name, arg } of documentCommands(block)) {
        if (name === "begin") uncertain.add(counterForEnvironment(arg));
        if (name === "caption") uncertain.add("image");
      }
      if (!type.labelPrefix) continue;
      const label = T.labelOf(block);
      if (type.kind === "equation" && (!label || !block.content?.trim())) continue;
      if (type.kind === "image" && (!block.content?.trim() || !(label || (T.floatingImage(context) && block.title?.trim())))) continue;
      const number = (counters.get(type.id) || 0) + 1;
      counters.set(type.id, number);
      if (label) targets.push({ label, typeId: type.id, word: type.heading, number, path, title: block.title || "" });
    }
    for (const target of targets) if (uncertain.has(target.typeId)) target.number = null;
    return targets;
  }

  function crossReferenceIssues(state) {
    const labels = new Map(), uses = [], issues = [];
    const add = (block, path, index, code, severity, message) => {
      const lines = T.normalizeLineBreaks(block.content).slice(0, index).split("\n");
      issues.push({ path, issue: { code, severity, line: lines.length, column: Array.from(lines.at(-1)).length + 1,
        message, guide: "docs/guia-de-uso.md#etiquetas-y-referencias-cruzadas" } });
    };
    function define(label, type, block, path, index) {
      if (labels.has(label)) add(block, path, index, "duplicate-label", "error", `La etiqueta ${label} está repetida.`);
      else labels.set(label, type);
    }
    for (const { block, path, type } of emittedBlocks(state)) {
      const label = T.labelOf(block);
      if (label && (type.kind === "theorem" || block.content?.trim())) define(label, type.id, block, path, 0);
      const environments = [];
      for (const { name, arg, index } of documentCommands(block)) {
        if (name === "begin" && arg) environments.push(arg);
        if (name === "end") environments.pop();
        if (arg === undefined) continue;
        if (name === "label") {
          const manualType = environments.map(counterForEnvironment).filter(Boolean).at(-1);
          define(arg, manualType || type.id, block, path, index);
          if ((type.kind === "text" || type.kind === "list") && !manualType &&
              T.mathContextAt(block.content, index, type.id) === "text") {
            add(block, path, index, "section-label", "aviso", `La etiqueta ${arg} remitiría a la sección.`);
          }
        } else if (name === "ref" || name === "eqref") uses.push({ name, arg, block, path, index });
      }
    }
    for (const { name, arg, block, path, index } of uses) {
      if (!labels.has(arg)) add(block, path, index, "missing-label", "error", `La referencia ${arg} no tiene destino.`);
      else if (name === "eqref" && labels.get(arg) !== "equation")
        add(block, path, index, "eqref-type", "aviso", `La etiqueta ${arg} apunta a un bloque distinto de una ecuación.`);
    }
    return issues;
  }

  Object.assign(T, { emittedBlocks, documentCommands, referenceTargets, crossReferenceIssues });
})(globalThis.TexNotes);
