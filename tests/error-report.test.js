import test from "node:test";
import assert from "node:assert/strict";
import {loadTexNotes} from "./load-app.mjs";
const T=await loadTexNotes(["block-types.js","error-report.js"]);
test("el informe conserva veinte errores, tres líneas de pila y los más recientes primero",()=>{
  let items=[];
  for(let i=0;i<25;i++) items=T.recentErrors(items,T.errorRecord({message:"error "+i,stack:"primera\nsegunda\ntercera\ncuarta"},"","fecha","Estructura"));
  assert.equal(items.length,20);assert.equal(items[0].message,"error 5");assert.equal(items.at(-1).stack.length,3);
  const text=T.formatErrors(items);assert.match(text,/^fecha · Estructura\nerror 24/);assert.doesNotMatch(text,/cuarta/);
});
test("acepta rechazos sin pila, un valor ilegible y un almacén antiguo ilegible",()=>{
  assert.equal(T.errorRecord("razón",null,"fecha","Más").message,"razón");
  const hostile=new Proxy({},{get(){throw Error("no accesible");}});
  assert.equal(T.errorRecord(hostile,"sin detalles","fecha","Más").message,"sin detalles");
  assert.equal(T.formatErrors([null,{message:"incompleto"}]),"");
});
