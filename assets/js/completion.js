/** Catálogos, clasificación, alias y configuración. Sin DOM ni almacenamiento. */
(function (global) {
  "use strict";
  const T = global.TexNotes;
  const SHORT_WORDS = 'a al de del el en es ex la las lo los no o para por que se si sin su un una y ya'.split(' ');
  const TEXT_COMMANDS = [
    ['textbf', '\\textbf{}', 'Negrita'], ['textit', '\\textit{}', 'Cursiva'], ['emph', '\\emph{}', 'Énfasis'],
    ['underline', '\\underline{}', 'Subrayado'], ['quad', '\\quad', 'Espacio cuadratín'], ['qquad', '\\qquad', 'Espacio doble'],
    ['label', '\\label{}', 'Etiqueta'], ['ref', '\\ref{}', 'Referencia'],
  ].map(([id,insert,label]) => ({key:`text:${id}`,kind:'text',trigger:'\\'+id,insert,label,detail:insert,mode:'any'}));
  const DEFAULT_ALIASES = [
    ['RR','\\mathbb{R}'],['NN','\\mathbb{N}'],['ZZ','\\mathbb{Z}'],['QQ','\\mathbb{Q}'],['CC','\\mathbb{C}'],
    ['imp','\\Rightarrow'],['sii','\\Leftrightarrow'],['pt','\\forall'],['exi','\\exists'],['fr','\\frac{#1}{#2}#0'],
    ['pd','\\frac{\\partial #1}{\\partial #2}#0'],['lim','\\lim_{#1 \\to #2} #0'],['int','\\int_{#1}^{#2} #3 \\, d#4'],
    ['iint','\\iint_{#1} #2 \\, dA'],['sum','\\sum_{#1}^{#2} #0'],['nab','\\nabla'],['eps','\\varepsilon'],['ra','\\to'],
    ['vec','\\mathbf{#1}#0'],['abs','\\left| #1 \\right|#0'],['norm','\\left\\| #1 \\right\\|#0'],
  ].map(([trigger,expansion])=>({trigger,expansion,mode:'math'}));
  const normalizeSearch = text => String(text).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
  function completionEntries(macros = []) {
    const personal = macros.map(m => ({key:`macro:${m.name}`,kind:'macro',trigger:'\\'+m.name,
      insert:'\\'+m.name+Array.from({length:m.params},(_,i)=>`{#${i+1}}`).join('')+'#0',label:'\\'+m.name,detail:m.body,mode:'math'}));
    const symbols = T.MATH_SYMBOLS.map(s=>({key:`symbol:${s.id}`,kind:'symbol',trigger:s.command,insert:s.insert || s.command,
      label:s.name,detail:s.command,keywords:s.keywords,mode:s.group==='structure'?'any':'math'}));
    const environments = [...T.MATH_ENVIRONMENTS,'center'].map(name=>({key:`environment:${name}`,kind:'environment',trigger:name,
      insert:`\\begin{${name}}\n#1\n\\end{${name}}#0`,label:name,detail:`Entorno ${name}`,mode:'any'}));
    return [...personal,...symbols,...TEXT_COMMANDS,...environments];
  }
  function usageScore(entry, now) {
    return entry && Number.isFinite(entry.n) && Number.isFinite(entry.t) ? Math.max(0,entry.n)/(1+Math.max(0,now-entry.t)/86400000/7) : 0;
  }
  function rankCompletions(query, entries, usage = {}, now = 0, mode = 'text') {
    if (mode === 'comment') return [];
    const q=normalizeSearch(query).replace(/^\\/,'');
    return entries.map((entry,index)=>{
      if(entry.mode==='text'&&mode!=='text') return null;
      const command=normalizeSearch(entry.trigger).replace(/^\\/,'');
      const words=normalizeSearch([entry.label,...(entry.keywords||[])].join(' ')).split(/\s+/);
      const rank=command.startsWith(q)?0:command.includes(q)?1:words.some(w=>w.startsWith(q))?2:words.some(w=>w.includes(q))?3:Infinity;
      return {entry,index,rank,score:usageScore(usage[entry.key],now),length:command.length};
    // Con igual nivel y uso gana el comando más corto: \frac{a}{b} antes que
    // \frac{\partial f}{\partial x}, aunque el catálogo liste antes la derivada.
    }).filter(item=>item&&Number.isFinite(item.rank)).sort((a,b)=>a.rank-b.rank||b.score-a.score||a.length-b.length||a.index-b.index).slice(0,8).map(item=>item.entry);
  }
  function recordUsage(usage, key, now) {
    const entries=Object.entries(usage||{}).filter(([,v])=>v&&Number.isFinite(v.n)&&v.n>=0&&Number.isFinite(v.t));
    const next=Object.fromEntries(entries);
    if(key) next[key]={n:(next[key]?.n||0)+1,t:now};
    return Object.fromEntries(Object.entries(next).sort((a,b)=>usageScore(b[1],now)-usageScore(a[1],now)||a[0].localeCompare(b[0])).slice(0,300));
  }
  function completionToken(state) {
    if(state.selectionStart!==state.selectionEnd) return null;
    const before=state.value.slice(0,state.selectionStart);
    const reference = /\\(?:eqref|ref)\{([^{}\s,]*)$/.exec(before);
    if (reference && !T.isEscaped(before, reference.index)) {
      const tail = /^[a-z0-9:-]*\}?/i.exec(state.value.slice(state.selectionStart))[0];
      return { kind: "reference", query: reference[1], start: reference.index, end: state.selectionStart + tail.length };
    }
    const env=/\\begin\{([A-Za-z]*)$/.exec(before);
    if(env&&!T.isEscaped(before,env.index)) return {kind:'environment',query:env[1],start:env.index,end:state.selectionStart+Number(state.value[state.selectionStart]==='}')};
    const match=/(?:^|[^\\])(?:\\\\)*\\([A-Za-z]+)$/.exec(before);
    return match ? {kind:'command',query:match[1],start:state.selectionStart-match[1].length-1,end:state.selectionStart} : null;
  }
  function validSnippetMarkers(text) {
    for(let i=0;i<text.length;i++) if(text[i]==='#'&&!T.isEscaped(text,i)) {
      if(!/[0-9]/.test(text[i+1]||'')||/[0-9]/.test(text[i+2]||'')) return false;
      i++;
    }
    return true;
  }
  function referenceOptions(targets, token, value, mode) {
    const before = value.slice(0, token.start);
    return targets.map(target => {
      const { word, label, number, title, typeId } = target;
      const heading = number === null ? word : word + " " + number;
      const alreadyNamed = new RegExp("(?:^|[^\\p{L}\\p{N}])" + word + "(?:\\s+|~)$", "iu").test(before);
      const command = typeId === "equation" ? "\\eqref" : "\\ref";
      const prefix = mode === "text" && typeId !== "equation" && !alreadyNamed ? word + "~" : "";
      return { key: "ref:" + label, kind: "reference", trigger: label, label: heading + " · " + (title || label),
        detail: label, insert: prefix + command + "{" + label + "}", mode: "any" };
    });
  }
  function validateAlias(alias, existing = []) {
    const errors=[];
    if(!alias||typeof alias!=='object') return ['El alias no es válido.'];
    if(typeof alias.trigger!=='string'||! /^[\p{L}\p{N}]{2,12}$/u.test(alias.trigger)) errors.push('El disparador debe tener entre 2 y 12 letras o números.');
    if(SHORT_WORDS.includes(normalizeSearch(alias.trigger))) errors.push('El disparador coincide con una palabra corta del español.');
    if(existing.some(a=>a.trigger===alias.trigger)) errors.push('Ya existe un alias con ese disparador.');
    if(typeof alias.expansion!=='string'||!alias.expansion.trim()) errors.push('Escribe una expansión no vacía.');
    else if(!validSnippetMarkers(alias.expansion)) errors.push('Usa solamente marcadores #0 a #9; escapa el signo literal con \\#.');
    if(!['math','text','any'].includes(alias.mode)) errors.push('El modo del alias no es válido.');
    return errors;
  }
  function aliasAt(state, aliases, mode) {
    if(state.selectionStart!==state.selectionEnd||mode==='comment') return null;
    const before=state.value.slice(0,state.selectionStart), match=/[\p{L}\p{N}]+$/u.exec(before);
    if(!match||/[\p{L}\p{N}\\]/u.test(before[match.index-1]||'')) return null;
    const alias=aliases.find(a=>a.trigger===match[0]&&(a.mode!=='text'||mode==='text'));
    return alias ? {alias,start:match.index,end:state.selectionStart} : null;
  }
  function validateConfiguration(config) {
    if(!config||config.kind!=='notas-latex-config'||config.version!==1) return ['El archivo no es una configuración compatible.'];
    if(!Array.isArray(config.aliases)||!Array.isArray(config.templates)||!Array.isArray(config.macros)||!config.prefs||typeof config.prefs.autoPair!=='boolean') return ['Faltan alias, plantillas, macros o preferencias válidas.'];
    const errors=[], aliases=[], templates=[], macros=[];
    for(const a of config.aliases){ errors.push(...validateAlias(a,aliases)); aliases.push(a); }
    for(const t of config.templates){ errors.push(...(T.validateTemplate ? T.validateTemplate(t,[...(T.BUILTIN_TEMPLATES||[]),...templates]) : ['Esta versión no admite plantillas importadas.'])); templates.push(t); }
    for(const m of config.macros){ errors.push(...(T.validateMacro ? T.validateMacro(m,macros) : ['Esta versión no admite macros importadas.'])); macros.push(m); }
    return errors;
  }
  Object.assign(T,{SHORT_WORDS,TEXT_COMMANDS,DEFAULT_ALIASES,normalizeSearch,completionEntries,referenceOptions,usageScore,rankCompletions,recordUsage,completionToken,validSnippetMarkers,validateAlias,aliasAt,validateConfiguration});
})(typeof globalThis !== 'undefined' ? globalThis : this);
