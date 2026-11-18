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
  assert.equal(shortcutLabel(shortcut), "Alt+Mayús+S");
  assert.equal(shortcutLabel(shortcut, true), "⌥⇧S");
  assert.equal(ariaKeyshortcuts(shortcut), "Alt+Shift+S");
});
