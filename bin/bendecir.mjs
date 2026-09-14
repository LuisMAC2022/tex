#!/usr/bin/env node
/**
 * Recalcula las anclas de los bloques @decision.
 *
 * Se ejecuta DESPUÉS de haber leído la justificación y confirmado que sigue
 * vigente, nunca antes. Bendecir sin leer convierte el mecanismo en un trámite
 * y devuelve el repositorio al problema que resuelve.
 *
 * El cambio queda como una línea de diff por bloque, así que una bendición
 * masiva se ve en la revisión: varias anclas tocadas en un mismo commit son la
 * señal de que alguien pasó por encima sin leer.
 *
 *   node bin/bendecir.mjs            reescribe las anclas que derivaron
 *   node bin/bendecir.mjs --listar   solo informa, no escribe
 */
import { readFileSync, writeFileSync } from "node:fs";
import { relative } from "node:path";
import { MARCA, RAIZ, analizar, fuentes } from "./anclas-lib.mjs";

const soloListar = process.argv.includes("--listar");
let tocados = 0;

for (const ruta of fuentes()) {
  const original = readFileSync(ruta, "utf8");
  const hallazgos = analizar(original);
  if (!hallazgos.length) continue;

  const lineas = original.split(/\r?\n/);
  let cambiado = false;

  for (const hallazgo of hallazgos) {
    if (hallazgo.problema) {
      console.error(`✗ ${relative(RAIZ, ruta)}:${hallazgo.linea} ${hallazgo.id} — ${hallazgo.problema}`);
      continue;
    }
    if (hallazgo.incompleto) {
      console.error(
        `✗ ${relative(RAIZ, ruta)}:${hallazgo.linea} ${hallazgo.id} — ` +
          `tramo:${hallazgo.tramo} excede el final del archivo`,
      );
      continue;
    }
    if (hallazgo.declarada === hallazgo.real) continue;

    const indice = hallazgo.linea - 1;
    lineas[indice] = lineas[indice].replace(
      MARCA,
      (texto) => texto.replace(`ancla:${hallazgo.declarada}`, `ancla:${hallazgo.real}`),
    );
    cambiado = true;
    tocados += 1;
    console.log(
      `${soloListar ? "·" : "✓"} ${relative(RAIZ, ruta)}:${hallazgo.linea} ${hallazgo.id} ` +
        `${hallazgo.declarada} → ${hallazgo.real}`,
    );
  }

  if (cambiado && !soloListar) writeFileSync(ruta, lineas.join("\n"), "utf8");
}

if (!tocados) console.log("Todas las anclas coinciden con su código.");
else if (soloListar) console.log(`\n${tocados} ancla(s) derivada(s). Sin escribir (--listar).`);
else console.log(`\n${tocados} ancla(s) reescrita(s).`);
