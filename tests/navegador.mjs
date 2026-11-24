/**
 * Arnés de las pruebas de interfaz (DEC-029).
 *
 * Playwright es opcional: package.json sigue sin dependencias (INV-006). Si no
 * se encuentra, las pruebas de interfaz se omiten con un motivo visible, igual
 * que las de pdflatex. Con TEX_UI_TESTS=required —lo que hace CI— la ausencia
 * de Playwright es un fallo, no una omisión, para que nadie fusione creyendo
 * que la interfaz se probó.
 *
 * Se resuelve con require y no con import porque así respeta NODE_PATH y una
 * instalación global o con `npm install --no-save`.
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let playwright = null;
try { playwright = require("playwright"); } catch { /* se informa en `omitir` */ }

export const OBLIGATORIAS = process.env.TEX_UI_TESTS === "required";
export const omitir = !playwright && !OBLIGATORIAS && "Playwright no está instalado: pruebas de interfaz omitidas";
const PAGINA = new URL("../index.html", import.meta.url).href;

let navegador = null;
async function lanzar() {
  if (!playwright) throw new Error("TEX_UI_TESTS=required pero Playwright no está instalado");
  navegador ??= await playwright.chromium.launch();
  return navegador;
}

/** Cierra el navegador compartido. Va en el `after` de cada archivo. */
export async function cerrar() { await navegador?.close(); navegador = null; }

/**
 * Abre la aplicación limpia (almacenamiento vacío) en un contexto nuevo.
 * `dispositivo` es un nombre de `playwright.devices`, p. ej. "Pixel 7"; sin él,
 * escritorio de 1366×768. `preparar`, si se da, corre en la página antes que
 * la aplicación (p. ej. para simular un navegador sin almacenamiento).
 * Devuelve la página y la lista de errores de la página, que cada prueba debe
 * comprobar vacía.
 */
export async function abrir(dispositivo, preparar) {
  const opciones = dispositivo ? playwright.devices[dispositivo] : { viewport: { width: 1366, height: 768 } };
  const contexto = await (await lanzar()).newContext(opciones);
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on("pageerror", (error) => errores.push(error.message));
  pagina.on("console", (mensaje) => { if (mensaje.type() === "error") errores.push(mensaje.text()); });
  if (preparar) await pagina.addInitScript(preparar);
  await pagina.goto(PAGINA);
  return { pagina, contexto, errores, cdp: () => contexto.newCDPSession(pagina) };
}

/**
 * Arrastra un dedo en vertical desde `inicio` y lo levanta. Usa CDP porque la
 * API de alto nivel de Playwright solo toca, no desliza.
 */
export async function deslizar(sesion, inicio, desplazamiento, pasos = 8) {
  await sesion.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [inicio] });
  for (let i = 1; i <= pasos; i++) {
    await sesion.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: inicio.x, y: inicio.y + desplazamiento * i / pasos }] });
  }
  await sesion.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

/** Inicia una pulsación larga. El llamador puede añadir otro dedo antes de levantarlo. */
export async function mantener(sesion, punto, ms = 400) {
  await sesion.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [punto] });
  await new Promise(resolve => setTimeout(resolve, ms));
}

export async function arrastrar(sesion, puntos) {
  const [inicio, ...recorrido] = puntos;
  await sesion.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [inicio] });
  for (const punto of recorrido) {
    await sesion.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [punto] });
  }
  await sesion.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

export async function codigo(pagina) {
  await irAlPanel(pagina, "Documento");
  await pagina.getByRole("button", { name: "Generar documento" }).click();
  return pagina.locator("#latex-output").inputValue();
}

export const foco = pagina => pagina.evaluate(() => document.activeElement.id);

export async function centro(locator) {
  await locator.scrollIntoViewIfNeeded();
  const caja = await locator.boundingBox();
  return { x: caja.x + caja.width / 2, y: caja.y + caja.height / 2 };
}

export async function sesionDePrueba(t, dispositivo) {
  const sesion = await abrir(dispositivo);
  sesion.pagina.setDefaultTimeout(6000);
  t.after(async () => {
    await sesion.contexto.close();
    if (sesion.errores.length) throw new Error(sesion.errores.join("\n"));
  });
  return sesion;
}

export async function irAlPanel(pagina, nombre) {
  const tab = pagina.getByRole("tab", { name: nombre, exact: true });
  if (await tab.isVisible()) await tab.click();
}
