import { loadTexNotes } from "./load-app.mjs";
export const T = await loadTexNotes(["block-types.js","block-tree.js","outline.js", "latex-generator.js","math-symbols.js","math-preview.js","image-options.js","list-outline.js","cross-references.js", "references.js", "content-check.js","editing-assist.js","completion.js","config-parts.js","shortcuts.js","actions.js","menus.js","radial.js"]);
export const fragmentBlocks = T.RADIAL_MENUS.filter(m => m.context === "formula" || m.context === "text").flatMap(menu =>
  menu.slices.filter(s => s.action.type === "insert").map(s => ({type: menu.context === "formula" ? "equation" : "text",
    content: s.action.snippet.replace(/#0/g, "").replace(/#[1-9]/g, "x"), children: []})));
