import test from "node:test";
import assert from "node:assert/strict";
import { T } from "./radial-fixtures.mjs";
import { loadTexNotes } from "./load-app.mjs";

const book = { key:"stewart1994", authors:["Stewart, J."], year:"1994", title:"Cálculo", publisher:"Iberoamérica", place:"México" };
const text = (content, children = []) => ({type:"text",content,children});
const plain = structuredClone;
const config = { kind:"notas-latex-config", version:1, aliases:[], templates:[], macros:[], prefs:{autoPair:true} };

test("cada error bibliográfico identifica su campo y la clave se propone sin colisiones", () => {
  assert.deepEqual(plain(T.validateReference(book)),{});
  assert.deepEqual(Object.keys(T.validateReference({key:"-M", year:"20", edition:"1"})).sort(), ["authors","edition","key","title","year"]);
  assert.ok(T.validateReference(book,[book]).key);
  assert.deepEqual(plain(T.validateReference({key:"r", text:"Texto literal"})),{});
  assert.deepEqual(Object.keys(T.validateReference({key:"r",text:"Literal"},[],"apa")).sort(),["authors","year"]);
  assert.deepEqual(plain(T.validateReference({...book,title:"",text:"Literal"},[],"apa")),{});
  assert.equal(T.suggestReferenceKey({authors:["Álvarez, M."],year:"1994"},["alvarez1994","alvarez1994b"]), "alvarez1994c");
  assert.equal(T.suggestReferenceKey({authors:["Stewart, J."]}),"");
  assert.equal(T.citationInfo({blocks:[text("\\citep{stewart1994} % \\cite{otro}\n\\citet*{stewart1994}")] }).counts.get(book.key),2);
  const renamed={...book,key:"nueva"}, state={references:[book],blocks:[text("\\citet{stewart1994}")]};
  assert.ok(T.saveReference(state,renamed,book.key).errors.key);
  assert.equal(T.saveReference({...state,blocks:[]},renamed,book.key).references[0].key,"nueva");
});

test("las fichas IEEE y APA formatean autores, edición, lugar y campos literales o escapados", () => {
  const authors = ["A, X.","B, Y.","C, Z.","D","E","F","G"];
  const ieee = ["X.~A", "X.~A y Y.~B", "X.~A, Y.~B y Z.~C", "X.~A \\emph{et al.}"];
  const apa = ["A, X.", "A, X. y B, Y.", "A, X., B, Y. y C, Z.", "A, X., B, Y., C, Z., D, E, F y G"];
  for (const [i,count] of [1,2,3,7].entries()) {
    const entry = {...book,authors:authors.slice(0,count),edition:"2",url:"https://ejemplo.mx/a_b",publisher:"A&B_C"};
    const url = " \\texttt{https://ejemplo.mx/a\\_b}";
    assert.equal(T.formatReference(entry,"ieee"),ieee[i]+", \\emph{Cálculo}, 2.ª ed. México: A\\&B\\_C, 1994."+url);
    assert.equal(T.formatReference(entry,"apa"),apa[i]+" (1994). \\emph{Cálculo} (2.ª ed.). A\\&B\\_C."+url);
  }
  assert.equal(T.formatReference({...book,authors:["Larson","Hostetler"],place:""}),"Larson y Hostetler, \\emph{Cálculo}. Iberoamérica, 1994.");
  assert.equal(T.formatReference({...book,text:"  \\emph{A} & B_1  "},"apa"),"  \\emph{A} & B_1  ");
});

test("IEEE sigue las citas de padres e hijos y APA ordena por apellido, año y título", () => {
  const refs = [book,{...book,key:"alvarez", authors:["Álvarez"],title:"Otra"},{...book,key:"boyce",authors:["Boyce"]},
    {...book,key:"zeta",title:"Zeta"},{...book,key:"alfa",title:"Alfa"}];
  const blocks=[text("\\citep[p.~3]{zeta, boyce}",[text("\\citet*{stewart1994,alfa}")]),text("\\cite{zeta}")];
  const state = {blocks,references:refs,bibliography:{includeUncited:true}};
  const rows=T.printedReferences(state);
  assert.deepEqual(Array.from(rows,r=>r.entry.key),["zeta","boyce","stewart1994","alfa","alvarez"]);
  assert.deepEqual(Array.from(rows,r=>r.suffix),["c","","b","a",""]);
  state.bibliography.style="apa";
  assert.deepEqual(Array.from(T.printedReferences(state),r=>r.entry.key),["alvarez","boyce","alfa","stewart1994","zeta"]);
  assert.match(T.bibliographyLatex(state),/\\bibitem\[Stewart\(1994a\)\]\{alfa\} Stewart, J\. \(1994a\)\./);
});

