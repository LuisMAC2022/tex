/**
 * Lectura y verificación de bloques @decision anclados al código.
 *
 * Un bloque @decision es un comentario que explica por qué el código que le
 * sigue es como es, y declara una huella del tramo que gobierna. Si ese tramo
 * cambia y el bloque no, la huella deja de coincidir y la prueba falla: el
 * comentario obsoleto se vuelve ruidoso en vez de silencioso.
 *
 * El formato exacto y un ejemplo están en PROTOCOLO.md. Deliberadamente no se
 * reproduce aquí: este archivo se analiza a sí mismo y un ejemplo literal en
 * este comentario sería detectado como un bloque real.
 *
 * `tramo` cuenta LÍNEAS NO VACÍAS después del cierre del comentario. La huella
 * colapsa cada tramo de espacios en uno solo, así que reindentar no la altera;
 * cambiar qué hace el código, sí. Los espacios DENTRO de una línea sí cuentan:
 * `f(x)` y `f( x )` dan huellas distintas.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = fileURLToPath(new URL("..", import.meta.url));

/** Extensiones donde puede vivir un bloque @decision. */
const EXTENSIONES = [".js", ".mjs", ".html", ".css"];
/** Directorios que no se recorren. */
const IGNORADOS = new Set([".git", "node_modules"]);

export const MARCA =
  /@decision\s+(DEC-\d{3})\s+ancla:(nueva|[0-9a-f]{8})\s+tramo:(\d+)/;

/** Normaliza y resume un tramo de código. Espacios y sangría no cuentan. */
export function huella(lineas) {
  const normal = lineas
    .map((linea) => linea.trim().replace(/\s+/g, " "))
    .filter(Boolean);
  return createHash("sha256").update(normal.join("\n")).digest("hex").slice(0, 8);
}

/** Archivos candidatos, en orden estable. */
export function fuentes(raiz = RAIZ) {
  const encontrados = [];
  const recorrer = (directorio) => {
    for (const nombre of readdirSync(directorio).sort()) {
      if (IGNORADOS.has(nombre)) continue;
      const ruta = join(directorio, nombre);
      if (statSync(ruta).isDirectory()) recorrer(ruta);
      else if (EXTENSIONES.some((extension) => nombre.endsWith(extension))) {
        encontrados.push(ruta);
      }
    }
  };
  recorrer(raiz);
  return encontrados;
}

/**
 * Encuentra los bloques @decision de un texto y calcula la huella real de cada
 * tramo. No lee ni escribe archivos: recibe el contenido y devuelve hallazgos.
 */
export function analizar(texto) {
  const lineas = texto.split(/\r?\n/);
  const hallazgos = [];

  for (let i = 0; i < lineas.length; i += 1) {
    const marca = MARCA.exec(lineas[i]);
    if (!marca) continue;

    const [, id, declarada, tramoTexto] = marca;
    const tramo = Number(tramoTexto);

    // El cierre puede estar en la misma línea, si el comentario es de una línea.
    let cierre = i;
    while (cierre < lineas.length && !/\*\/|-->/.test(lineas[cierre])) cierre += 1;
    if (cierre >= lineas.length) {
      hallazgos.push({ id, linea: i + 1, problema: "el comentario no cierra (*/ o -->)" });
      continue;
    }

    const cuerpo = [];
    let j = cierre + 1;
    while (j < lineas.length && cuerpo.length < tramo) {
      if (lineas[j].trim()) cuerpo.push(lineas[j]);
      j += 1;
    }

    hallazgos.push({
      id,
      linea: i + 1,
      declarada,
      tramo,
      real: huella(cuerpo),
      incompleto: cuerpo.length < tramo,
    });
  }

  return hallazgos;
}

/** Analiza todo el repositorio. Devuelve [{ ruta, hallazgos }]. */
export function revisar(raiz = RAIZ) {
  return fuentes(raiz)
    .map((ruta) => ({ ruta, texto: readFileSync(ruta, "utf8") }))
    .map(({ ruta, texto }) => ({ ruta, hallazgos: analizar(texto) }))
    .filter(({ hallazgos }) => hallazgos.length > 0);
}
