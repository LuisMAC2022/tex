/**
 * Catálogo de símbolos compatible exclusivamente con amsmath + amssymb.
 * `insert: { before, after }` permite envolver una selección o situar el cursor
 * entre ambas partes. Sin `insert`, se inserta `command` como antes. Las mayúsculas
 * griegas idénticas a letras latinas se omiten porque no tienen comando propio;
 * ómicron minúscula se representa correctamente con la letra `o`.
 */
(function (global) {
  "use strict";
  const TexNotes = global.TexNotes || (global.TexNotes = {});


  const MATH_SYMBOL_GROUPS = [
    { id: 'greek-lower', label: 'Griegas minúsculas' },
    { id: 'greek-upper', label: 'Griegas mayúsculas' },
    { id: 'logic', label: 'Lógica' },
    { id: 'sets', label: 'Cuantificadores y conjuntos' },
    { id: 'relations', label: 'Relaciones y orden' },
    { id: 'topology', label: 'Topología' },
    { id: 'functions', label: 'Funciones y límites' },
    { id: 'derivatives', label: 'Derivadas y gradiente' },
    { id: 'integrals', label: 'Integrales y sumas' },
    { id: 'operators', label: 'Operadores y aritmética' },
    { id: 'vectors', label: 'Vectores y matrices' },
    { id: 'structure', label: 'Estructura y texto' },
  ];

  const MATH_SYMBOLS = [
    { id: 'alpha', group: 'greek-lower', symbol: 'α', command: '\\alpha', name: 'alfa', keywords: ['alfa', 'matematica', 'greek-lower'] },
    { id: 'beta', group: 'greek-lower', symbol: 'β', command: '\\beta', name: 'beta', keywords: ['beta', 'matematica', 'greek-lower'] },
    { id: 'gamma', group: 'greek-lower', symbol: 'γ', command: '\\gamma', name: 'gamma', keywords: ['gamma', 'matematica', 'greek-lower'] },
    { id: 'delta', group: 'greek-lower', symbol: 'δ', command: '\\delta', name: 'delta', keywords: ['delta', 'matematica', 'greek-lower'] },
    { id: 'epsilon', group: 'greek-lower', symbol: 'ϵ', command: '\\epsilon', name: 'épsilon lunar', keywords: ['épsilon lunar', 'matematica', 'greek-lower'] },
    { id: 'varepsilon', group: 'greek-lower', symbol: 'ε', command: '\\varepsilon', name: 'épsilon variante para definiciones épsilon delta', keywords: ['épsilon variante para definiciones épsilon delta', 'matematica', 'greek-lower'] },
    { id: 'zeta', group: 'greek-lower', symbol: 'ζ', command: '\\zeta', name: 'zeta', keywords: ['zeta', 'matematica', 'greek-lower'] },
    { id: 'eta', group: 'greek-lower', symbol: 'η', command: '\\eta', name: 'eta', keywords: ['eta', 'matematica', 'greek-lower'] },
    { id: 'theta', group: 'greek-lower', symbol: 'θ', command: '\\theta', name: 'theta', keywords: ['theta', 'matematica', 'greek-lower'] },
    { id: 'vartheta', group: 'greek-lower', symbol: 'ϑ', command: '\\vartheta', name: 'theta variante', keywords: ['theta variante', 'matematica', 'greek-lower'] },
    { id: 'iota', group: 'greek-lower', symbol: 'ι', command: '\\iota', name: 'iota', keywords: ['iota', 'matematica', 'greek-lower'] },
    { id: 'kappa', group: 'greek-lower', symbol: 'κ', command: '\\kappa', name: 'kappa', keywords: ['kappa', 'matematica', 'greek-lower'] },
    { id: 'varkappa', group: 'greek-lower', symbol: 'ϰ', command: '\\varkappa', name: 'kappa variante', keywords: ['kappa variante', 'matematica', 'greek-lower'] },
    { id: 'lambda', group: 'greek-lower', symbol: 'λ', command: '\\lambda', name: 'lambda', keywords: ['lambda', 'matematica', 'greek-lower'] },
    { id: 'mu', group: 'greek-lower', symbol: 'μ', command: '\\mu', name: 'mu', keywords: ['mu', 'matematica', 'greek-lower'] },
    { id: 'nu', group: 'greek-lower', symbol: 'ν', command: '\\nu', name: 'nu', keywords: ['nu', 'matematica', 'greek-lower'] },
    { id: 'xi', group: 'greek-lower', symbol: 'ξ', command: '\\xi', name: 'xi', keywords: ['xi', 'matematica', 'greek-lower'] },
    { id: 'omicron', group: 'greek-lower', symbol: 'ο', command: 'o', name: 'ómicron (letra latina o en LaTeX)', keywords: ['ómicron (letra latina o en LaTeX)', 'matematica', 'greek-lower'] },
    { id: 'pi', group: 'greek-lower', symbol: 'π', command: '\\pi', name: 'pi', keywords: ['pi', 'matematica', 'greek-lower'] },
    { id: 'varpi', group: 'greek-lower', symbol: 'ϖ', command: '\\varpi', name: 'pi variante', keywords: ['pi variante', 'matematica', 'greek-lower'] },
    { id: 'rho', group: 'greek-lower', symbol: 'ρ', command: '\\rho', name: 'rho', keywords: ['rho', 'matematica', 'greek-lower'] },
    { id: 'varrho', group: 'greek-lower', symbol: 'ϱ', command: '\\varrho', name: 'rho variante', keywords: ['rho variante', 'matematica', 'greek-lower'] },
    { id: 'sigma', group: 'greek-lower', symbol: 'σ', command: '\\sigma', name: 'sigma', keywords: ['sigma', 'matematica', 'greek-lower'] },
    { id: 'varsigma', group: 'greek-lower', symbol: 'ς', command: '\\varsigma', name: 'sigma final variante', keywords: ['sigma final variante', 'matematica', 'greek-lower'] },
    { id: 'tau', group: 'greek-lower', symbol: 'τ', command: '\\tau', name: 'tau', keywords: ['tau', 'matematica', 'greek-lower'] },
    { id: 'upsilon', group: 'greek-lower', symbol: 'υ', command: '\\upsilon', name: 'upsilon', keywords: ['upsilon', 'matematica', 'greek-lower'] },
    { id: 'phi', group: 'greek-lower', symbol: 'ϕ', command: '\\phi', name: 'fi', keywords: ['fi', 'matematica', 'greek-lower'] },
    { id: 'varphi', group: 'greek-lower', symbol: 'φ', command: '\\varphi', name: 'fi variante', keywords: ['fi variante', 'matematica', 'greek-lower'] },
    { id: 'chi', group: 'greek-lower', symbol: 'χ', command: '\\chi', name: 'chi', keywords: ['chi', 'matematica', 'greek-lower'] },
    { id: 'psi', group: 'greek-lower', symbol: 'ψ', command: '\\psi', name: 'psi', keywords: ['psi', 'matematica', 'greek-lower'] },
    { id: 'omega', group: 'greek-lower', symbol: 'ω', command: '\\omega', name: 'omega', keywords: ['omega', 'matematica', 'greek-lower'] },
    { id: 'gamma-upper', group: 'greek-upper', symbol: 'Γ', command: '\\Gamma', name: 'gamma mayúscula', keywords: ['gamma mayúscula', 'matematica', 'greek-upper'] },
    { id: 'delta-upper', group: 'greek-upper', symbol: 'Δ', command: '\\Delta', name: 'delta mayúscula', keywords: ['delta mayúscula', 'matematica', 'greek-upper'] },
    { id: 'theta-upper', group: 'greek-upper', symbol: 'Θ', command: '\\Theta', name: 'theta mayúscula', keywords: ['theta mayúscula', 'matematica', 'greek-upper'] },
    { id: 'lambda-upper', group: 'greek-upper', symbol: 'Λ', command: '\\Lambda', name: 'lambda mayúscula', keywords: ['lambda mayúscula', 'matematica', 'greek-upper'] },
    { id: 'xi-upper', group: 'greek-upper', symbol: 'Ξ', command: '\\Xi', name: 'xi mayúscula', keywords: ['xi mayúscula', 'matematica', 'greek-upper'] },
    { id: 'pi-upper', group: 'greek-upper', symbol: 'Π', command: '\\Pi', name: 'pi mayúscula', keywords: ['pi mayúscula', 'matematica', 'greek-upper'] },
    { id: 'sigma-upper', group: 'greek-upper', symbol: 'Σ', command: '\\Sigma', name: 'sigma mayúscula', keywords: ['sigma mayúscula', 'matematica', 'greek-upper'] },
    { id: 'upsilon-upper', group: 'greek-upper', symbol: 'Υ', command: '\\Upsilon', name: 'upsilon mayúscula', keywords: ['upsilon mayúscula', 'matematica', 'greek-upper'] },
    { id: 'phi-upper', group: 'greek-upper', symbol: 'Φ', command: '\\Phi', name: 'fi mayúscula', keywords: ['fi mayúscula', 'matematica', 'greek-upper'] },
    { id: 'psi-upper', group: 'greek-upper', symbol: 'Ψ', command: '\\Psi', name: 'psi mayúscula', keywords: ['psi mayúscula', 'matematica', 'greek-upper'] },
    { id: 'omega-upper', group: 'greek-upper', symbol: 'Ω', command: '\\Omega', name: 'omega mayúscula', keywords: ['omega mayúscula', 'matematica', 'greek-upper'] },
    { id: 'logic-0', group: 'logic', symbol: '¬', command: '\\neg', name: 'negación', keywords: ['negación', 'matematica', 'logic'] },
    { id: 'logic-1', group: 'logic', symbol: '∧', command: '\\land', name: 'conjunción y', keywords: ['conjunción y', 'matematica', 'logic'] },
    { id: 'logic-2', group: 'logic', symbol: '∨', command: '\\lor', name: 'disyunción o', keywords: ['disyunción o', 'matematica', 'logic'] },
    { id: 'logic-3', group: 'logic', symbol: '⇒', command: '\\Rightarrow', name: 'implicación implica', keywords: ['implicación implica', 'matematica', 'logic'] },
    { id: 'logic-4', group: 'logic', symbol: '⇐', command: '\\Leftarrow', name: 'implicación inversa', keywords: ['implicación inversa', 'matematica', 'logic'] },
    { id: 'logic-5', group: 'logic', symbol: '⇔', command: '\\Leftrightarrow', name: 'doble implicación si y solo si', keywords: ['doble implicación si y solo si', 'matematica', 'logic'] },
    { id: 'logic-6', group: 'logic', symbol: '≡', command: '\\equiv', name: 'equivalencia', keywords: ['equivalencia', 'matematica', 'logic'] },
    { id: 'logic-7', group: 'logic', symbol: '∴', command: '\\therefore', name: 'por lo tanto', keywords: ['por lo tanto', 'matematica', 'logic'] },
    { id: 'logic-8', group: 'logic', symbol: '∵', command: '\\because', name: 'porque', keywords: ['porque', 'matematica', 'logic'] },
    { id: 'logic-9', group: 'logic', symbol: '⊢', command: '\\vdash', name: 'demostrable', keywords: ['demostrable', 'matematica', 'logic'] },
    { id: 'logic-10', group: 'logic', symbol: '⊨', command: '\\models', name: 'satisface modelo', keywords: ['satisface modelo', 'matematica', 'logic'] },
    { id: 'logic-11', group: 'logic', symbol: '⊤', command: '\\top', name: 'verdadero', keywords: ['verdadero', 'matematica', 'logic'] },
    { id: 'logic-12', group: 'logic', symbol: '⊥', command: '\\bot', name: 'falso', keywords: ['falso', 'matematica', 'logic'] },
    { id: 'forall', group: 'sets', symbol: '∀', command: '\\forall', name: 'cuantificador universal para todo', keywords: ['cuantificador universal para todo', 'matematica', 'sets'] },
    { id: 'exists', group: 'sets', symbol: '∃', command: '\\exists', name: 'cuantificador existencial existe', keywords: ['cuantificador existencial existe', 'matematica', 'sets'] },
    { id: 'set-2', group: 'sets', symbol: '∄', command: '\\nexists', name: 'no existe', keywords: ['no existe', 'matematica', 'sets'] },
    { id: 'set-3', group: 'sets', symbol: '∈', command: '\\in', name: 'pertenece', keywords: ['pertenece', 'matematica', 'sets'] },
    { id: 'set-4', group: 'sets', symbol: '∉', command: '\\notin', name: 'no pertenece', keywords: ['no pertenece', 'matematica', 'sets'] },
    { id: 'set-5', group: 'sets', symbol: '∋', command: '\\ni', name: 'contiene como elemento', keywords: ['contiene como elemento', 'matematica', 'sets'] },
    { id: 'set-6', group: 'sets', symbol: '⊂', command: '\\subset', name: 'subconjunto propio', keywords: ['subconjunto propio', 'matematica', 'sets'] },
    { id: 'set-7', group: 'sets', symbol: '⊆', command: '\\subseteq', name: 'subconjunto', keywords: ['subconjunto', 'matematica', 'sets'] },
    { id: 'set-8', group: 'sets', symbol: '⊊', command: '\\subsetneq', name: 'subconjunto propio estricto', keywords: ['subconjunto propio estricto', 'matematica', 'sets'] },
    { id: 'set-9', group: 'sets', symbol: '⊃', command: '\\supset', name: 'superconjunto', keywords: ['superconjunto', 'matematica', 'sets'] },
    { id: 'set-10', group: 'sets', symbol: '⊇', command: '\\supseteq', name: 'superconjunto o igual', keywords: ['superconjunto o igual', 'matematica', 'sets'] },
    { id: 'set-11', group: 'sets', symbol: '∪', command: '\\cup', name: 'unión', keywords: ['unión', 'matematica', 'sets'] },
    { id: 'set-12', group: 'sets', symbol: '∩', command: '\\cap', name: 'intersección', keywords: ['intersección', 'matematica', 'sets'] },
    { id: 'set-13', group: 'sets', symbol: '∖', command: '\\setminus', name: 'diferencia de conjuntos', keywords: ['diferencia de conjuntos', 'matematica', 'sets'] },
    { id: 'set-14', group: 'sets', symbol: '△', command: '\\triangle', name: 'diferencia simétrica', keywords: ['diferencia simétrica', 'matematica', 'sets'] },
    { id: 'set-15', group: 'sets', symbol: '∅', command: '\\emptyset', name: 'conjunto vacío', keywords: ['conjunto vacío', 'matematica', 'sets'] },
    { id: 'set-16', group: 'sets', symbol: '∅', command: '\\varnothing', name: 'vacío variante', keywords: ['vacío variante', 'matematica', 'sets'] },
    { id: 'set-17', group: 'sets', symbol: '∁', command: '\\complement', name: 'complemento', keywords: ['complemento', 'matematica', 'sets'] },
    { id: 'set-18', group: 'sets', symbol: '×', command: '\\times', name: 'producto cartesiano', keywords: ['producto cartesiano', 'matematica', 'sets'] },
    { id: 'set-19', group: 'sets', symbol: '𝒫', command: '\\mathcal{P}', name: 'conjunto potencia partes', keywords: ['conjunto potencia partes', 'matematica', 'sets'] },
    { id: 'set-20', group: 'sets', symbol: '⋃', command: '\\bigcup', name: 'unión grande', keywords: ['unión grande', 'matematica', 'sets'] },
    { id: 'set-21', group: 'sets', symbol: '⋂', command: '\\bigcap', name: 'intersección grande', keywords: ['intersección grande', 'matematica', 'sets'] },
    { id: 'set-22', group: 'sets', symbol: 'Ā', command: '\\overline{A}', name: 'clausura complemento de A', keywords: ['clausura complemento de A', 'matematica', 'sets'] },
    { id: 'set-23', group: 'sets', symbol: 'ℕ', command: '\\mathbb{N}', name: 'números naturales', keywords: ['números naturales', 'matematica', 'sets'] },
    { id: 'set-24', group: 'sets', symbol: 'ℤ', command: '\\mathbb{Z}', name: 'números enteros', keywords: ['números enteros', 'matematica', 'sets'] },
    { id: 'set-25', group: 'sets', symbol: 'ℚ', command: '\\mathbb{Q}', name: 'números racionales', keywords: ['números racionales', 'matematica', 'sets'] },
    { id: 'set-26', group: 'sets', symbol: 'ℝ', command: '\\mathbb{R}', name: 'números reales', keywords: ['números reales', 'matematica', 'sets'] },
    { id: 'set-27', group: 'sets', symbol: 'ℂ', command: '\\mathbb{C}', name: 'números complejos', keywords: ['números complejos', 'matematica', 'sets'] },
    { id: 'set-builder', group: 'sets', symbol: '{…}', command: '\\{\\,x \\mid P(x)\\,\\}', name: 'conjunto por comprensión', keywords: ['conjunto', 'tal que'], insert: { before: '\\{\\,', after: ' \\mid P(x)\\,\\}' } },
    { id: 'interval-open', group: 'sets', symbol: '(a,b)', command: '(a,b)', name: 'intervalo abierto', keywords: ['intervalo abierto', 'matematica', 'sets'] },
    { id: 'interval-closed', group: 'sets', symbol: '[a,b]', command: '[a,b]', name: 'intervalo cerrado', keywords: ['intervalo cerrado', 'matematica', 'sets'] },
    { id: 'interval-left', group: 'sets', symbol: '[a,b)', command: '[a,b)', name: 'intervalo semiabierto', keywords: ['intervalo semiabierto', 'matematica', 'sets'] },
    { id: 'interval-right', group: 'sets', symbol: '(a,b]', command: '(a,b]', name: 'intervalo semiabierto', keywords: ['intervalo semiabierto', 'matematica', 'sets'] },
    { id: 'rel-0', group: 'relations', symbol: '=', command: '=', name: 'igual', keywords: ['igual', 'matematica', 'relations'] },
    { id: 'rel-1', group: 'relations', symbol: '≠', command: '\\neq', name: 'distinto no igual', keywords: ['distinto no igual', 'matematica', 'relations'] },
    { id: 'rel-2', group: 'relations', symbol: '≈', command: '\\approx', name: 'aproximadamente', keywords: ['aproximadamente', 'matematica', 'relations'] },
    { id: 'rel-3', group: 'relations', symbol: '≃', command: '\\simeq', name: 'similar asintótico', keywords: ['similar asintótico', 'matematica', 'relations'] },
    { id: 'rel-4', group: 'relations', symbol: '≅', command: '\\cong', name: 'congruente isomorfo', keywords: ['congruente isomorfo', 'matematica', 'relations'] },
    { id: 'rel-5', group: 'relations', symbol: '∼', command: '\\sim', name: 'semejante', keywords: ['semejante', 'matematica', 'relations'] },
    { id: 'rel-6', group: 'relations', symbol: '<', command: '<', name: 'menor que', keywords: ['menor que', 'matematica', 'relations'] },
    { id: 'rel-7', group: 'relations', symbol: '>', command: '>', name: 'mayor que', keywords: ['mayor que', 'matematica', 'relations'] },
    { id: 'rel-8', group: 'relations', symbol: '≤', command: '\\leq', name: 'menor o igual', keywords: ['menor o igual', 'matematica', 'relations'] },
    { id: 'rel-9', group: 'relations', symbol: '≥', command: '\\geq', name: 'mayor o igual', keywords: ['mayor o igual', 'matematica', 'relations'] },
    { id: 'rel-10', group: 'relations', symbol: '≪', command: '\\ll', name: 'mucho menor', keywords: ['mucho menor', 'matematica', 'relations'] },
    { id: 'rel-11', group: 'relations', symbol: '≫', command: '\\gg', name: 'mucho mayor', keywords: ['mucho mayor', 'matematica', 'relations'] },
    { id: 'rel-13', group: 'relations', symbol: '≼', command: '\\preceq', name: 'precede o igual', keywords: ['precede o igual', 'matematica', 'relations'] },
    { id: 'rel-16', group: 'relations', symbol: '∝', command: '\\propto', name: 'proporcional', keywords: ['proporcional', 'matematica', 'relations'] },
    { id: 'rel-19', group: 'relations', symbol: 'sup', command: '\\sup', name: 'supremo', keywords: ['supremo', 'matematica', 'relations'] },
    { id: 'rel-20', group: 'relations', symbol: 'inf', command: '\\inf', name: 'ínfimo', keywords: ['ínfimo', 'matematica', 'relations'] },
    { id: 'rel-21', group: 'relations', symbol: 'max', command: '\\max', name: 'máximo', keywords: ['máximo', 'matematica', 'relations'] },
    { id: 'rel-22', group: 'relations', symbol: 'min', command: '\\min', name: 'mínimo', keywords: ['mínimo', 'matematica', 'relations'] },
    { id: 'top-0', group: 'topology', symbol: '‖·‖', command: '\\lVert \\cdot \\rVert', name: 'norma', keywords: ['norma', 'matematica', 'topology'] },
    { id: 'top-1', group: 'topology', symbol: '|·|', command: '\\lvert \\cdot \\rvert', name: 'valor absoluto', keywords: ['valor absoluto', 'matematica', 'topology'] },
    { id: 'top-2', group: 'topology', symbol: '∂', command: '\\partial', name: 'frontera parcial', keywords: ['frontera parcial', 'matematica', 'topology'] },
    { id: 'top-3', group: 'topology', symbol: 'Ā', command: '\\overline{A}', name: 'adherencia clausura', keywords: ['adherencia clausura', 'matematica', 'topology'] },
    { id: 'top-4', group: 'topology', symbol: 'A°', command: 'A^{\\circ}', name: 'interior de A', keywords: ['interior de A', 'matematica', 'topology'] },
    { id: 'top-5', group: 'topology', symbol: 'int', command: '\\operatorname{int}', name: 'interior operador', keywords: ['interior operador', 'matematica', 'topology'] },
    { id: 'top-6', group: 'topology', symbol: 'ext', command: '\\operatorname{ext}', name: 'exterior operador', keywords: ['exterior operador', 'matematica', 'topology'] },
    { id: 'top-7', group: 'topology', symbol: 'Fr', command: '\\operatorname{Fr}', name: 'frontera operador', keywords: ['frontera operador', 'matematica', 'topology'] },
    { id: 'top-8', group: 'topology', symbol: 'diam', command: '\\operatorname{diam}', name: 'diámetro', keywords: ['diámetro', 'matematica', 'topology'] },
    { id: 'top-9', group: 'topology', symbol: '∞', command: '\\infty', name: 'infinito', keywords: ['infinito', 'matematica', 'topology'] },
    { id: 'top-10', group: 'topology', symbol: 'B(x,r)', command: 'B(\\mathbf{x}, r)', name: 'bola abierta', keywords: ['bola abierta', 'matematica', 'topology'] },
    { id: 'top-11', group: 'topology', symbol: 'd(x,y)', command: 'd(x,y)', name: 'distancia', keywords: ['distancia', 'matematica', 'topology'] },
    { id: 'top-13', group: 'topology', symbol: 'ε', command: '\\varepsilon', name: 'radio épsilon', keywords: ['radio épsilon', 'matematica', 'topology'] },
    { id: 'top-14', group: 'topology', symbol: 'δ', command: '\\delta', name: 'radio delta', keywords: ['radio delta', 'matematica', 'topology'] },
    { id: 'fun-0', group: 'functions', symbol: '→', command: '\\to', name: 'tiende a función', keywords: ['tiende a función', 'matematica', 'functions'] },
    { id: 'fun-1', group: 'functions', symbol: '↦', command: '\\mapsto', name: 'se asigna a', keywords: ['se asigna a', 'matematica', 'functions'] },
    { id: 'fun-2', group: 'functions', symbol: '∘', command: '\\circ', name: 'composición', keywords: ['composición', 'matematica', 'functions'] },
    { id: 'fun-3', group: 'functions', symbol: 'f⁻¹', command: 'f^{-1}', name: 'función inversa', keywords: ['función inversa', 'matematica', 'functions'] },
    { id: 'fun-4', group: 'functions', symbol: 'lim', command: '\\lim', name: 'límite', keywords: ['límite', 'matematica', 'functions'] },
    { id: 'fun-5', group: 'functions', symbol: 'lim x→a', command: '\\lim_{x \\to a}', name: 'límite cuando x tiende a a', keywords: ['límite cuando x tiende a a', 'matematica', 'functions'] },
    { id: 'fun-6', group: 'functions', symbol: 'dom', command: '\\operatorname{dom}', name: 'dominio', keywords: ['dominio', 'matematica', 'functions'] },
    { id: 'fun-7', group: 'functions', symbol: 'im', command: '\\operatorname{im}', name: 'imagen', keywords: ['imagen', 'matematica', 'functions'] },
    { id: 'fun-8', group: 'functions', symbol: ':', command: '\\colon', name: 'dos puntos función', keywords: ['dos puntos función', 'matematica', 'functions'] },
    { id: 'fun-9', group: 'functions', symbol: '↗', command: '\\nearrow', name: 'creciente', keywords: ['creciente', 'matematica', 'functions'] },
    { id: 'fun-11', group: 'functions', symbol: '↪', command: '\\hookrightarrow', name: 'inyección', keywords: ['inyección', 'matematica', 'functions'] },
    { id: 'fun-12', group: 'functions', symbol: '↠', command: '\\twoheadrightarrow', name: 'sobreyectiva', keywords: ['sobreyectiva', 'matematica', 'functions'] },
    { id: 'fun-14', group: 'functions', symbol: 'o', command: '\\circ', name: 'composición de funciones', keywords: ['composición de funciones', 'matematica', 'functions'] },
    { id: 'der-0', group: 'derivatives', symbol: '∂', command: '\\partial', name: 'derivada parcial', keywords: ['derivada parcial', 'matematica', 'derivatives'] },
    { id: 'der-1', group: 'derivatives', symbol: '∂f/∂x', command: '\\frac{\\partial f}{\\partial x}', name: 'derivada parcial de f respecto x', keywords: ['derivada parcial de f respecto x', 'matematica', 'derivatives'] },
    { id: 'der-2', group: 'derivatives', symbol: '∇', command: '\\nabla', name: 'gradiente nabla', keywords: ['gradiente nabla', 'matematica', 'derivatives'] },
    { id: 'der-3', group: 'derivatives', symbol: 'Δ', command: '\\Delta', name: 'laplaciano', keywords: ['laplaciano', 'matematica', 'derivatives'] },
    { id: 'der-4', group: 'derivatives', symbol: 'd', command: '\\mathrm{d}', name: 'diferencial', keywords: ['diferencial', 'matematica', 'derivatives'] },
    { id: 'der-5', group: 'derivatives', symbol: 'Dᵤf', command: 'D_{\\mathbf{u}}f', name: 'derivada direccional', keywords: ['derivada direccional', 'matematica', 'derivatives'] },
    { id: 'der-6', group: 'derivatives', symbol: 'Hf', command: 'H_f', name: 'hessiano', keywords: ['hessiano', 'matematica', 'derivatives'] },
    { id: 'der-7', group: 'derivatives', symbol: 'f′', command: "f'", name: 'derivada prima', keywords: ['derivada prima', 'matematica', 'derivatives'] },
    { id: 'der-8', group: 'derivatives', symbol: 'f″', command: "f''", name: 'segunda derivada', keywords: ['segunda derivada', 'matematica', 'derivatives'] },
    { id: 'der-9', group: 'derivatives', symbol: 'df/dx', command: '\\frac{df}{dx}', name: 'derivada ordinaria', keywords: ['derivada ordinaria', 'matematica', 'derivatives'] },
    { id: 'der-10', group: 'derivatives', symbol: 'd²f/dx²', command: '\\frac{d^2f}{dx^2}', name: 'segunda derivada', keywords: ['segunda derivada', 'matematica', 'derivatives'] },
    { id: 'der-11', group: 'derivatives', symbol: '∂²f', command: '\\frac{\\partial^2 f}{\\partial x^2}', name: 'segunda parcial', keywords: ['segunda parcial', 'matematica', 'derivatives'] },
    { id: 'der-12', group: 'derivatives', symbol: '∂²f/∂x∂y', command: '\\frac{\\partial^2 f}{\\partial x\\partial y}', name: 'parcial mixta', keywords: ['parcial mixta', 'matematica', 'derivatives'] },
    { id: 'int-0', group: 'integrals', symbol: '∫', command: '\\int', name: 'integral', keywords: ['integral', 'matematica', 'integrals'] },
    { id: 'int-1', group: 'integrals', symbol: '∬', command: '\\iint', name: 'integral doble', keywords: ['integral doble', 'matematica', 'integrals'] },
    { id: 'int-2', group: 'integrals', symbol: '∭', command: '\\iiint', name: 'integral triple', keywords: ['integral triple', 'matematica', 'integrals'] },
    { id: 'int-3', group: 'integrals', symbol: '∮', command: '\\oint', name: 'integral de contorno', keywords: ['integral de contorno', 'matematica', 'integrals'] },
    { id: 'int-4', group: 'integrals', symbol: '∑', command: '\\sum', name: 'sumatoria', keywords: ['sumatoria', 'matematica', 'integrals'] },
    { id: 'int-5', group: 'integrals', symbol: '∏', command: '\\prod', name: 'productoria', keywords: ['productoria', 'matematica', 'integrals'] },
    { id: 'int-6', group: 'integrals', symbol: '∫ₐᵇ', command: '\\int_a^b', name: 'integral con límites', keywords: ['integral con límites', 'matematica', 'integrals'] },
    { id: 'int-7', group: 'integrals', symbol: 'Σᵢ₌₁ⁿ', command: '\\sum_{i=1}^n', name: 'suma con límites', keywords: ['suma con límites', 'matematica', 'integrals'] },
    { id: 'int-8', group: 'integrals', symbol: 'Πᵢ₌₁ⁿ', command: '\\prod_{i=1}^n', name: 'producto con límites', keywords: ['producto con límites', 'matematica', 'integrals'] },
    { id: 'int-9', group: 'integrals', symbol: 'dx', command: '\\,dx', name: 'diferencial dx', keywords: ['diferencial dx', 'matematica', 'integrals'] },
    { id: 'int-10', group: 'integrals', symbol: 'dy', command: '\\,dy', name: 'diferencial dy', keywords: ['diferencial dy', 'matematica', 'integrals'] },
    { id: 'op-0', group: 'operators', symbol: '±', command: '\\pm', name: 'más menos', keywords: ['más menos', 'matematica', 'operators'] },
    { id: 'op-1', group: 'operators', symbol: '∓', command: '\\mp', name: 'menos más', keywords: ['menos más', 'matematica', 'operators'] },
    { id: 'op-2', group: 'operators', symbol: '×', command: '\\times', name: 'multiplicación', keywords: ['multiplicación', 'matematica', 'operators'] },
    { id: 'op-3', group: 'operators', symbol: '÷', command: '\\div', name: 'división', keywords: ['división', 'matematica', 'operators'] },
    { id: 'op-4', group: 'operators', symbol: '·', command: '\\cdot', name: 'producto punto', keywords: ['producto punto', 'matematica', 'operators'] },
    { id: 'op-5', group: 'operators', symbol: '∗', command: '\\ast', name: 'asterisco', keywords: ['asterisco', 'matematica', 'operators'] },
    { id: 'op-6', group: 'operators', symbol: 'a/b', command: '\\frac{a}{b}', name: 'fracción', keywords: ['fracción', 'matematica', 'operators'], insert: { before: '\\frac{', after: '}{}' } },
    { id: 'op-7', group: 'operators', symbol: '√', command: '\\sqrt{}', name: 'raíz cuadrada', keywords: ['raíz cuadrada', 'matematica', 'operators'], insert: { before: '\\sqrt{', after: '}' } },
    { id: 'op-8', group: 'operators', symbol: 'ⁿ√', command: '\\sqrt[n]{}', name: 'raíz enésima', keywords: ['raíz enésima', 'matematica', 'operators'], insert: { before: '\\sqrt[n]{', after: '}' } },
    { id: 'op-9', group: 'operators', symbol: '(n k)', command: '\\binom{n}{k}', name: 'coeficiente binomial', keywords: ['coeficiente binomial', 'matematica', 'operators'] },
    { id: 'op-10', group: 'operators', symbol: '^', command: '^{}', name: 'superíndice', keywords: ['superíndice', 'matematica', 'operators'] },
    { id: 'op-11', group: 'operators', symbol: '_', command: '_{}', name: 'subíndice', keywords: ['subíndice', 'matematica', 'operators'] },
    { id: 'op-12', group: 'operators', symbol: 'mod', command: '\\bmod', name: 'módulo', keywords: ['módulo', 'matematica', 'operators'] },
    { id: 'op-13', group: 'operators', symbol: '+', command: '+', name: 'suma', keywords: ['suma', 'matematica', 'operators'] },
    { id: 'op-14', group: 'operators', symbol: '−', command: '-', name: 'resta', keywords: ['resta', 'matematica', 'operators'] },
    { id: 'op-15', group: 'operators', symbol: '!', command: '!', name: 'factorial', keywords: ['factorial', 'matematica', 'operators'] },
    { id: 'op-18', group: 'operators', symbol: 'log', command: '\\log', name: 'logaritmo', keywords: ['logaritmo', 'matematica', 'operators'] },
    { id: 'op-19', group: 'operators', symbol: 'ln', command: '\\ln', name: 'logaritmo natural', keywords: ['logaritmo natural', 'matematica', 'operators'] },
    { id: 'op-20', group: 'operators', symbol: 'exp', command: '\\exp', name: 'exponencial', keywords: ['exponencial', 'matematica', 'operators'] },
    { id: 'op-21', group: 'operators', symbol: 'sin', command: '\\sin', name: 'seno', keywords: ['seno', 'matematica', 'operators'] },
    { id: 'op-22', group: 'operators', symbol: 'cos', command: '\\cos', name: 'coseno', keywords: ['coseno', 'matematica', 'operators'] },
    { id: 'op-23', group: 'operators', symbol: 'tan', command: '\\tan', name: 'tangente', keywords: ['tangente', 'matematica', 'operators'] },
    { id: 'vec-0', group: 'vectors', symbol: 'v⃗', command: '\\vec{v}', name: 'vector', keywords: ['vector', 'matematica', 'vectors'], insert: { before: '\\vec{', after: '}' } },
    { id: 'vec-1', group: 'vectors', symbol: 'x̂', command: '\\hat{x}', name: 'sombrero', keywords: ['sombrero', 'matematica', 'vectors'], insert: { before: '\\hat{', after: '}' } },
    { id: 'vec-2', group: 'vectors', symbol: 'x', command: '\\mathbf{x}', name: 'negrita vectorial', keywords: ['negrita vectorial', 'matematica', 'vectors'], insert: { before: '\\mathbf{', after: '}' } },
    { id: 'vec-3', group: 'vectors', symbol: 'x̄', command: '\\bar{x}', name: 'barra corta', keywords: ['barra corta', 'matematica', 'vectors'], insert: { before: '\\bar{', after: '}' } },
    { id: 'vec-4', group: 'vectors', symbol: 'x̅', command: '\\overline{x}', name: 'barra superior', keywords: ['barra superior', 'matematica', 'vectors'], insert: { before: '\\overline{', after: '}' } },
    { id: 'vec-5', group: 'vectors', symbol: '⟨·⟩', command: '\\langle \\rangle', name: 'ángulos producto interno', keywords: ['ángulos producto interno', 'matematica', 'vectors'] },
    { id: 'vec-6', group: 'vectors', symbol: '( )', command: '\\begin{pmatrix} \\end{pmatrix}', name: 'matriz paréntesis', keywords: ['matriz paréntesis', 'matematica', 'vectors'] },
    { id: 'vec-7', group: 'vectors', symbol: '[ ]', command: '\\begin{bmatrix} \\end{bmatrix}', name: 'matriz corchetes', keywords: ['matriz corchetes', 'matematica', 'vectors'] },
    { id: 'vec-8', group: 'vectors', symbol: 'det', command: '\\det', name: 'determinante', keywords: ['determinante', 'matematica', 'vectors'] },
    { id: 'vec-11', group: 'vectors', symbol: '0', command: '\\mathbf{0}', name: 'vector cero', keywords: ['vector cero', 'matematica', 'vectors'] },
    { id: 'vec-12', group: 'vectors', symbol: 'eᵢ', command: '\\mathbf{e}_i', name: 'vector canónico', keywords: ['vector canónico', 'matematica', 'vectors'] },
    { id: 'vec-13', group: 'vectors', symbol: 'u·v', command: '\\mathbf{u} \\cdot \\mathbf{v}', name: 'producto escalar', keywords: ['producto escalar', 'matematica', 'vectors'] },
    { id: 'vec-14', group: 'vectors', symbol: 'u×v', command: '\\mathbf{u} \\times \\mathbf{v}', name: 'producto vectorial', keywords: ['producto vectorial', 'matematica', 'vectors'] },
    { id: 'str-0', group: 'structure', symbol: 'texto', command: '\\text{}', name: 'texto', keywords: ['texto', 'matematica', 'structure'], insert: { before: '\\text{', after: '}' } },
    { id: 'str-1', group: 'structure', symbol: 'negrita', command: '\\textbf{}', name: 'texto en negrita', keywords: ['texto en negrita', 'matematica', 'structure'], insert: { before: '\\textbf{', after: '}' } },
    { id: 'str-2', group: 'structure', symbol: 'cursiva', command: '\\textit{}', name: 'texto en cursiva', keywords: ['texto en cursiva', 'matematica', 'structure'], insert: { before: '\\textit{', after: '}' } },
    { id: 'str-3', group: 'structure', symbol: '□', command: '\\quad', name: 'espacio cuadratín', keywords: ['espacio cuadratín', 'matematica', 'structure'] },
    { id: 'str-4', group: 'structure', symbol: '·', command: '\\,', name: 'espacio fino', keywords: ['espacio fino', 'matematica', 'structure'] },
    { id: 'str-5', group: 'structure', symbol: '·', command: '\\;', name: 'espacio mediano', keywords: ['espacio mediano', 'matematica', 'structure'] },
    { id: 'str-6', group: 'structure', symbol: '…', command: '\\dots', name: 'puntos suspensivos', keywords: ['puntos suspensivos', 'matematica', 'structure'] },
    { id: 'str-7', group: 'structure', symbol: '⋯', command: '\\cdots', name: 'puntos centrados', keywords: ['puntos centrados', 'matematica', 'structure'] },
    { id: 'str-8', group: 'structure', symbol: '⋮', command: '\\vdots', name: 'puntos verticales', keywords: ['puntos verticales', 'matematica', 'structure'] },
    { id: 'str-9', group: 'structure', symbol: '⋱', command: '\\ddots', name: 'puntos diagonales', keywords: ['puntos diagonales', 'matematica', 'structure'] },
    { id: 'str-10', group: 'structure', symbol: '(', command: '\\left(', name: 'delimitador izquierdo', keywords: ['delimitador izquierdo', 'matematica', 'structure'] },
    { id: 'str-11', group: 'structure', symbol: ')', command: '\\right)', name: 'delimitador derecho', keywords: ['delimitador derecho', 'matematica', 'structure'] },
    { id: 'str-12', group: 'structure', symbol: 'Big', command: '\\Big', name: 'delimitador grande', keywords: ['delimitador grande', 'matematica', 'structure'] },
    { id: 'str-13', group: 'structure', symbol: '{', command: '\\{', name: 'llave izquierda', keywords: ['llave izquierda', 'matematica', 'structure'] },
    { id: 'str-14', group: 'structure', symbol: '}', command: '\\}', name: 'llave derecha', keywords: ['llave derecha', 'matematica', 'structure'] },
    { id: 'str-15', group: 'structure', symbol: '[', command: '[', name: 'corchete izquierdo', keywords: ['corchete izquierdo', 'matematica', 'structure'] },
    { id: 'str-16', group: 'structure', symbol: ']', command: ']', name: 'corchete derecho', keywords: ['corchete derecho', 'matematica', 'structure'] },
    { id: 'str-17', group: 'structure', symbol: '|', command: '\\mid', name: 'tal que divide', keywords: ['tal que divide', 'matematica', 'structure'] },
  ];

  const SPOKEN_CHARACTERS = {
    "\\": " barra invertida ",
    "{": " llave izquierda ",
    "}": " llave derecha ",
    "(": " paréntesis izquierdo ",
    ")": " paréntesis derecho ",
    "[": " corchete izquierdo ",
    "]": " corchete derecho ",
    "=": " igual ",
    "|": " barra vertical ",
  };

  /** Convierte un comando en una lectura comprensible: `\forall` → «barra invertida forall». */
  function describeCommand(command = "") {
    return String(command)
      .replace(/[\\{}()[\]=|]/g, (character) => SPOKEN_CHARACTERS[character])
      .replace(/\s+/g, " ")
      .trim();
  }

  /** Nombre accesible del botón de un símbolo. */
  function symbolAccessibleName(symbol = {}) {
    return `Insertar ${symbol.name}, comando ${describeCommand(symbol.command)}`;
  }

  /** Normaliza para buscar: sin diacríticos, en minúsculas y sin espacios sobrantes. */
  function normalizeSearchTerm(value = "") {
    return String(value).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  }

  /**
   * Filtra el catálogo por nombre, comando o términos de búsqueda.
   * Una consulta vacía devuelve el catálogo completo; varias palabras se exigen todas.
   */
  function filterMathSymbols(query = "", symbols = MATH_SYMBOLS) {
    const tokens = normalizeSearchTerm(query).split(/\s+/).filter(Boolean);
    if (!tokens.length) return [...symbols];
    return symbols.filter((symbol) => {
      const haystack = normalizeSearchTerm([symbol.name, symbol.command, symbol.symbol, ...(symbol.keywords || [])].join(" "));
      return tokens.every((token) => haystack.includes(token));
    });
  }

  /** Símbolos de un grupo, en el orden declarado en el catálogo. */
  function symbolsByGroup(groupId, symbols = MATH_SYMBOLS) {
    return symbols.filter((symbol) => symbol.group === groupId);
  }

  Object.assign(TexNotes, {
    MATH_SYMBOL_GROUPS, MATH_SYMBOLS, describeCommand, symbolAccessibleName,
    normalizeSearchTerm, filterMathSymbols, symbolsByGroup,
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
