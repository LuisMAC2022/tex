import test from "node:test";
import assert from "node:assert/strict";
import { loadTexNotes } from "./load-app.mjs";

const { normalizeImageOptions, imagePathWarnings } = await loadTexNotes(["image-options.js"]);
const defaults = { width: 0.8, angle: 0, align: "center", placement: "htbp" };

test("las opciones de imagen tienen valores por defecto sin altura ni etiqueta", () => {
  for (const invalid of [undefined, null, 42, [], {}, "texto"]) {
    assert.deepEqual(structuredClone(normalizeImageOptions(invalid)), defaults);
  }
  assert.deepEqual(structuredClone(normalizeImageOptions({ width: " ", height: -2, angle: Infinity, align: "medio", placement: "xyz", label: " fig: {} " })), defaults);
});

test("las opciones de imagen redondean y limitan los valores numéricos", () => {
  assert.equal(normalizeImageOptions({ width: 0, angle: -500 }).width, 0.1);
  assert.equal(normalizeImageOptions({ width: 0, angle: -500 }).angle, -360);
  assert.equal(normalizeImageOptions({ width: " 5 ", angle: "500" }).width, 1);
  assert.equal(normalizeImageOptions({ width: " 5 ", angle: "500" }).angle, 360);
  assert.deepEqual(structuredClone(normalizeImageOptions({ width: " .637 ", height: "2.536", angle: "-45.126" })),
    { ...defaults, width: 0.64, height: 2.54, angle: -45.13 });
  assert.deepEqual(structuredClone(normalizeImageOptions({ width: "0x1", height: 1e100, angle: "90°" })), defaults);
  assert.equal(normalizeImageOptions({ angle: -0.001 }).angle, 0);
});

test("las opciones de imagen sanean alineación, posición y etiqueta de forma idempotente", () => {
  const options = normalizeImageOptions({ align: " Right ", placement: "P?Hph", label: " Fig:Gráfica-2_{} " });
  assert.deepEqual(structuredClone(options), { ...defaults, align: "right", placement: "hp", label: "fig:grafica-2" });
  assert.deepEqual(normalizeImageOptions(options), options);
});

test("los avisos de ruta distinguen espacios, mayúsculas y formatos incompatibles", () => {
  for (const path of ["", "  figuras/grafica_1.png ", "a.jpg", "a.jpeg", "a.pdf"]) assert.equal(imagePathWarnings(path).length, 0);
  assert.equal(imagePathWarnings("figuras/grafica 1.jpg").length, 1);
  assert.equal(imagePathWarnings("figuras/grafica.JPG").length, 1);
  assert.equal(imagePathWarnings("figuras/grafica 1.GIF").length, 3);
  assert.equal(imagePathWarnings("figuras.png/grafica").length, 1);
});

test("avisa si el nombre contiene caracteres reservados de LaTeX", () => {
  for (const character of ["%", "#", "{", "}", "\\"]) {
    assert.match(imagePathWarnings(`figura${character}2026.pdf`).join(" "), /impedir la compilación/);
  }
});
