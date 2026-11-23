import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { T, fragmentBlocks } from "./radial-fixtures.mjs";

const available = spawnSync("pdflatex", ["--version"], { encoding: "utf8" });
test("pdflatex compila los fragmentos radiales y el enlace en un documento", { skip: available.error?.code === "ENOENT" && "pdflatex no está instalado" }, async () => {
  const dir = await mkdtemp(join(tmpdir(), "notas-latex-"));
  try {
    const tex = T.generateLatex({metadata:{title:"Prueba de los menús"}, blocks:fragmentBlocks});
    await writeFile(join(dir,"fragmentos.tex"), tex);
    const result = spawnSync("pdflatex", ["-interaction=nonstopmode","-halt-on-error","-no-shell-escape","fragmentos.tex"],
      {cwd:dir, encoding:"utf8", timeout:45000});
    assert.ifError(result.error);
    assert.equal(result.status,0,(result.stdout + result.stderr).slice(-3500));
  } finally { await rm(dir,{recursive:true,force:true}); }
});

const optional = { skip: available.error?.code === "ENOENT" && "pdflatex no está instalado" };
async function compileTwice(state, files = {}) {
  const dir = await mkdtemp(join(tmpdir(), "notas-referencias-"));
  try {
    for (const [name, bytes] of Object.entries(files)) await writeFile(join(dir, name), bytes);
    await writeFile(join(dir, "nota.tex"), T.generateLatex(state));
    for (let pass = 0; pass < 2; pass++) {
      const run = spawnSync("pdflatex", ["-interaction=nonstopmode", "-halt-on-error", "-no-shell-escape", "nota.tex"],
        { cwd: dir, encoding: "utf8", timeout: 45000 });
      assert.ifError(run.error);
      assert.equal(run.status, 0, (run.stdout + run.stderr).slice(-3500));
    }
    const log = await readFile(join(dir, "nota.log"), "utf8");
    assert.doesNotMatch(log, /(?:Reference|Citation) .+ undefined|undefined (?:references|citations)/i);
    return await readFile(join(dir, "nota.aux"), "utf8");
  } finally { await rm(dir, {recursive: true, force: true}); }
}

test("pdflatex confirma los números de cada destino tras dos compilaciones", optional, async () => {
  const blocks = T.BLOCK_TYPES.filter(type => type.labelPrefix).map(type => ({
    type: type.id, label: type.labelPrefix + ":prueba", title: "Título",
    content: type.id === "image" ? "imagen.png" : "x",
  }));
  blocks.unshift({type:"theorem", content:"Previo"}, {type:"equation", content:"a=b"});
  blocks.push({type:"theorem", content:"Con figura", children:[{type:"image", content:"imagen.png", label:"fig:interna"}]});
  const state = {metadata:{title:"Destinos"}, blocks};
  const targets = T.referenceTargets(state);
  blocks.push({type:"text", content:targets.map(t => (t.typeId === "equation" ? "\\eqref" : "\\ref") + "{" + t.label + "}").join(", ")});
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNgYGAAAAAEAAH2FzhVAAAAAElFTkSuQmCC", "base64");
  const aux = await compileTwice(state, {"imagen.png": png});
  for (const t of targets) assert.ok(aux.includes(`\\newlabel{${t.label}}{{${t.number}}`), aux);
});
