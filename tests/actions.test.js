import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { T } from "./radial-fixtures.mjs";

test("los identificadores de acciones son únicos y todo control remite a un contexto conocido", async () => {
  const ids = T.ACTIONS.map(a => a.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const c of T.ACTIONS) {
    assert.ok(c.label && c.icon && c.contexts.length, c.id);
    for (const context of c.contexts) assert.ok(["card", "global", "formula", "text", "image"].includes(context));
  }
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  for (const [, id] of html.matchAll(/data-action-id="([^"]+)"/g)) assert.ok(T.actionById(id), id);
  for (const shortcut of T.SHORTCUTS) assert.ok(T.actionById(shortcut.id), shortcut.id);
  assert.equal(T.actionById("block.up").enabled({ position: 0 }), false);
  assert.ok(T.actionById("block.down").enabled({ position: 0, siblings: 2 }));
});

test("el contexto de acción distingue tarjeta, documento, imagen, texto y matemáticas", () => {
  for (const [state, expected] of [
    [{ source: "global", blockKind: "image" }, "global"],
    [{ source: "card", blockKind: "equation" }, "card"],
    [{ source: "editor", blockKind: "image", scopeMode: "math" }, "image"],
    [{ source: "editor", blockKind: "equation" }, "formula"],
    [{ source: "editor", blockKind: "text", mathMode: "math" }, "formula"],
    [{ source: "editor", blockKind: "text", scopeMode: "math" }, "formula"],
    [{ source: "editor", blockKind: "theorem" }, "text"],
  ]) assert.equal(T.actionContext(state), expected);
});
