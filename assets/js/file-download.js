(function (global) {
  "use strict";
  const TexNotes = global.TexNotes || (global.TexNotes = {});

  function sanitizeFilename(title = "") {
    const stem = String(title).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
    return `${stem || "notas-calculo-3"}.tex`;
  }

  function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function downloadTex(content, title) {
    downloadFile(content, sanitizeFilename(title), "application/x-tex;charset=utf-8");
  }
  function downloadProject(project) {
    downloadFile(JSON.stringify(project, null, 2), sanitizeFilename(project.current.metadata.title).replace(/\.tex$/, ".json"), "application/json");
  }
  Object.assign(TexNotes, { sanitizeFilename, downloadTex, downloadProject });
})(typeof globalThis !== "undefined" ? globalThis : this);
