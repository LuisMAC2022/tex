import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { setTimeout as esperar } from "node:timers/promises";

const raiz = new URL("../", import.meta.url);
const origen = "https://editor.test";
const tarjetas = "#block-list article";
const tamanos = [[320, 568], [390, 844], [430, 932]];

export async function medirNavegacion(pagina, desplazar = false) {
  return pagina.locator("#mobile-navigation button:visible").evaluateAll((botones, desplazar) =>
    botones.map(b => {
      if (desplazar) b.scrollIntoView({ block: "nearest", inline: "nearest" });
      const r = b.getBoundingClientRect();
      const objetivo = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return { id: b.id, right: Math.round(r.right), dentro: r.left >= 0 && r.right <= innerWidth &&
        b.scrollWidth <= b.clientWidth && b.contains(objetivo) };
    }), desplazar);
}

async function simbolos(p) {
  return p.locator("#symbol-groups button").evaluateAll(botones => {
    const rect = selector => document.querySelector(selector).getBoundingClientRect();
    const techo = Math.max(0, rect(".symbol-sheet").top, rect("#symbol-groups").top);
    const piso = Math.min(innerHeight, rect("#thumb-bar").top, rect("#symbol-groups").bottom, rect(".symbol-sheet").bottom);
    const filas = new Map();
    let visibles = 0;
    for (const b of botones) {
      const r = b.getBoundingClientRect();
      if (!r.height) continue;
      const completo = r.top >= techo && r.bottom <= piso && r.left >= 0 && r.right <= innerWidth &&
        b.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
      filas.set(r.top, (filas.get(r.top) ?? true) && completo);
      if (completo) visibles++;
    }
    return { botones: visibles, filas: [...filas.values()].filter(Boolean).length };
  });
}

async function medirTiempo(p, contexto) {
  await p.tap("#tab-write");
  const existentes = await p.locator(tarjetas).count();
  for (let i = existentes; i < 30; i++) {
    await p.fill("#block-content", "Texto " + i + " con una ecuación \\(x^2+i\\).");
    await p.tap("#thumb-add");
  }
  const cdp = await contexto.newCDPSession(p);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const muestras = [];
  for (let i = 0; i < 3; i++) {
    await p.evaluate(() => {
      window.muestra = [];
      window.observador = new PerformanceObserver(lista => {
        for (const e of lista.getEntries()) {
          if (e.target?.closest?.("#tab-tree") && e.interactionId) window.muestra.push(e.duration);
        }
      });
      window.observador.observe({ type: "event", durationThreshold: 16 });
    });
    await p.tap("#tab-tree");
    await p.waitForSelector("#panel-tree:visible");
    await esperar(400);
    muestras.push(await p.evaluate(() => {
      window.observador.disconnect();
      return window.muestra.length ? Math.max(...window.muestra) : null;
    }));
    await p.tap("#tab-write");
  }
  return { muestras, mediana: muestras.includes(null) ? null : [...muestras].sort((a,b) => a-b)[1] };
}

async function medir(navegador, dispositivo, width, height) {
  const contexto = await navegador.newContext({ ...dispositivo, viewport: { width, height },
    deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  try {
    const p = await contexto.newPage();
    let pausado;
    const esperaScript = new Promise(resolve => { pausado = resolve; });
    await contexto.route(origen + "/**", async ruta => {
      const path = new URL(ruta.request().url()).pathname.slice(1) || "index.html";
      if (path === "assets/js/app.js" && pausado) { pausado(); pausado = null; await esperar(4000); }
      const archivo = new URL(path, raiz);
      try { await ruta.fulfill({ path: archivo.pathname, body: await readFile(archivo) }); }
      catch (e) { if (e.code !== "ENOENT") throw e; await ruta.fulfill({ status: 404 }); }
    });
    const carga = p.goto(origen);
    await esperaScript;
    const estadoAntesDeJs = await p.evaluate(() => ({
      texto: document.querySelector("#app-status").textContent,
      interactiva: !document.querySelector("#thumb-add").matches(":disabled") &&
        !document.querySelector("#thumb-add").closest("[inert]")
    }));
    await carga;
    await p.fill("#block-content", "Bloque de prueba.");
    await p.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const boton = p.locator("#add-block");
    let caja = await boton.boundingBox();
    if (caja.y + caja.height / 2 >= height) {
      await boton.evaluate(b => b.scrollIntoView({ block: "center" }));
      caja = await boton.boundingBox();
    }
    await p.touchscreen.tap(caja.x + caja.width / 2, caja.y + caja.height / 2);
    const anadirTrasFoco = await p.locator(tarjetas).count() === 1;
    await p.fill("#block-content", "Desde la barra.");
    await p.tap("#thumb-add");
    const estado = await p.evaluate(() => {
      const r = document.querySelector("#app-status").getBoundingClientRect();
      return { top: Math.round(r.top), visible: r.height > 0 && r.top >= 0 &&
        r.bottom <= document.querySelector("#thumb-bar").getBoundingClientRect().top };
    });
    await p.tap("#tab-tree");
    const pestanas = await medirNavegacion(p);
    await p.getByRole("button", { name: /^Editar Texto,/ }).first().tap();
    const focoTrasEditar = await p.evaluate(() => document.activeElement.id);
    await p.focus("#block-content");
    await p.tap("#thumb-symbols");
    const normal = await simbolos(p);
    await p.setViewportSize({ width, height: Math.floor(height / 2) });
    await p.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const reducido = await simbolos(p);
    await p.setViewportSize({ width, height });
    await p.tap("#close-symbol-sheet");
    await p.tap("#tab-tree");
    const estilo = await p.addStyleTag({ content: "html { font-size: 200% !important }" });
    const texto200 = await medirNavegacion(p, true);
    await p.setViewportSize({ width: 195, height: 422 });
    const estrecho = await medirNavegacion(p, true);
    await estilo.evaluate(e => e.remove());
    await p.setViewportSize({ width, height });
    const rendimiento = await contexto.newPage();
    await rendimiento.addInitScript(() => localStorage.clear());
    await rendimiento.goto(origen);
    return { viewport: [width,height], anadirTrasFoco, estadoVisibleTrasAnadir: estado.visible,
      estadoY: estado.top, pestanasDentro: pestanas.every(b => b.dentro), pestanas,
      pestanasDentroTexto200: { normal: texto200.every(b => b.dentro), estrecho195: estrecho.every(b => b.dentro) },
      simbolosVisibles: { normal, reducido }, estadoAntesDeJs, focoTrasEditar,
      inpEstructura30: await medirTiempo(rendimiento, contexto) };
  } finally { await contexto.close(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { chromium, devices } = createRequire(import.meta.url)("playwright");
  const navegador = await chromium.launch();
  try {
    const medidas = [];
    for (const [w,h] of tamanos) medidas.push(await medir(navegador, devices["Pixel 7"], w, h));
    console.log(JSON.stringify(medidas, null, 2));
  } finally { await navegador.close(); }
}
