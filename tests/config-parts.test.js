import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { loadTexNotes } from "./load-app.mjs";
const T = await loadTexNotes(["block-types.js", "block-tree.js", "math-symbols.js", "math-preview.js", "editing-assist.js", "completion.js", "templates.js", "macros.js", "references.js", "config-parts.js"]);
const v1 = JSON.parse(await readFile(new URL("./fixtures/config-v1.json", import.meta.url), "utf8"));
const plain = v => JSON.parse(JSON.stringify(v));

test("el archivo v1 exportado por el navegador migra sin pérdida e intercambia cada parte", () => {
  const { kind, version, ...values } = v1;
  const migrated = T.migrateConfig(v1);
  assert.equal(migrated.version, 2);
  assert.deepEqual(plain(T.validateConfig(migrated).values), values);
  assert.deepEqual(plain(T.buildConfig(values)), plain(migrated));
});
test("una parte ausente conserva el valor local y una desconocida produce un aviso", () => {
  const file = {kind: v1.kind, version: 2, parts: { futura: { version: 1, value: [] }, prefs: {version: 1, value: {autoPair:false}} }};
  const checked = T.validateConfig(file);
  assert.deepEqual(plain(checked.errors), []);
  assert.match(checked.warnings.join(" "), /futura/);
  assert.deepEqual(Object.keys(checked.values), ["prefs"]);
});
test("los errores señalan la parte y el campo sin aplicar valores inválidos", () => {
  const result = T.validateConfig({ ...v1, prefs:{ autoPair:2, vibration:4 }, references:[{}] });
  for (const field of ["autoPair","vibration","key"]) assert.ok(result.errors.some(msg => msg.includes(field)));
  assert.ok(!Object.hasOwn(result.values, "prefs"));
});
