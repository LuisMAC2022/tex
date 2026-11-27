/** Registro y migración del archivo portátil. No lee el DOM ni el almacenamiento. */
(function (T) {
  "use strict";
  const kind = "notas-latex-config", registry = new Map();
  const object = v => v !== null && typeof v === "object" && !Array.isArray(v);
  function registerConfigPart(part) {
    if (!part.key || !Number.isInteger(part.version) || part.version < 1 || registry.has(part.key) || typeof part.validate !== "function")
      throw Error("Parte de configuración inválida: " + part.key);
    registry.set(part.key, part);
  }
  function buildConfig(values = {}) {
    const parts = {};
    for (const [key, part] of registry) {
      const value = Object.hasOwn(values, key) ? values[key] : part.defaults();
      parts[key] = { version: part.version, value: JSON.parse(JSON.stringify(value)) };
    }
    return { kind, version: 2, parts };
  }
  function validateConfig(data) {
    const result = { errors: [], warnings: [], values: {}, data: { kind, version: 2, parts: {} } };
    if (!object(data) || data.kind !== kind || ![1, 2].includes(data.version) || (data.version === 2 && !object(data.parts))) {
      result.errors.push("El archivo no es una configuración compatible."); return result;
    }
    const entries = data.version === 1 ? Object.entries(data).filter(([key]) => key !== "kind" && key !== "version")
      .map(([key, value]) => [key, { version: 1, value }]) : Object.entries(data.parts);
    for (const [key, entry] of entries) {
      const part = registry.get(key);
      if (!part) { result.warnings.push("Parte desconocida que se omitió: " + key + "."); continue; }
      if (!object(entry) || !Object.hasOwn(entry, "value") || !Number.isInteger(entry.version) || entry.version < 1 ||
          entry.version > part.version || (entry.version < part.version && !part.migrate)) {
        result.errors.push(key + ": versión o valor incompatible."); continue;
      }
      let value = entry.value;
      try {
        if (entry.version < part.version) value = part.migrate(value, entry.version);
        const errors = part.validate(value);
        if (errors.length) { result.errors.push(...errors.map(e => key + ": " + e)); continue; }
        result.values[key] = value; result.data.parts[key] = { version: part.version, value };
      } catch { result.errors.push(key + ": valor inválido."); }
    }
    return result;
  }
  function migrateConfig(data) {
    const result = validateConfig(data);
    if (result.errors.length) throw Error(result.errors.join(" "));
    return result.data;
  }
  function list(check) {
    return items => {
      if (!Array.isArray(items)) return ["Se esperaba una lista."];
      const seen = [], errors = [];
      items.forEach((item, index) => {
        if (!object(item)) { errors.push("[" + index + "] debe ser un objeto."); return; }
        const issues = check(item, seen);
        if (issues.length) errors.push(...issues.map(msg => "[" + index + "] " + msg)); else seen.push(item);
      });
      return errors;
    };
  }
  registerConfigPart({ key: "aliases", version: 1, defaults: () => T.DEFAULT_ALIASES, validate: list((a, seen) => T.validateAlias(a, seen)) });
  registerConfigPart({ key: "templates", version: 1, defaults: () => [], validate: list((v, seen) => T.validateTemplate(v, [...T.BUILTIN_TEMPLATES, ...seen])) });
  registerConfigPart({ key: "macros", version: 1, defaults: () => [], validate: list((v, seen) => T.validateMacro(v, seen)) });
  registerConfigPart({ key: "references", version: 1, defaults: () => T.COURSE_REFERENCES, validate: list((v, seen) =>
    Object.entries(T.validateReference(v, seen)).map(([field, error]) => field + ": " + error)) });
  registerConfigPart({ key: "prefs", version: 1, defaults: () => ({ autoPair: true, vibration: true }), validate: v => {
    if (!object(v)) return ["Se esperaba un objeto."];
    const errors = [];
    if (typeof v.autoPair !== "boolean") errors.push("autoPair debe ser verdadero o falso.");
    if (v.vibration !== undefined && typeof v.vibration !== "boolean") errors.push("vibration debe ser verdadero o falso.");
    return errors;
  } });
  Object.assign(T, { registerConfigPart, buildConfig, validateConfig, migrateConfig,
    validateConfiguration: data => validateConfig(data).errors });
})(globalThis.TexNotes);