test("natbib solo se activa por una ficha o por un comando propio escrito fuera de comentarios", () => {
  const latex=content=>T.generateLatex({blocks:[text(content)]});
  for(const command of ["citep","citet","citealt","citealp","citeauthor","citeyear"]) for(const star of ["","*"])
    assert.match(latex("\\"+command+star+"{x}"),/\\usepackage\[numbers,square,sort&compress\]\{natbib\}/);
  for(const content of ["\\cite{ref1}", "% \\citep{x}", "\\\\citep{x}"]) assert.doesNotMatch(latex(content),/\{natbib\}/);
  const state={blocks:[text("Texto final")],references:T.COURSE_REFERENCES,bibliography:{style:"apa"}};
  assert.match(T.generateLatex(state),/\[round,authoryear\]\{natbib\}/);
  assert.doesNotMatch(T.generateLatex(state),/\\begin\{thebibliography\}/);
  state.bibliography.includeUncited=true;
  const tex=T.generateLatex(state);
  assert.equal((tex.match(/\\bibitem/g)||[]).length,8);
  assert.match(tex,/Texto final\n\n\\begin\{thebibliography\}\{9\}[\s\S]*\\end\{thebibliography\}\n\n\\end\{document\}/);
  assert.match(tex,/\\bibitem\[Larson y Hostetler\(1995\)\]\{larson1995\}/);
});

test("las sugerencias de cita sustituyen solo la clave actual con opcionales, estrella y varias claves", () => {
  for(const [command,args] of [["cite",""],["citep","[p.~912]"],["citet*","[véase][p.~9]"],["citeauthor",""]]){
    const before="\\"+command+args+"{boyce1994, st", after="e, zill1996}", value=before+after;
    const token=T.completionToken({value,selectionStart:before.length,selectionEnd:before.length});
    assert.equal(token.kind,"citation"); assert.equal(token.query,"st");
    const entry=T.citationOptions([T.normalizeReference(book)])[0];
    assert.equal(entry.label,"Stewart (1994) · Cálculo");
    assert.equal(value.slice(0,token.start)+entry.insert+value.slice(token.end),"\\"+command+args+"{boyce1994, stewart1994, zill1996}");
  }
  assert.ok(T.TEXT_COMMANDS.some(e=>e.trigger==="\\citet"));
  assert.ok(!T.TEXT_COMMANDS.some(e=>e.trigger==="\\cite"));
  const menu=T.slicesFor("text");
  assert.equal(menu.length,8); assert.equal(menu.at(-1).children.length,2);
});

