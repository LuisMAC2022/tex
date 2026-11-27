(function (T) {
  "use strict";
  T.createAliasEditor = function (document, { readWritingStorage, writeWritingStorage, announce }) {
    const $ = selector => document.querySelector(selector);
    const events = new AbortController(), options = { signal: events.signal };
    let aliases = readWritingStorage("tex-notes:aliases:v1", T.DEFAULT_ALIASES);
    if (!Array.isArray(aliases) || aliases.some((a, i) => T.validateAlias(a, aliases.slice(0, i)).length)) aliases = T.DEFAULT_ALIASES.map(a => ({ ...a }));
    aliases = aliases.map(a => ({ ...a }));
    let editingAlias = -1;
    function renderAliases() {
      $("#alias-list").replaceChildren(...aliases.map((alias, index) => {
        const row = document.createElement("tr");
        for (const value of [alias.trigger, alias.expansion, alias.mode === "math" ? "Matemáticas" : alias.mode === "text" ? "Texto" : "Cualquier contexto"]) {
          const cell = document.createElement("td"); cell.textContent = value; row.append(cell);
        }
        const cell = document.createElement("td"), edit = document.createElement("button"), remove = document.createElement("button");
        edit.type = remove.type = "button"; edit.textContent = "Editar alias"; remove.textContent = "Borrar alias";
        edit.setAttribute("aria-label", `Editar alias ${alias.trigger}`); remove.setAttribute("aria-label", `Borrar alias ${alias.trigger}`);
        edit.addEventListener("click", () => { editingAlias = index; $("#alias-trigger").value = alias.trigger; $("#alias-expansion").value = alias.expansion; $("#alias-mode").value = alias.mode; $("#alias-trigger").focus(); });
        remove.addEventListener("click", () => { aliases.splice(index, 1); editingAlias = -1; persistAliases(); $("#alias-trigger").focus(); announce("Alias borrado."); });
        cell.append(edit, remove); row.append(cell); return row;
      }));
    }
    function persistAliases() { writeWritingStorage("tex-notes:aliases:v1", aliases); renderAliases(); }
    function saveAlias() {
      const alias = { trigger: $("#alias-trigger").value.trim(), expansion: $("#alias-expansion").value, mode: $("#alias-mode").value };
      const errors = T.validateAlias(alias, aliases.filter((a, i) => i !== editingAlias));
      $("#alias-error").textContent = errors.join(" ");
      if (errors.length) { announce(errors[0]); return; }
      if (editingAlias >= 0) aliases[editingAlias] = alias; else aliases.push(alias);
      editingAlias = -1; persistAliases(); $("#alias-trigger").value = ""; $("#alias-expansion").value = ""; $("#alias-trigger").focus(); announce("Alias guardado.");
    }
    $("#save-alias").addEventListener("click", saveAlias, options);
    $("#alias-fields").addEventListener("keydown", (event) => { if (event.key === "Enter" && event.target.tagName !== "TEXTAREA" && !event.isComposing) { event.preventDefault(); saveAlias(); } }, options);
    $("#cancel-alias").addEventListener("click", () => { editingAlias = -1; $("#alias-trigger").value = ""; $("#alias-expansion").value = ""; $("#alias-error").textContent = ""; }, options);
    $("#reset-aliases").addEventListener("click", () => { aliases = T.DEFAULT_ALIASES.map(a => ({ ...a })); editingAlias = -1; persistAliases(); announce("Alias predeterminados restaurados."); }, options);
    renderAliases();
    return { read: () => aliases, apply(value) { aliases = value; editingAlias = -1; persistAliases(); },
      dispose() { events.abort(); $("#alias-list").replaceChildren(); } };
  };
})(globalThis.TexNotes);
