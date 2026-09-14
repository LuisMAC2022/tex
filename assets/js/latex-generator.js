/** Deterministic LaTeX generation. No function in this module mutates its input. */

import { BLOCK_TYPES, getBlockType } from "./block-types.js";

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
  const definition = getBlockType(block.type) || getBlockType("text");
  const content = normalizeLineBreaks(block.content);

  if (definition.kind === "math") {
    const formula = content.trim();
    if (!formula) return "";
    const [open, close] = definition.delimiters;
    return definition.inline ? `${open}${formula}${close}` : `${open}\n${content}\n${close}`;
  }

  if (definition.kind === "list") {
    const items = content.split("\n").map((line) => escapeLatexText(line).trim()).filter(Boolean);
    if (!items.length) return "";
    const body = items.map((item) => `\\item ${item}`).join("\n");
    return `\\begin{${definition.listEnvironment}}\n${body}\n\\end{${definition.listEnvironment}}`;
  }

  const escaped = escapeLatexText(content).trim();
  if (!escaped) return "";
  if (definition.kind === "text") {
    const heading = escapeLatexText(block.title).trim();
    return heading ? `\\subsection{${heading}}\n${escaped}` : escaped;
  }
  return `\\begin{${definition.environment}}${optionalTitle(block.title)}\n${escaped}\n\\end{${definition.environment}}`;
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
    "% amssymb aporta los conjuntos numéricos de \\mathbb del tablero de símbolos.",
    "\\usepackage{amssymb}",
    "% amsthm permite declarar teoremas y bloques relacionados.",
    "\\usepackage{amsthm}",
    // Cada entorno numerado lleva un contador propio, continuo en todo el documento.
    ...BLOCK_TYPES.filter((type) => type.declaration).map((type) => type.declaration),
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
