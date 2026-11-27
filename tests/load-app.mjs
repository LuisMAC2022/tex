import { readFile } from "node:fs/promises";
import vm from "node:vm";

/**
 * Los archivos del navegador son scripts clásicos (restricción file://), no
 * módulos ES. Se cargan aquí en un contexto vm, en el mismo orden que
 * index.html, para probarlos sin duplicar el código en otro formato.
 */
export async function loadTexNotes(files = ["block-types.js", "block-tree.js", "outline.js", "latex-generator.js", "file-download.js", "image-options.js", "list-outline.js", "cross-references.js", "references.js"]) {
  const context = vm.createContext({});
  for (const file of files) {
    const url = new URL(`../assets/js/${file}`, import.meta.url);
    vm.runInContext(await readFile(url, "utf8"), context, { filename: file });
  }
  // Los datos creados dentro del vm pertenecen a otro realm y fallarían en
  // deepEqual por prototipo; se clonan al realm de la prueba. Las funciones
  // se pasan por referencia porque structuredClone no las admite.
  function copiar(value) {
    if (typeof value === "function") return value;
    if (Array.isArray(value)) return Array.from(value, copiar);
    if (value && Object.prototype.toString.call(value) === "[object Object]") {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copiar(item)]));
    }
    return structuredClone(value);
  }
  return copiar(context.TexNotes);
}
