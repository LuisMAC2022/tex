import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
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
