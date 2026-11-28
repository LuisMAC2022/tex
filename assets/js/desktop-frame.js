(function (doc, win) {
  "use strict";
  const desktop = win.matchMedia("(min-width: 64rem) and (pointer: fine)");
  const $ = selector => doc.querySelector(selector);
  const header = $(".site-header");
  const tools = $(".workspace-tools");
  const sessionStatus = $("#session-status");
  const recovery = $("#autosave-banner");
  const contentField = $("#block-content").closest(".field");
  const status = $("#app-status");
  const noteTitle = $("#note-title");
  const modeButtons = [$("#focus-writing"), $("#toggle-structure"), $("#review-writing")];
  const navigationButtons = [$("#workspace-write"), $("#workspace-document"), $("#workspace-export")];
  const buttons = [...modeButtons, ...navigationButtons];
  const toolsPosition = doc.createComment("posición de los controles de escritura");
  const sessionPosition = doc.createComment("posición del estado de la sesión");
  const recoveryPosition = doc.createComment("posición del aviso de recuperación");
  const identity = doc.createElement("div");
  const title = doc.createElement("strong");
  const modes = doc.createElement("div");
  const navigation = doc.createElement("nav");
  identity.className = "workspace-identity";
  identity.append(title);
  modes.className = "workspace-modes";
  modes.setAttribute("role", "group");
  modes.setAttribute("aria-label", "Modos de escritura");
  navigation.setAttribute("role", "tablist");
  navigation.className = "workspace-navigation";
  navigation.setAttribute("aria-label", "Navegación del documento");
  let timer;

  function showTitle() {
    title.textContent = noteTitle.value.trim() || "Sin título";
    title.title = title.textContent;
  }

  function showStatus() {
    status.classList.add("toast-visible");
    win.clearTimeout(timer);
    timer = win.setTimeout(() => status.classList.remove("toast-visible"), desktop.matches ? 4000 : 3000);
  }

  // El resumen de Datos se actualiza también al abrir, importar o recuperar una nota.
  const titleObserver = new MutationObserver(showTitle);
  const statusObserver = new MutationObserver(showStatus);

  function syncFrame() {
    const focused = doc.activeElement;
    if (desktop.matches) {
      tools.before(toolsPosition);
      sessionStatus.before(sessionPosition);
      recovery.before(recoveryPosition);
      contentField.after(recovery);
      identity.append(sessionStatus);
      modes.append(...modeButtons);
      navigation.append(...navigationButtons);
      for (const button of navigationButtons) button.classList.add("tertiary");
      tools.append(identity, modes, navigation);
      header.append(tools);
      showTitle();
      showStatus();
      titleObserver.observe($("#datos-heading"), { childList: true });

    } else if (toolsPosition.isConnected) {
      titleObserver.disconnect();
      win.clearTimeout(timer);
      status.classList.remove("toast-visible");
      for (const button of navigationButtons) button.classList.remove("tertiary");
      tools.replaceChildren(...buttons);
      toolsPosition.replaceWith(tools);
      sessionPosition.replaceWith(sessionStatus);
      recoveryPosition.replaceWith(recovery);
    }
    if (buttons.includes(focused) || recovery.contains(focused)) focused.focus({ preventScroll: true });
  }

  statusObserver.observe(status, { childList: true, characterData: true, subtree: true });
  desktop.addEventListener("change", syncFrame);
  syncFrame();
  if (!desktop.matches) showStatus();
})(document, window);
