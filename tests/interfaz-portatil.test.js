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

test("Contenido y Añadir bloque caben a 1366 × 768 sin desplazar el editor", { skip: omitir }, async () => {
  const { pagina, contexto, errores, cdp } = await abrir();
  try {
    await pagina.evaluate(() => document.fonts.ready);
    const medir = () => pagina.evaluate(() => {
      const boton = document.querySelector("#add-block");
      const accion = boton.getBoundingClientRect();
      const columna = boton.closest(".block-editor");
      const limite = columna.getBoundingClientRect();
      const campo = document.querySelector("#block-content").getBoundingClientRect();
      return {
        visible: accion.width > 0 && accion.height > 0 && accion.left >= 0 && accion.right <= innerWidth
          && accion.top >= Math.max(limite.top, document.querySelector(".site-header").getBoundingClientRect().bottom)
          && accion.bottom <= Math.min(limite.bottom, innerHeight),
        campoArriba: campo.top,
        campoAlto: campo.height,
        altoVentana: innerHeight,
        desplazamiento: [scrollY, columna.scrollTop],
      };
    });
    const inicio = await medir();
    assert.deepEqual(inicio.desplazamiento, [0, 0]);
    assert.ok(inicio.visible, "Añadir bloque se ve entero al cargar");
    assert.ok(inicio.campoArriba <= 140, `Contenido empieza en ${inicio.campoArriba} px`);
    assert.equal(await pagina.locator("#add-block-key").innerText(), await pagina.locator("#commit-key-label").textContent());

    await pagina.click("#focus-writing");
    const concentracion = await medir();
    assert.ok(concentracion.campoAlto >= 0.6 * concentracion.altoVentana, "Contenido ocupa al menos el 60 % de la ventana");
    assert.ok(concentracion.visible, "Añadir bloque se ve entero en Concentración");

    await pagina.click("#focus-writing");
    await pagina.selectOption("#block-type", { label: "Lista con viñetas" });
    const ayuda = pagina.locator(".content-heading details", { hasText: "Ayuda de la lista" });
    await ayuda.locator("summary").waitFor();
    assert.ok(await ayuda.locator("#list-help").count(), "La ayuda de lista se conserva en el DOM");
    assert.equal(await ayuda.getAttribute("open"), null);
    assert.match(await pagina.locator("#block-content").getAttribute("aria-describedby"), /\blist-help\b/);
    const sesion = await cdp();
    const { root } = await sesion.send("DOM.getDocument");
    const { nodeId } = await sesion.send("DOM.querySelector", { nodeId: root.nodeId, selector: "#block-content" });
    const { nodes: [campoAccesible] } = await sesion.send("Accessibility.getPartialAXTree", { nodeId, fetchRelatives: false });
    assert.match(campoAccesible.description?.value ?? "", /Escribe un elemento por línea/);
    assert.deepEqual((await medir()).desplazamiento, [0, 0]);
    assert.ok((await medir()).visible, "Añadir bloque se ve entero después de elegir Lista con viñetas");

    await pagina.click("#focus-writing");
    await ayuda.locator("summary").click();
    assert.ok((await medir()).visible, "La fila de acciones sigue visible con la ayuda abierta");
    assert.deepEqual(errores, []);
  } finally {
    await contexto.close();
  }
});

