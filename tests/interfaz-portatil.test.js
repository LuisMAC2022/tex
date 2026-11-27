import test, { after } from "node:test";
import assert from "node:assert/strict";
import { abrir, cerrar, omitir } from "./navegador.mjs";

after(cerrar);

test("medidas de referencia del portátil con veinticinco párrafos", { skip: omitir }, async () => {
  const { pagina, contexto } = await abrir();
  try {
    await pagina.evaluate(() => document.fonts.ready);
    const campoInicial = await pagina.locator("#block-content").evaluate(campo => campo.getBoundingClientRect().top);
    assert.ok(campoInicial <= 160, `Contenido empieza en ${campoInicial} px al cargar`);
    await pagina.fill("#note-title", "Derivadas parciales");
    await pagina.selectOption("#block-type", "text");
    for (let n = 1; n <= 25; n++) {
      await pagina.fill("#block-content", `Párrafo ${n} con $x^${n}$.`);
      await pagina.click("#add-block");
    }
    await pagina.evaluate(() => document.fonts.ready);
    const medidas = await pagina.evaluate(() => {
      const caja = selector => document.querySelector(selector).getBoundingClientRect();
      const estado = caja("#app-status");
      return {
        pagina: document.documentElement.scrollHeight,
        campo: caja("#block-content").top + scrollY,
        añadir: caja("#add-block").top + scrollY,
        estadoDocumento: estado.top + scrollY,
        estadoVentana: estado.top,
        estadoIzquierda: estado.left,
        estadoAbajo: estado.bottom,
        estadoDerecha: estado.right,
        estadoVisible: getComputedStyle(document.querySelector("#app-status")).opacity === "1"
          && estado.top >= 0 && estado.left >= 0 && estado.bottom <= innerHeight && estado.right <= innerWidth,
        tarjeta: caja("#block-list article").height,
      };
    });
    medidas.campoInicial = campoInicial;
    assert.ok(medidas.estadoVisible, "El anuncio queda enteramente visible tras añadir el bloque 25");

    const leerDesplazamiento = () => pagina.evaluate(() => ({
      estructura: document.querySelector("#structure-panel").scrollTop,
      editor: document.querySelector(".block-editor").scrollTop,
      campo: document.querySelector("#block-content").getBoundingClientRect().top,
      pagina: scrollY,
    }));
    const antes = await leerDesplazamiento();
    const estructura = pagina.locator("#structure-panel");
    await estructura.hover();
    await pagina.mouse.wheel(0, 300);
    await pagina.waitForFunction(inicial => document.querySelector("#structure-panel").scrollTop > inicial, antes.estructura);
    const despues = await leerDesplazamiento();
    medidas.desplazamientoEstructura = despues.estructura - antes.estructura;
    medidas.desplazamientoEditor = despues.editor - antes.editor;
    medidas.desplazamientoCampo = despues.campo - antes.campo;
    medidas.desplazamientoPagina = despues.pagina - antes.pagina;
    assert.equal(medidas.desplazamientoEditor, 0);
    assert.equal(medidas.desplazamientoCampo, 0);
    assert.equal(medidas.desplazamientoPagina, 0);

    await pagina.click("#review-writing");
    Object.assign(medidas, await pagina.evaluate(() => ({
      revision: document.querySelector("#math-preview-panel").getBoundingClientRect().top + scrollY,
      desplazamiento: scrollY,
    })));
    console.log("Medidas a 1366 × 768 (px)", JSON.stringify(medidas));
    await pagina.click("#review-writing");
    const columnas = [];
    for (const width of [1280, 1366, 1440, 1536, 1920]) {
      await pagina.setViewportSize({ width, height: 768 });
      columnas.push(await pagina.evaluate(() => ({
        ancho: innerWidth,
        estructura: document.querySelector("#structure-panel").getBoundingClientRect().left,
        editor: document.querySelector(".block-editor").getBoundingClientRect().width,
      })));
    }
    console.log("Columnas con revisión cerrada (px)", JSON.stringify(columnas));
    await pagina.setViewportSize({ width: 1366, height: 768 });
    await pagina.reload();
    await pagina.locator("#recover-session").waitFor();
    const campoAlRecargar = await pagina.locator("#block-content").evaluate(campo => campo.getBoundingClientRect().top);
    assert.ok(campoAlRecargar <= 160, `Contenido empieza en ${campoAlRecargar} px con una sesión pendiente`);
  } finally {
    await contexto.close();
  }
});

