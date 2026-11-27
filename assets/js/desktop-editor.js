(function (doc, win) {
  "use strict";
  const desktop = win.matchMedia("(min-width: 64rem) and (pointer: fine)");
  const $ = selector => doc.querySelector(selector);
  const target = $("#block-target"), targetPosition = target.parentElement;
  const legend = $(".block-heading-row");
  const contentHeading = $(".content-heading"), listLimit = $("#list-limit");
  const listHelp = [$("#list-help"), $("#legacy-list-help")];
  const details = doc.createElement("details");
  const summary = doc.createElement("summary");
  const shortcut = $("#add-block-key"), shortcutLabel = $("#commit-key-label");
  details.className = "field-help";
  summary.textContent = "Ayuda de la lista";
  details.append(summary);

  function syncListHelp() {
    details.hidden = listHelp.every(help => help.hidden);
    if (details.hidden) details.open = false;
  }

  const helpObserver = new MutationObserver(syncListHelp);

  function syncEditor() {
    if (desktop.matches) {
      legend.append(target);
      targetPosition.hidden = true;
      details.append(...listHelp);
      syncListHelp();
      contentHeading.append(details);
      for (const help of listHelp) {
        helpObserver.observe(help, { attributes: true, attributeFilter: ["hidden"] });
      }
      shortcut.textContent = shortcutLabel.textContent;
      shortcut.hidden = false;
    } else if (details.isConnected) {
      const restoreFocus = details.contains(doc.activeElement);
      helpObserver.disconnect();
      targetPosition.append(target);
      targetPosition.hidden = false;
      listLimit.before(...listHelp);
      details.remove();
      details.open = false;
      shortcut.hidden = true;
      if (restoreFocus) $("#block-content").focus({ preventScroll: true });
    }
  }

  desktop.addEventListener("change", syncEditor);
  syncEditor();
})(document, window);
