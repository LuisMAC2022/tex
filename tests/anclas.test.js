/**
 * Las decisiones escritas junto al código siguen describiendo ese código.
 *
 * Esta prueba no juzga el contenido de una justificación: comprueba que el
 * tramo que gobierna no ha cambiado a sus espaldas, que la decisión citada
 * existe en decisiones/ y que no queda código apoyado en una decisión ya
 * reemplazada.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { RAIZ, revisar } from "../bin/anclas-lib.mjs";

const DIRECTORIO = join(RAIZ, "decisiones");

/** { "DEC-003": { archivo, estado, reemplazadaPor } } */
function catalogo() {
  const entradas = {};
  for (const nombre of readdirSync(DIRECTORIO)) {
    const id = /^(DEC-\d{3})-/.exec(nombre)?.[1];
    if (!id) continue;
    assert.equal(entradas[id], undefined, `dos archivos comparten ${id} en decisiones/`);
    const texto = readFileSync(join(DIRECTORIO, nombre), "utf8");
    entradas[id] = {
      archivo: nombre,
      estado: /^status:\s*(\S+)/m.exec(texto)?.[1] ?? "",
      reemplazadaPor: /^superseded-by:\s*(DEC-\d{3})/m.exec(texto)?.[1] ?? "",
    };
  }
  return entradas;
}

const anclados = revisar();
const decisiones = catalogo();

test("decisiones/ declara un status válido en cada entrada", () => {
  const validos = new Set(["accepted", "superseded"]);
  for (const [id, entrada] of Object.entries(decisiones)) {
    assert.ok(
      validos.has(entrada.estado),
      `${entrada.archivo}: status «${entrada.estado}» no es accepted ni superseded`,
    );
    if (entrada.estado === "superseded") {
      assert.match(
        entrada.reemplazadaPor,
        /^DEC-\d{3}$/,
        `${entrada.archivo}: una decisión superseded debe declarar superseded-by`,
      );
    }
  }
});

test("ningún bloque @decision quedó sin bendecir", () => {
  const pendientes = [];
  for (const { ruta, hallazgos } of anclados) {
    for (const hallazgo of hallazgos) {
      if (hallazgo.declarada === "nueva") {
        pendientes.push(`${relative(RAIZ, ruta)}:${hallazgo.linea} ${hallazgo.id}`);
      }
    }
  }
  assert.deepEqual(
    pendientes,
    [],
    `bloques con ancla:nueva. Ejecuta «npm run bendecir»:\n  ${pendientes.join("\n  ")}`,
  );
});

test("cada bloque @decision sigue anclado a su tramo de código", () => {
  const derivas = [];
  for (const { ruta, hallazgos } of anclados) {
    for (const hallazgo of hallazgos) {
      const donde = `${relative(RAIZ, ruta)}:${hallazgo.linea} ${hallazgo.id}`;
      if (hallazgo.problema) {
        derivas.push(`${donde} — ${hallazgo.problema}`);
        continue;
      }
      if (hallazgo.incompleto) {
        derivas.push(`${donde} — tramo:${hallazgo.tramo} excede el final del archivo`);
        continue;
      }
      if (hallazgo.declarada !== "nueva" && hallazgo.declarada !== hallazgo.real) {
        derivas.push(
          `${donde} — declara ${hallazgo.declarada}, el código da ${hallazgo.real}`,
        );
      }
    }
  }
  assert.deepEqual(
    derivas,
    [],
    "el código cambió bajo una decisión escrita. Revisa la justificación y, si " +
      "sigue vigente, ejecuta «npm run bendecir»:\n  " + derivas.join("\n  "),
  );
});

test("cada decisión citada en el código existe en decisiones/", () => {
  const huerfanas = [];
  for (const { ruta, hallazgos } of anclados) {
    for (const hallazgo of hallazgos) {
      if (!decisiones[hallazgo.id]) {
        huerfanas.push(`${relative(RAIZ, ruta)}:${hallazgo.linea} cita ${hallazgo.id}`);
      }
    }
  }
  assert.deepEqual(huerfanas, [], `decisiones inexistentes:\n  ${huerfanas.join("\n  ")}`);
});

test("ningún código vivo se apoya en una decisión reemplazada", () => {
  const caducas = [];
  for (const { ruta, hallazgos } of anclados) {
    for (const hallazgo of hallazgos) {
      const entrada = decisiones[hallazgo.id];
      if (entrada?.estado === "superseded") {
        caducas.push(
          `${relative(RAIZ, ruta)}:${hallazgo.linea} cita ${hallazgo.id}, ` +
            `reemplazada por ${entrada.reemplazadaPor}`,
        );
      }
    }
  }
  assert.deepEqual(caducas, [], `citas caducas:\n  ${caducas.join("\n  ")}`);
});