test("la migración de v5, la configuración antigua y el proyecto conservan la bibliografía", async () => {
  const V=await loadTexNotes(["block-types.js","block-tree.js","image-options.js","references.js","versions.js"]);
  for (const version of [1,2,3,4,5]) {
    const old=V.normalizeDraft({version,metadata:{},blocks:[],references:[book],bibliography:{style:"apa"}});
    assert.equal(old.version,V.DRAFT_VERSION); assert.deepEqual(plain(old.references),[]);
    assert.deepEqual(plain(old.bibliography),{style:"ieee",includeUncited:false});
  }
  for(const c of [config,{...config,references:T.COURSE_REFERENCES},{...config,references:[]}]) assert.deepEqual(plain(T.validateConfiguration(c)),[]);
  assert.ok(T.validateConfiguration({...config,references:[book,book]}).length);
  const current=V.documentSnapshot({metadata:{title:"Curso"},references:[book],bibliography:{style:"apa",includeUncited:true}});
  const state={...current,documentId:"d00000001"}, createdAt="2026-11-23T12:00:00.000Z";
  const versions=V.addVersion([],state,{id:"v",createdAt,origin:"manual"});
  const read=V.validateProject(JSON.stringify({kind:"notas-latex-proyecto",version:1,exportedAt:createdAt,documentId:state.documentId,current,versions}));
  assert.deepEqual(plain(read.project.current),plain(current)); assert.deepEqual(plain(read.project.versions[0].state),plain(current));
  const before={...state,blocks:[{id:"b00000001",type:"theorem",content:"A",label:"teo:a"}],references:[book,{...book,key:"old"}]};
  const after={...before,blocks:[{...before.blocks[0],label:"teo:b"}],references:[{...book,title:"Nuevo"},{...book,key:"new"}],bibliography:{style:"ieee"}};
  const diff=V.diffDocuments(before,after);
  assert.deepEqual(Array.from(diff.references,c=>c.key),["stewart1994","old","new"]);
  assert.deepEqual(Array.from(diff.references,c=>c.kind),["modified","removed","added"]);
  assert.deepEqual(Array.from(diff.bibliography,c=>c.key).sort(),["includeUncited","style"]);
  assert.deepEqual(plain(diff.modified[0].fields),["label"]);
  const history=V.rememberHistory({past:[],future:[]},V.historyEntry(before));
  assert.deepEqual(plain(V.travelHistory(history,V.historyEntry(after),"undo").entry.state.references),plain(V.normalizeReferences(before.references)));
  assert.equal(V.sameDocument(before,after),false);
  const archived = {...versions[0],state:{version:4,metadata:{},macros:[],blocks:[{type:"image",content:"a.png",options:{label:"mapa"}}]}};
  const [upgraded] = V.upgradeStoredVersions([archived]);
  assert.equal(upgraded.id,archived.id); assert.equal(upgraded.createdAt,archived.createdAt);
  assert.equal(upgraded.state.version,V.DRAFT_VERSION); assert.equal(upgraded.state.blocks[0].label,"fig:mapa");
  assert.deepEqual(plain(upgraded.state.references),[]); assert.equal(V.upgradeStoredVersions([upgraded])[0],upgraded);
});

test("la conversión conserva las claves y las líneas literales y rechaza colisiones de forma atómica", () => {
  const legacy={type:"bibliography",content:"  Original \\& A  \n\n B_2 "};
  const state={blocks:[text("\\cite{ref1}",[legacy])],references:[]};
  const old=T.generateLatex(state);
  assert.doesNotMatch(old,/\{natbib\}/); assert.match(old,/\\bibitem\{ref2\} B_2/);
  assert.equal(T.bibliographyIssues(state).length,0);
  const next=T.convertBibliography(state,[0,0]);
  assert.equal(next.blocks[0].children.length,0); assert.equal(state.blocks[0].children.length,1);
  assert.deepEqual(Array.from(next.references,r=>[r.key,r.text]),[["ref1","Original \\& A"],["ref2","B_2"]]);
  const colliding={...state,references:[{...book,key:"ref2"}]};
  assert.match(T.convertBibliography(colliding,[0,0]).error,/ref2/);
  assert.equal(colliding.blocks[0].children.length,1); assert.equal(colliding.references.length,1);
});

test("el resumen bibliográfico distingue claves rotas, conflictos antiguos y fichas APA o sin cita", () => {
  const state={blocks:[text("% \\cite{fantasma}\n😀 \\citep{ref1, ausente}"),{type:"bibliography",content:"Original"}],
    references:[{key:"f",text:"Literal"},book],bibliography:{style:"apa",includeUncited:true}};
  const result=T.checkDocument(state).flatMap(group=>group.issues);
  for (const code of ["missing-citation","legacy-apa","two-bibliographies","apa-author-year"]) assert.equal(result.filter(i=>i.code===code&&i.severity==="error").length,1);
  const missing=result.find(i=>i.code==="missing-citation"); assert.equal(missing.line,2); assert.equal(missing.column,16);
  assert.ok(result.filter(i=>i.code==="legacy-apa"||i.code==="two-bibliographies").every(i=>i.canConvert));
  state.bibliography.includeUncited=false;
  const uncited=T.bibliographyIssues(state).filter(row=>row.issue.code==="uncited-reference");
  assert.equal(uncited.length,2); assert.ok(uncited.every(row=>row.issue.severity==="aviso"));
});
