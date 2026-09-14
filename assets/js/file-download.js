(function (global) {
  "use strict";
  const TexNotes = global.TexNotes || (global.TexNotes = {});

  function sanitizeFilename(title = "") {
    const stem = String(title).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
    return `${stem || "notas-calculo-3"}.tex`;
  }

  function downloadTex(content, title) {
    const blob = new Blob([content], { type: "application/x-tex;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = sanitizeFilename(title);
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  Object.assign(TexNotes, { sanitizeFilename, downloadTex });
})(typeof globalThis !== "undefined" ? globalThis : this);
