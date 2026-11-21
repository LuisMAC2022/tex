/** Plantillas por pasos y comandos de tipo, sin DOM. */
(function (global) {
  "use strict";
  const T = global.TexNotes;
  const step = (depth, type, content, title = '') => ({ depth, block: { type, title, content } });
  const BUILTIN_TEMPLATES = [
    { id:'teodem',name:'Teorema con demostración',trigger:'teodem',steps:[step(0,'theorem','#1'),step(0,'proof','#1')] },
    { id:'ejres',name:'Ejemplo resuelto',trigger:'ejres',steps:[step(0,'example','#1'),step(1,'text','\\textit{Solución.} #1'),step(1,'equation','#1')] },
    { id:'limite',name:'Límite (ε-δ)',trigger:'limite',steps:[step(0,'definition',String.raw`Sea $f: D \subseteq \mathbb{R}^n \to \mathbb{R}$ y $\mathbf{a}$ un punto de acumulación de $D$. Decimos que $\lim_{\mathbf{x} \to \mathbf{a}} f(\mathbf{x}) = L$ si para todo $\varepsilon > 0$ existe $\delta > 0$ tal que, si $\mathbf{x} \in D$ y $0 < \|\mathbf{x} - \mathbf{a}\| < \delta$, entonces $|f(\mathbf{x}) - L| < \varepsilon$.`,'Límite de una función real de un vector')] },
    { id:'parcial',name:'Derivada parcial',trigger:'parcial',steps:[step(0,'definition','La derivada parcial de $f$ respecto de $x$ en $(a,b)$ es','Derivada parcial'),step(1,'equation',String.raw`\frac{\partial f}{\partial x}(a,b) = \lim_{h \to 0} \frac{f(a+h,b) - f(a,b)}{h}`)] },
    { id:'grad',name:'Gradiente y derivada direccional',trigger:'grad',steps:[step(0,'equation',String.raw`\nabla f(a,b) = \left( \frac{\partial f}{\partial x}(a,b), \frac{\partial f}{\partial y}(a,b) \right)`),step(0,'equation',String.raw`D_{\mathbf{u}} f(a,b) = \nabla f(a,b) \cdot \mathbf{u}, \qquad \|\mathbf{u}\| = 1`)] },
    { id:'lagrange',name:'Multiplicadores de Lagrange',trigger:'lagrange',steps:[step(0,'text','Para optimizar $f(x,y)$ sujeta a $g(x,y) = k$ resolvemos el sistema'),step(0,'equation',String.raw`\begin{cases} \nabla f(x,y) = \lambda \nabla g(x,y) \\ g(x,y) = k \end{cases}`)] },
    { id:'fubini',name:'Integral iterada',trigger:'fubini',steps:[step(0,'equation',String.raw`\iint_R f(x,y)\,dA = \int_{#1}^{#2} \int_{#3}^{#4} f(x,y)\,dy\,dx`)] },
    { id:'polares',name:'Coordenadas polares',trigger:'polares',steps:[step(0,'equation',String.raw`\iint_D f(x,y)\,dA = \int_{\alpha}^{\beta} \int_{r_1(\theta)}^{r_2(\theta)} f(r\cos\theta, r\sin\theta)\, r\,dr\,d\theta`)] },
    { id:'esfericas',name:'Coordenadas esféricas',trigger:'esfericas',steps:[step(0,'equation',String.raw`\iiint_E f\,dV = \iiint f(\rho\sin\varphi\cos\theta, \rho\sin\varphi\sin\theta, \rho\cos\varphi)\,\rho^2\sin\varphi\,d\rho\,d\varphi\,d\theta`)] },
    { id:'taylor',name:'Taylor de orden 2 en dos variables',trigger:'taylor',steps:[step(0,'equation',String.raw`f(a+h,b+k) \approx f(a,b) + f_x(a,b)\,h + f_y(a,b)\,k + \frac{1}{2}\left( f_{xx}(a,b)\,h^2 + 2 f_{xy}(a,b)\,hk + f_{yy}(a,b)\,k^2 \right)`)] },
    { id:'preclase',name:'Pregunta pre-clase',trigger:'preclase',steps:[step(0,'text','#1','Pregunta'),step(1,'text','\\textbf{Respuesta.} #1')] },
  ];
  function validateTemplate(template, existing = []) {
    const errors=[];
    if(!template||typeof template!=='object') return ['La plantilla no es válida.'];
    if(typeof template.id!=='string'||!template.id.trim()) errors.push('La plantilla necesita un identificador.');
    if(typeof template.name!=='string'||!template.name.trim()) errors.push('Escribe un nombre para la plantilla.');
    if(typeof template.trigger!=='string'||! /^[a-z0-9]{2,16}$/.test(template.trigger)) errors.push('El comando debe tener entre 2 y 16 letras minúsculas o números.');
    if(existing.some(t=>t.id===template.id||t.trigger===template.trigger)||T.BLOCK_TYPES.some(t=>t.slash.includes(template.trigger))) errors.push('Ya existe una plantilla o un tipo con ese comando.');
    if(!Array.isArray(template.steps)||!template.steps.length) return [...errors,'La plantilla necesita al menos un paso.'];
    const parents=[];
    for(const [i,s] of template.steps.entries()){
      if(!s||!Number.isInteger(s.depth)||s.depth<0||(!i&&s.depth!==0)||(i&&s.depth>template.steps[i-1].depth+1)) return [...errors,'La primera profundidad debe ser 0 y solo puede aumentar un nivel por paso.'];
      if(!s.block||!T.blockType(s.block.type)||typeof s.block.content!=='string'||typeof s.block.title!=='string') return [...errors,'Cada paso necesita un tipo, título y contenido válidos.'];
      if(s.depth>0&&(!parents[s.depth-1]||!T.acceptsChildren(parents[s.depth-1].type))) errors.push('El padre de un paso no admite bloques anidados.');
      parents[s.depth]=s.block; parents.length=s.depth+1;
    }
    return errors;
  }
  function slashCompletions(state, templates = BUILTIN_TEMPLATES) {
    if(state.selectionStart!==state.selectionEnd||state.selectionStart!==state.value.length) return null;
    const match=/^\/([\p{L}\p{N}]*)(?:[ \t]([^\n]*))?$/u.exec(state.value);
    if(!match) return null;
    const q=T.normalizeSearch(match[1]), title=match[2], exact=title!==undefined;
    const matches=words=>words.some(word=>exact?T.normalizeSearch(word)===q:T.normalizeSearch(word).startsWith(q));
    const types=T.BLOCK_TYPES.filter(type=>matches([...type.slash,type.label])).map(type=>({key:`type:${type.id}`,kind:'type',typeId:type.id,trigger:'/'+type.slash[0],label:type.label,detail:type.slash.map(s=>'/'+s).join(' · ')}));
    const choices=templates.filter(t=>matches([t.trigger,t.name])).map(t=>({key:`template:${t.id}`,kind:'template',template:t,trigger:'/'+t.trigger,label:t.name,detail:`/${t.trigger} · ${t.steps.length} pasos`}));
    return {entries:[...types,...choices].slice(0,8),token:{kind:'slash',start:0,end:state.value.length,title}};
  }
  function templateParent(session) {
    const depth=session.template.steps[session.index].depth;
    return depth===0 ? session.basePath : session.paths[depth-1] || null;
  }
  function advanceTemplate(session, path) {
    const current=session.template.steps[session.index];
    let index=session.index+1;
    const paths=session.paths.slice(0,current.depth);
    if(path) paths[current.depth]=path.slice();
    else while(index<session.template.steps.length&&session.template.steps[index].depth>current.depth) index++;
    return index<session.template.steps.length ? {...session,index,paths} : null;
  }
  function templateFromBranch(block, {id,name,trigger}) {
    const steps=[];
    function visit(node,depth){
      const {children,...copy}=node;
      steps.push({depth,block:copy});
      for(const child of children||[]) visit(child,depth+1);
    }
    visit(T.cloneBlock(block),0);
    return {id,name,trigger,steps};
  }
  Object.assign(T,{BUILTIN_TEMPLATES,validateTemplate,slashCompletions,templateParent,advanceTemplate,templateFromBranch});
})(typeof globalThis!=='undefined'?globalThis:this);
