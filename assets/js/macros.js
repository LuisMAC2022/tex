/** Validación de macros del documento y adaptación a la vista previa. */
(function (global) {
  "use strict";
  const T=global.TexNotes;
  const LATEX_RESERVED = (`b c d H i j k l L o O P r S t u v aa AA ae AE oe OE ss dag ddag
begin end item par label ref caption section subsection newcommand renewcommand providecommand def let relax input include usepackage documentclass maketitle title author date
text textbf textit emph mathbb mathbf mathrm mathcal frac sqrt left right
sin cos tan cot sec csc log ln exp lim sup inf max min det dim ker deg arg gcd Pr hom`).split(/\s+/);
  function reservedMacroNames() {
    const names=new Set(LATEX_RESERVED);
    for(const symbol of T.MATH_SYMBOLS||[]) for(const source of [symbol.command,symbol.insert?.before||'']) for(const m of source.matchAll(/\\([A-Za-z]+)/g)) names.add(m[1]);
    for(const type of T.BLOCK_TYPES){
      const environment=type.environment||type.listEnvironment;
      if(environment){ names.add(environment); names.add('end'+environment); }
    }
    return names;
  }
  function validateMacroFields(macro, existing=[]) {
    const errors={name:[],params:[],body:[]};
    const m=macro||{};
    if(typeof m.name!=='string'||! /^[A-Za-z]+$/.test(m.name)) errors.name.push('El nombre solo admite letras A–Z y a–z, sin barra.');
    else if(reservedMacroNames().has(m.name)) errors.name.push(`\\${m.name} ya existe en LaTeX${m.name==='S'?' (signo de sección)':''}. Elige otro nombre.`);
    else if(existing.some(item=>item.name===m.name)) errors.name.push('Ya existe una macro con ese nombre en el documento.');
    if(!Number.isInteger(m.params)||m.params<0||m.params>9) errors.params.push('El número de argumentos debe ser un entero entre 0 y 9.');
    if(typeof m.body!=='string'||!m.body.trim()) errors.body.push('Escribe una definición no vacía.');
    else {
      if(/[\r\n]/.test(m.body)) errors.body.push('La definición debe ocupar una sola línea.');
      let depth=0, balanced=true;
      for(let i=0;i<m.body.length;i++){
        if(T.isEscaped(m.body,i)) continue;
        if(m.body[i]==='{') depth++;
        else if(m.body[i]==='}') { depth--; if(depth<0) balanced=false; }
        else if(m.body[i]==='#'&&(!/[1-9]/.test(m.body[i+1]||'')||Number(m.body[i+1])>m.params)) errors.body.push('Cada parámetro debe ser #1 hasta el número de argumentos; ## no está permitido.');
      }
      if(depth!==0||!balanced) errors.body.push('La definición tiene llaves sin pareja.');
    }
    return errors;
  }
  function validateMacro(macro,existing=[]) { return Object.values(validateMacroFields(macro,existing)).flat(); }
  function katexMacros(macros=[]) { return Object.fromEntries(macros.map(m=>['\\'+m.name,m.body])); }
  /* @decision DEC-017 ancla:ac1ea77b tramo:4
   * Las definiciones explícitas conservan el número declarado de argumentos,
   * incluso si el cuerpo no usa alguno. El mapa de KaTeX se crea en cada render
   * para que gdef no contamine las fórmulas siguientes.
   */
  function macroPreviewDefinitions(macros=[]) {
    return macros.map(m=>`\\def\\${m.name}${Array.from({length:m.params},(_,i)=>'#'+(i+1)).join('')}{${m.body}}`).join('');
  }
  Object.assign(T,{LATEX_RESERVED,reservedMacroNames,validateMacroFields,validateMacro,katexMacros,macroPreviewDefinitions});
})(typeof globalThis!=='undefined'?globalThis:this);
