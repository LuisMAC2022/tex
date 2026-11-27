import test from "node:test";
import assert from "node:assert/strict";
import { loadTexNotes } from "./load-app.mjs";

const { thumbMode, scrubSteps } = await loadTexNotes(["shortcuts.js", "thumb-bar.js"]);
test("la lista abierta tiene prioridad sobre el alcance y el cursor", () => {
  assert.equal(thumbMode({}), "cursor");
  assert.equal(thumbMode({ scopeMode: "math" }), "selection");
  assert.equal(thumbMode({ scopeMode: "math", listOpen: true }), "suggestions");
});
test("el arrastre cuenta pasos completos con signo cada 28 píxeles", () => {
  for (const [dx, steps] of [[-58,-2],[-27,0],[0,0],[27,0],[28,1],[90,3]]) assert.equal(scrubSteps(dx, 28), steps);
});
