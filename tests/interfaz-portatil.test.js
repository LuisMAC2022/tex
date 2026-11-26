import test, { after } from "node:test";
import { abrir, cerrar, omitir } from "./navegador.mjs";

after(cerrar);

test("medidas de referencia del portátil con veinticinco párrafos", { skip: omitir }, async () => {
  const { pagina, contexto } = await abrir();
  try {
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
        tarjeta: caja("#block-list article").height,
      };
    });
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
  } finally {
    await contexto.close();
  }
});
