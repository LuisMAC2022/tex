(function (global) {
  "use strict";
  const TexNotes = global.TexNotes || (global.TexNotes = {});
  const PLACEMENT = "htbp";
  // TeX almacena longitudes de hasta 16383.99999 pt.
  const MAX_HEIGHT_CM = Math.floor(16383.99999 * 2.54 / 72.27 * 100) / 100;

  function imageNumber(value) {
    if (typeof value === "string" && /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())) value = Number(value);
    return Number.isFinite(value) ? value : undefined;
  }

  function boundedImageNumber(value, min, max, fallback) {
    const number = imageNumber(value) ?? fallback;
    return Number(Math.min(max, Math.max(min, number)).toFixed(2)) || 0;
  }

  function normalizeImageOptions(options) {
    const { width, height, angle, align, placement, label } = options && typeof options === "object" && !Array.isArray(options) ? options : {};
    const cm = Number(imageNumber(height)?.toFixed(2));
    const alignment = typeof align === "string" ? align.trim().toLowerCase() : "";
    const positions = typeof placement === "string" ? placement.trim().toLowerCase() : "";
    const key = TexNotes.normalizeLabel(label, "fig");
    return {
      width: boundedImageNumber(width, 0.1, 1, 0.8),
      ...(cm > 0 && cm <= MAX_HEIGHT_CM ? { height: cm } : {}),
      angle: boundedImageNumber(angle, -360, 360, 0),
      align: ["center", "left", "right"].includes(alignment) ? alignment : "center",
      placement: [...PLACEMENT].filter((position) => positions.includes(position)).join("") || PLACEMENT,
      ...(key ? { label: key } : {}),
    };
  }

  function imagePathWarnings(value) {
    const path = typeof value === "string" ? value.trim() : "";
    if (!path) return [];
    const extension = /\.([^./\\]+)$/.exec(path)?.[1] || "";
    const warnings = [];
    if (/\s/.test(path)) warnings.push("La ruta contiene espacios.");
    if (/[\\%#{}]/.test(path)) warnings.push("La ruta contiene caracteres que pueden impedir la compilación en LaTeX.");
    if (extension !== extension.toLowerCase()) warnings.push("La extensión contiene mayúsculas.");
    if (!["png", "jpg", "jpeg", "pdf"].includes(extension.toLowerCase())) {
      warnings.push("pdfLaTeX admite archivos PNG, JPG, JPEG y PDF.");
    }
    return warnings;
  }

  Object.assign(TexNotes, { normalizeImageOptions, imagePathWarnings });
})(typeof globalThis !== "undefined" ? globalThis : this);