test("la estructura queda a la izquierda y el editor conserva su ancho máximo", { skip: omitir }, async () => {
  const { pagina, contexto } = await abrir();
  try {
    for (const width of [1280, 1366, 1440, 1536, 1920]) {
      await pagina.setViewportSize({ width, height: 768 });
      for (const abierta of [false, true]) {
        const cajas = await pagina.evaluate(() => {
          const estructura = document.querySelector("#structure-panel").getBoundingClientRect();
          const editor = document.querySelector(".block-editor").getBoundingClientRect();
          return {
            derechaEstructura: estructura.right,
            izquierdaEditor: editor.left,
            anchoEditor: editor.width,
            maximo: 46 * parseFloat(getComputedStyle(document.documentElement).fontSize),
          };
        });
        const estado = `${width} px con Revisión ${abierta ? "abierta" : "cerrada"}`;
        assert.ok(cajas.derechaEstructura <= cajas.izquierdaEditor, `Estructura a la izquierda a ${estado}`);
        assert.ok(cajas.anchoEditor <= cajas.maximo, `Editor de hasta 46 rem a ${estado}`);
        await pagina.click("#review-writing");
      }
    }
  } finally {
    await contexto.close();
  }
});

test("Revisión y Contenido se ven juntos con veinticinco bloques", { skip: omitir }, async () => {
  const { pagina, contexto } = await abrir();
  try {
    await pagina.fill("#note-title", "Derivadas parciales");
    await pagina.selectOption("#block-type", "text");
    for (let n = 1; n <= 25; n++) {
      await pagina.fill("#block-content", `Párrafo ${n} con $x^${n}$.`);
      await pagina.click("#add-block");
    }
    assert.equal(await pagina.locator("#block-list article").count(), 25);
    await pagina.fill("#block-content", ["Sea $x^2$ el borrador.", ...Array(10).fill("Otra línea del borrador.")].join("\n"));
    await pagina.evaluate(() => document.fonts.ready);
    const antes = await pagina.evaluate(() => scrollY);
    await pagina.click("#review-writing");
    await pagina.locator("#math-preview .katex").waitFor();
    const medidas = await pagina.evaluate(() => {
      const caja = selector => document.querySelector(selector).getBoundingClientRect();
      const dentro = (elemento, panel) => elemento.width > 0 && elemento.height > 0
        && elemento.left >= 0 && elemento.right <= innerWidth
        && elemento.top >= Math.max(caja(".site-header").bottom, panel.top)
        && elemento.bottom <= Math.min(innerHeight, panel.bottom);
      return {
        contenido: dentro(caja("#block-content"), caja(".block-editor")),
        vista: dentro(caja("#math-preview"), caja("#math-preview-panel")),
        desplazamiento: scrollY,
      };
    });
    assert.ok(medidas.contenido && medidas.vista, "Contenido y vista previa caben juntos en la ventana");
    assert.ok(Math.abs(medidas.desplazamiento - antes) <= 200, "Revisión desplaza la página como máximo 200 px");
  } finally {
    await contexto.close();
  }
});

test("Revisión pasa al editor por debajo de 80 rem y conserva su estado al redimensionar", { skip: omitir }, async () => {
  const { pagina, contexto } = await abrir();
  try {
    await pagina.setViewportSize({ width: 1279, height: 768 });
    await pagina.click("#review-writing");
    const integrada = pagina.locator(".block-editor #math-preview-panel[open]");
    await integrada.waitFor();
    const contenido = await pagina.locator("#block-content").boundingBox();
    const revision = await integrada.boundingBox();
    assert.ok(revision.y >= contenido.y + contenido.height);
    assert.equal(revision.x, contenido.x);
    await pagina.click("#toggle-structure");
    assert.equal(await pagina.locator("#structure-panel").isVisible(), false);

    await pagina.setViewportSize({ width: 1280, height: 768 });
    const lateral = pagina.locator(".editor-workspace > #math-preview-panel[open]");
    await lateral.waitFor();
    const editor = await pagina.locator(".block-editor").boundingBox();
    assert.ok((await lateral.boundingBox()).x > editor.x + editor.width);
    await lateral.locator("summary").click();
    assert.equal(await pagina.evaluate(() => document.activeElement.id), "review-writing");
    assert.equal(await pagina.locator("#math-preview-panel").isVisible(), false);
  } finally {
    await contexto.close();
  }
});
