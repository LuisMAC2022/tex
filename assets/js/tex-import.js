/** Pure validation and parsing for the application's own, inert .tex envelope. */

export const MAX_TEX_FILE_SIZE = 1024 * 1024;
export const TEX_FORMAT_VERSION = 1;
export const TEX_MIME_TYPE = "text/x-tex";

const PREFIX = "% TEX-NOTES:";
const METADATA_KEYS = ["title", "author", "course", "teacher", "date", "topic"];
const BLOCK_TYPES = new Set(["text", "definition", "theorem", "example", "exercise", "solution", "equation"]);

export function normalizeTexLineBreaks(value = "") {
  return String(value).replace(/\r\n?/g, "\n");
}

export function validateTexFile(file = {}) {
  if (!Number.isFinite(file.size) || file.size < 0) throw new Error("No se pudo determinar el tamaño del archivo.");
  if (file.size === 0) throw new Error("El archivo está vacío.");
  if (file.size > MAX_TEX_FILE_SIZE) throw new Error("El archivo supera el límite de 1 MB.");
  const name = typeof file.name === "string" ? file.name : "";
  const type = typeof file.type === "string" ? file.type.toLowerCase() : "";
  if (type !== TEX_MIME_TYPE && !name.toLowerCase().endsWith(".tex")) throw new Error("Selecciona un archivo .tex válido.");
  return true;
}

function decodeData(value) {
  try {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new Error("Los datos internos del archivo no son válidos.");
  }
}

function readSection(lines, cursor, section) {
  if (lines[cursor] !== `${PREFIX}${section}:BEGIN`) throw new Error("Los marcadores del archivo están incompletos o desordenados.");
  if (!lines[cursor + 1]?.startsWith(`${PREFIX}DATA:`)) throw new Error("Faltan datos entre los marcadores del archivo.");
  if (lines[cursor + 2] !== `${PREFIX}${section}:END`) throw new Error("Los marcadores del archivo están incompletos o desordenados.");
  return { value: decodeData(lines[cursor + 1].slice(`${PREFIX}DATA:`.length)), cursor: cursor + 3 };
}

/** Parses only the versioned comment envelope; it never evaluates or interprets TeX. */
export function parseTexDocument(content = "") {
  const normalized = normalizeTexLineBreaks(content);
  if (!normalized.length) throw new Error("El archivo está vacío.");
  const lines = normalized.split("\n");
  const versionMatch = lines[0].match(/^% TEX-NOTES:FORMAT:(\d+)$/);
  if (!versionMatch) throw new Error("El archivo no fue creado por esta aplicación o no incluye un formato reconocible.");
  if (Number(versionMatch[1]) !== TEX_FORMAT_VERSION) throw new Error(`La versión ${versionMatch[1]} del formato no es compatible.`);

  let result = readSection(lines, 1, "METADATA");
  const metadata = result.value;
  const blocks = [];
  while (lines[result.cursor] === `${PREFIX}BLOCK:BEGIN`) {
    result = readSection(lines, result.cursor, "BLOCK");
    blocks.push(result.value);
  }
  if (lines[result.cursor] !== `${PREFIX}CONTENT:BEGIN`) throw new Error("Los marcadores del archivo están incompletos o desordenados.");
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata) || METADATA_KEYS.some((key) => typeof metadata[key] !== "string")) throw new Error("Los metadatos internos del archivo no son válidos.");
  if (blocks.some((block) => !block || typeof block !== "object" || !BLOCK_TYPES.has(block.type) || typeof block.title !== "string" || typeof block.content !== "string")) throw new Error("Uno de los bloques internos del archivo no es válido.");
  return { metadata: Object.fromEntries(METADATA_KEYS.map((key) => [key, metadata[key]])), blocks };
}