test("las tarjetas compactas permiten editar con ratón y teclado sin desplazar la página", { skip: omitir }, async () => {
  const { pagina, contexto, errores } = await abrir();
  try {
    await pagina.selectOption("#block-type", "text");
    for (let n = 1; n <= 25; n++) {
      await pagina.fill("#block-content", `Párrafo ${n}.`);
      await pagina.click("#add-block");
    }
    const tarjetas = pagina.locator("#block-list article");
    assert.equal(await tarjetas.count(), 25);
    const primera = tarjetas.first(), vigesima = tarjetas.nth(19);
    const altura = (await primera.boundingBox()).height;
    assert.ok(altura <= 110, `La tarjeta de una línea mide ${altura} px`);
    const acciones = primera.locator(".block-actions");
    assert.equal(await acciones.evaluate(fila => getComputedStyle(fila).opacity), "0");
    await primera.hover();
    assert.equal(await acciones.evaluate(fila => getComputedStyle(fila).opacity), "1");
    await pagina.locator("#structure-search").hover();

    await pagina.focus("#structure-search");
    await pagina.keyboard.press("Tab");
    assert.equal(await primera.locator('[data-action="edit"]').evaluate(boton => boton === document.activeElement), true);
    assert.equal(await acciones.evaluate(fila => getComputedStyle(fila).opacity), "1");

    const visible = () => vigesima.evaluate(tarjeta => {
      const dentro = (elemento, panel) => {
        const caja = elemento.getBoundingClientRect();
        const limite = panel.getBoundingClientRect();
        return caja.width > 0 && caja.height > 0
          && caja.top >= Math.max(0, limite.top) && caja.bottom <= Math.min(innerHeight, limite.bottom)
          && caja.left >= 0 && caja.right <= innerWidth;
      };
      const campo = document.querySelector("#block-content");
      return { tarjeta: dentro(tarjeta, tarjeta.closest(".structure-panel")), campo: dentro(campo, campo.closest(".block-editor")), pagina: scrollY };
    });
    const desplazamiento = await pagina.evaluate(() => scrollY);
    await vigesima.evaluate(tarjeta => {
      const panel = tarjeta.closest(".structure-panel");
      panel.scrollTop += tarjeta.getBoundingClientRect().top - panel.getBoundingClientRect().bottom + 30;
    });
    assert.equal((await visible()).tarjeta, false);
    await vigesima.locator("h4").click();
    assert.equal(await pagina.inputValue("#block-content"), "Párrafo 20.");
    assert.equal(await vigesima.getAttribute("aria-current"), "true");
    assert.deepEqual(await visible(), { tarjeta: true, campo: true, pagina: desplazamiento });

    await pagina.fill("#block-content", "Párrafo 20 corregido.");
    await pagina.locator("#structure-panel").evaluate(panel => { panel.scrollTop = 0; });
    await pagina.click("#add-block");
    assert.equal(await vigesima.getAttribute("aria-current"), null);
    assert.match(await vigesima.locator(".block-preview").textContent(), /Párrafo 20 corregido\./);
    assert.deepEqual(await visible(), { tarjeta: true, campo: true, pagina: desplazamiento });

    await pagina.keyboard.press("Enter");
    assert.equal(await vigesima.getAttribute("aria-current"), "true");
    await pagina.locator("#structure-panel").evaluate(panel => { panel.scrollTop = 0; });
    await pagina.click("#cancel-edit");
    assert.equal(await vigesima.getAttribute("aria-current"), null);
    assert.deepEqual(await visible(), { tarjeta: true, campo: true, pagina: desplazamiento });
    assert.deepEqual(errores, []);
  } finally {
    await contexto.close();
  }
});

test("Ver todo aparece con el recorte de dos líneas y Esquema conserva la edición", { skip: omitir }, async () => {
  const { pagina, contexto, errores } = await abrir();
  try {
    for (const contenido of ["Una línea.", "Texto que ocupa varias líneas. ".repeat(15).trim()]) {
      await pagina.fill("#block-content", contenido);
      await pagina.click("#add-block");
    }
    const tarjetas = pagina.locator("#block-list article");
    assert.equal(await tarjetas.first().locator(".preview-toggle").isVisible(), false);
    const segunda = tarjetas.nth(1);
    const vista = segunda.locator(".block-preview");
    const ver = segunda.locator(".preview-toggle.tertiary");
    await ver.waitFor();
    assert.equal(await vista.evaluate(nodo => getComputedStyle(nodo).webkitLineClamp), "2");
    const altoRecortado = (await vista.boundingBox()).height;
    await ver.click();
    assert.equal(await segunda.getAttribute("aria-current"), null);
    assert.ok((await vista.boundingBox()).height > altoRecortado);
    await ver.click();
    assert.equal((await vista.boundingBox()).height, altoRecortado);

    const altoTarjeta = (await segunda.boundingBox()).height;
    await pagina.selectOption("#structure-mode", "outline");
    assert.equal(await vista.isVisible(), false);
    assert.ok((await segunda.boundingBox()).height < altoTarjeta);
    await segunda.locator("h4").click();
    assert.equal(await segunda.getAttribute("aria-current"), "true");
    assert.deepEqual(errores, []);
  } finally {
    await contexto.close();
  }
});
