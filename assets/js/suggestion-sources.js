/** La primera fuente que reconoce el texto conserva la responsabilidad de aceptar su opción. */
(function (T) {
  "use strict";
  function createSuggestionSources() {
    const sources = new Map();
    function register(source) {
      if (!source.id || sources.has(source.id) || !["match","entries","accept"].every(key => typeof source[key] === "function"))
        throw Error("Fuente de sugerencias inválida: " + source.id);
      sources.set(source.id,source);
    }
    function find(state,event,mode,only) {
      if (mode === "comment") return null;
      for (const source of sources.values()) {
        if (only && source.id !== only) continue;
        const token = source.match(state,event,mode);
        if (token) return { token:{...token,sourceId:source.id}, entries:source.entries(token) };
      }
      return null;
    }
    function accept(entry,token) { return sources.get(token?.sourceId)?.accept(entry,token) || false; }
    return {register,find,accept};
  }
  function createWritingSources(d) {
    const sources = createSuggestionSources();
    function tokenFor(state,mode,kinds) {
      const token=T.completionToken(state);
      return kinds.includes(token?.kind) ? {...token,value:state.value,mode} : null;
    }
    function rank(entries,token) {
      return T.rankCompletions(token.query,entries,d.usage(),d.now(),token.mode);
    }
    function snippet(entry,token) {
      return {kind:"snippet",source:entry.insert,start:token.start,end:token.end,
        wrapMath:token.mode==="text" && entry.mode==="math",openDocument:token.kind==="command"};
    }
    sources.register({
      id:"slash",
      match(state) {
        if (!d.slashActive()) return null;
        const result=T.slashCompletions(state,d.templates());
        return result ? {...result.token,choices:result.entries} : {kind:"slash",choices:[]};
      },
      entries:token=>token.choices,
      accept(entry,token) {
        if(entry.kind==="template") return {kind:"template",template:entry.template};
        return entry.kind==="type" ? {kind:"type",typeId:entry.typeId,title:token.title} : false;
      },
    });
    sources.register({
      id:"document",
      match:(state,event,mode)=>tokenFor(state,mode,["reference","citation"]),
      entries(token) {
        const entries=token.kind==="citation" ? T.citationOptions(d.references()) :
          T.referenceOptions(d.targets(),token,token.value,token.mode);
        return rank(entries,token);
      },
      accept:snippet,
    });
    sources.register({
      id:"commands",
      match:(state,event,mode)=>tokenFor(state,mode,["command","environment"]),
      entries(token) {
        const entries=T.completionEntries(d.macros()).filter(e=>(e.kind==="environment")===(token.kind==="environment"));
        return rank(entries,token);
      },
      accept:snippet,
    });
    return sources;
  }
  Object.assign(T,{createSuggestionSources,createWritingSources});
})(globalThis.TexNotes);
