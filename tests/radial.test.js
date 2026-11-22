import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
import { T, fragmentBlocks } from "./radial-fixtures.mjs";
const area = { width: 800, height: 700 }, point = { x: 340, y: 330 };
const circle = Math.PI * 2;
const move = (r, a) => ({ x: point.x + r * Math.sin(a), y: point.y - r * Math.cos(a) });
test("los sectores empiezan arriba, giran a la derecha y asignan el borde al siguiente", () => {
  for (const n of [4,8]) {
    for (let i = 0; i < n; i++) {
      assert.equal(T.sectorAt(i * circle / n, n), i);
      assert.equal(T.sectorAt((i + .5) * circle / n, n), (i + 1) % n);
    }
  }
  assert.equal(T.angleOf(0,-10), 0); assert.equal(T.angleOf(10,0), Math.PI / 2);
  assert.equal(T.sectorAt(0,4,-Math.PI/2,Math.PI),2);
  assert.equal(T.sectorAt(Math.PI/2,4,-Math.PI/2,Math.PI),-1);
  assert.equal(T.sectorAt(Math.PI,4,-Math.PI/2,Math.PI),-1);
});
test("espera, cancelación, zona muerta, vibración y submenús en los dos modos", () => {
  const slices = T.slicesFor("formula"), root = T.fitMenu(point,area,slices.length);
  const layout = { slices, root, child: i => T.fitMenu(point,area,slices[i].children.length,{ ...root, angle:T.centerAngle(root,i) }) };
  const step = (s,e) => T.radialReduce(s,e,layout);
  const down = step(null,{type:"down",point});
  assert.equal(step(down,{type:"hold",ms:399}).phase,"waiting");
  assert.equal(step(down,{type:"move",point:move(11,0)}).phase,"idle");
  const open = step(down,{type:"hold",ms:400});
  assert.equal(open.phase,"drag");
  for (const type of ["second","hidden","scroll","cancel"]) assert.ok(step(open,{type}).cancelled);
  assert.equal(step(open,{type:"move",point:move(19,0)}).highlight,-1);
  assert.ok(step(open,{type:"up",point:move(19,0)}).cancelled);
  const hi = step(open,{type:"move",point:move(50,0)});
  assert.ok(hi.haptic); assert.equal(step(hi,{type:"move",point:move(52,0)}).haptic,false);
  assert.equal(step(hi,{type:"up",point:move(52,0)}).action.type,"insert");
  const a = T.centerAngle(root,7);
  const sub = step(open,{type:"move",point:move(126,a)});
  assert.equal(sub.parent,7);
  assert.equal(step(sub,{type:"move",point:move(50,a)}).parent,-1);
  assert.equal(step(sub,{type:"up",point:move(150,T.centerAngle(layout.child(7),0))}).action.symbol,"alpha");
  const tap = step(open,{type:"up",point:move(52,a)});
  assert.equal(tap.phase,"tap"); assert.equal(tap.parent,7);
  assert.equal(step(tap,{type:"pick",index:1}).action.symbol,"beta");
  assert.equal(step(tap,{type:"escape"}).parent,-1);
});
test("el catálogo radial deriva referencias válidas y conserva objetivos de 44 píxeles", () => {
  assert.deepEqual(T.RADIAL_MENUS.map(m => m.context),["formula","text","image","global"]);
  const ids = new Set(), actions = new Set(["insert","symbol","command","submenu","blockTypes"]);
  function walk(items) {
    assert.ok(items.length > 0 && items.length <= 8);
    for (const slice of items) {
      assert.ok(slice.label && slice.icon); assert.ok(!ids.has(slice.id),slice.id); ids.add(slice.id);
      const a = slice.action; assert.ok(actions.has(a.type));
      if (a.type === "insert") assert.ok(T.validSnippetMarkers(a.snippet));
      if (a.type === "symbol") assert.ok(T.MATH_SYMBOLS.some(s => s.id === a.symbol));
      if (a.type === "blockTypes") assert.ok(a.ids.every(id => T.blockType(id)));
      if (a.type === "command") assert.ok(T.RADIAL_COMMANDS.includes(a.name));
      if (slice.children) walk(slice.children);
    }
    for (const ring of [T.fitMenu(point,area,items.length),T.fitMenu({x:16,y:679,bar:true},area,items.length),
      T.fitMenu(point,area,items.length,{outer:104,angle:0}),T.fitMenu({x:8,y:8},area,items.length,{outer:104,angle:0})]) {
      assert.ok(ring.outer-ring.inner >= 44 && ring.span * (ring.outer+ring.inner) / 2 / items.length >= 44,ring.kind);
    }
  }
  for(const m of T.RADIAL_MENUS) walk(T.slicesFor(m.context));
  assert.equal(T.fitMenu(point,area,8,{outer:104,angle:0}).kind,"fan");
  assert.equal(T.fitMenu({x:8,y:8},area,8,{outer:104,angle:0}).kind,"replacement");
});
test("los fragmentos radiales envuelven la selección literal y comparten los huecos", () => {
  for (const [source,value,start,end,expected,cursor] of [
    ["\\frac{#1}{#2}#0","",0,0,"\\frac{}{}",6],
    ["\\frac{#1}{#2}#0","axb",1,2,"a\\frac{x}{}b",10],
    ["$#1$#0","ab",0,2,"$ab$",4], ["x#0y","",0,0,"xy",1],
    ["\\#1{}","",0,0,"\\#1{}",5], ["$#1$#0","#1",0,2,"$#1$",4],
  ]) {
    const {edit} = T.applyRadialSnippet({value,selectionStart:start,selectionEnd:end},source);
    assert.equal(edit.value,expected); assert.equal(edit.selectionStart,cursor);
  }
});
test("todos los fragmentos radiales pasan KaTeX en su contexto y la comprobación previa", async () => {
  const ctx = vm.createContext({}); vm.runInContext(await readFile("assets/vendor/katex/katex.min.js","utf8"),ctx);
  for (const block of fragmentBlocks) {
    for (const s of T.mathSegments(block.content,block.type)) assert.doesNotThrow(() => ctx.katex.renderToString(s.math,{throwOnError:true,strict:false}),block.content);
    assert.deepEqual(structuredClone(T.checkBlock(block)).filter(i => i.severity==="error"),[],block.content);
  }
});
