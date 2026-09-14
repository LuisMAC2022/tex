/** Regenera examples/calculo-3.tex desde el estado de referencia. */
import { writeFile } from "node:fs/promises";
import { loadTexNotes } from "./load-app.mjs";
import { exampleState } from "./example-state.mjs";

const { generateLatex } = await loadTexNotes();
const target = new URL("../examples/calculo-3.tex", import.meta.url);
await writeFile(target, generateLatex(exampleState), "utf8");
console.log("examples/calculo-3.tex regenerado");
