import test from "node:test";
import assert from "node:assert/strict";
import { loadTexNotes } from "./load-app.mjs";

const { SHORTCUTS, matchShortcut, shortcutLabel, ariaKeyshortcuts } = await loadTexNotes(["shortcuts.js"]);

test("los atajos tienen identificadores y combinaciones por ámbito únicos", () => {
  assert.equal(new Set(SHORTCUTS.map(({ id }) => id)).size, SHORTCUTS.length);
  const scoped = SHORTCUTS.map((shortcut) => `${shortcut.scope}:${ariaKeyshortcuts(shortcut)}`);
  assert.equal(new Set(scoped).size, scoped.length);
});
test("los atajos respetan AltGr, las teclas de los widgets y las combinaciones del navegador", () => {
  for (const { code, alt, shift, ctrl, meta, scope } of SHORTCUTS) {
    assert.ok(!(ctrl && alt), "Ctrl+Alt equivale a AltGr");
    if (!(alt || shift || ctrl || meta)) {
      assert.match(scope, /widget/);
      assert.match(code, /^(Escape|Arrow(Up|Down|Left|Right)|Page(Up|Down))$/);
    }
    assert.ok(!/^F(?:5|6|11|12)$/.test(code));
    if (!alt && !shift && (ctrl || meta)) assert.doesNotMatch(code, /^Key[TWNLRPSFDHJK]$/);
    if (ctrl) assert.notEqual(code, "Tab");
    if (alt && !shift && !ctrl && !meta) assert.doesNotMatch(code, /^(Key[FED]|Arrow(Left|Right))$/);
  }
});
test("los atajos usan el código físico y muestran teclas legibles y accesibles", () => {
  const event = { code: "KeyS", key: "Í", altKey: true, shiftKey: true };
  const shortcut = matchShortcut(event, "block-editor");
  assert.equal(shortcut.id, "symbols.toggle");
  assert.equal(matchShortcut(event, "list-editor"), undefined);
  assert.equal(matchShortcut({ ...event, ctrlKey: true }, "block-editor"), undefined);
  assert.equal(matchShortcut({ ...event, isComposing: true }, "block-editor"), undefined);
  assert.equal(matchShortcut({ ...event, getModifierState: (name) => name === "AltGraph" }, "block-editor"), undefined);
  assert.equal(shortcutLabel(shortcut), "Alt+Mayús+S");
  assert.equal(shortcutLabel(shortcut, true), "⌥⇧S");
  assert.equal(ariaKeyshortcuts(shortcut), "Alt+Shift+S");
});

test("los atajos internos del tablero se limitan a la búsqueda y la rejilla", () => {
  assert.equal(matchShortcut({ code: "Escape" }, "symbol-widget").id, "symbols.escape");
  assert.equal(matchShortcut({ code: "ArrowDown" }, "symbol-search-widget").id, "symbols.firstResult");
  assert.equal(matchShortcut({ code: "ArrowUp" }, "symbol-grid-widget").id, "symbols.search");
  assert.equal(matchShortcut({ code: "PageUp" }, "symbol-grid-widget").id, "symbols.previousGroup");
  assert.equal(matchShortcut({ code: "PageDown" }, "symbol-grid-widget").id, "symbols.nextGroup");
  assert.equal(matchShortcut({ code: "PageDown" }, "symbol-search-widget"), undefined);
  assert.equal(matchShortcut({ code: "Tab" }, "symbol-widget"), undefined);
});

test("Ctrl+Intro incorpora bloques y en macOS usa Meta sin confundir AltGr", () => {
 const ctrl = { code: 'Enter', ctrlKey: true };
 const meta = { code: 'Enter', metaKey: true };
 assert.equal(matchShortcut(ctrl, 'block-editor').id, 'block.commit');
 assert.equal(matchShortcut(meta, 'block-editor', true).id, 'block.commit');
 assert.equal(matchShortcut(ctrl, 'block-editor', true), undefined);
 assert.equal(matchShortcut(meta, 'block-editor'), undefined);
 assert.equal(matchShortcut({...ctrl,altKey:true},'block-editor'),undefined);
 assert.equal(matchShortcut({...ctrl,getModifierState:n=>n==='AltGraph'},'block-editor'),undefined);
 const s=SHORTCUTS.find(s=>s.id==='block.commit');
 assert.equal(shortcutLabel(s),'Ctrl+Intro'); assert.equal(shortcutLabel(s,true),'⌘Intro');
 assert.equal(ariaKeyshortcuts(s),'Control+Enter'); assert.equal(ariaKeyshortcuts(s,true),'Meta+Enter');
});
