/** Deterministic LaTeX generation. No function in this module mutates its input. */

const ESCAPES = { "\\": "\\textbackslash{}", "#": "\\#", "$": "\\$", "%": "\\%", "&": "\\&", "_": "\\_", "{": "\\{", "}": "\\}", "~": "\\textasciitilde{}", "^": "\\textasciicircum{}" };
export const TEX_FORMAT_VERSION = 1;

function encodeData(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function buildImportEnvelope(state = {}) {
  const metadata = Object.fromEntries(["title", "author", "course", "teacher", "date", "topic"].map((key) => [key, typeof state.metadata?.[key] === "string" ? state.metadata[key] : ""]));
  const blocks = Array.isArray(state.blocks) ? state.blocks : [];
  return [
    `% TEX-NOTES:FORMAT:${TEX_FORMAT_VERSION}`,
    "% TEX-NOTES:METADATA:BEGIN", `% TEX-NOTES:DATA:${encodeData(metadata)}`, "% TEX-NOTES:METADATA:END",
    ...blocks.flatMap((block) => ["% TEX-NOTES:BLOCK:BEGIN", `% TEX-NOTES:DATA:${encodeData(block)}`, "% TEX-NOTES:BLOCK:END"]),
    "% TEX-NOTES:CONTENT:BEGIN",
  ].join("\n");
}

export function normalizeLineBreaks(value = "") {
  return String(value).replace(/\r\n?/g, "\n");
}

export function escapeLatexText(value = "") {
  return normalizeLineBreaks(value).replace(/[\\#$%&_{}~^]/g, (character) => ESCAPES[character]);
}

function optionalTitle(title) {
  const clean = escapeLatexText(title).trim();
  return clean ? `[${clean}]` : "";
}

export function blockToLatex(block = {}) {
  const type = block.type || "text";
  const content = normalizeLineBreaks(block.content);
  if (type === "equation") return content.trim() ? `\\[\n${content}\n\\]` : "";
  const escaped = escapeLatexText(content).trim();
  if (!escaped) return "";
  if (type === "text") {
    const heading = escapeLatexText(block.title).trim();
    return heading ? `\\subsection{${heading}}\n${escaped}` : escaped;
  }
  const environments = { definition: "definition", theorem: "theorem", example: "example", exercise: "exercise", solution: "solution" };
  const environment = environments[type] || "example";
  return `\\begin{${environment}}${optionalTitle(block.title)}\n${escaped}\n\\end{${environment}}`;
}

export function buildPreamble() {
  return [
    "\\documentclass[11pt]{article}",
    "% fontenc genera PDF con caracteres latinos copiables.",
    "\\usepackage[T1]{fontenc}",
    "% inputenc permite que el archivo fuente esté codificado en UTF-8.",
    "\\usepackage[utf8]{inputenc}",
    "% babel adapta al español los nombres y la separación silábica.",
    "\\usepackage[spanish]{babel}",
    "% amsmath proporciona los entornos matemáticos habituales.",
    "\\usepackage{amsmath}",
    "% amsthm permite declarar teoremas y bloques relacionados.",
    "\\usepackage{amsthm}",
    "\\newtheorem{theorem}{Teorema}",
    "\\newtheorem{definition}{Definición}",
    "\\newtheorem{example}{Ejemplo}",
    "\\newtheorem{exercise}{Ejercicio}",
    "\\newenvironment{solution}{\\par\\noindent\\textbf{Solución.} }{\\hfill$\\square$\\par}",
  ].join("\n");
}

export function buildMetadata(metadata = {}) {
  const title = escapeLatexText(metadata.title).trim();
  const authorParts = [metadata.author, metadata.course, metadata.teacher && `Profesor: ${metadata.teacher}`]
    .filter(Boolean).map((value) => escapeLatexText(value).trim());
  const date = metadata.date ? escapeLatexText(metadata.date) : "";
  return [`\\title{${title}}`, `\\author{${authorParts.join(" \\\\ ")}}`, `\\date{${date}}`].join("\n");
}

export function buildBody(state = {}) {
  const metadata = state.metadata || {};
  const topic = escapeLatexText(metadata.topic).trim();
  const blocks = (Array.isArray(state.blocks) ? state.blocks : []).map(blockToLatex).filter(Boolean);
  return ["\\begin{document}", "\\maketitle", topic ? `\\section{${topic}}` : "", ...blocks].filter(Boolean).join("\n\n");
}

export function buildDocumentEnd() { return "\\end{document}"; }

export function generateLatex(state = {}) {
  return `${buildImportEnvelope(state)}\n${buildPreamble()}\n\n${buildMetadata(state.metadata)}\n\n${buildBody(state)}\n\n${buildDocumentEnd()}\n`;
}
