import test, {after} from "node:test";
import assert from "node:assert/strict";
import { cerrar, irAlPanel, omitir, sesionDePrueba } from "./navegador.mjs";
after(cerrar);
test("un error real ofrece copiar el informe y Más permite consultarlo y borrarlo", {skip:omitir}, async t=>{
  const {pagina:p,errores,contexto}=await sesionDePrueba(t,"Pixel 7");
  await irAlPanel(p,"Estructura");
  const thrown=p.waitForEvent("pageerror");
  await p.evaluate(()=>setTimeout(()=>{throw Error("Fallo deliberado de dibujo");},0));
  assert.equal((await thrown).message,"Fallo deliberado de dibujo");
  assert.deepEqual(errores.splice(0),["Fallo deliberado de dibujo"]);
  await p.locator("#error-notice").getByRole("button",{name:"Copiar informe"}).waitFor();
  await irAlPanel(p,"Más"); await p.getByText("Informe de errores",{exact:true}).click();
  const report=p.locator("#error-report-text");
  assert.match(await report.inputValue(),/Fallo deliberado de dibujo/); assert.match(await report.inputValue(),/Estructura/);
  await contexto.grantPermissions(["clipboard-read","clipboard-write"]);
  await p.locator("#error-report-copy").click();
  assert.match(await p.evaluate(()=>navigator.clipboard.readText()),/Fallo deliberado de dibujo/);
  await p.reload(); await irAlPanel(p,"Más"); await p.locator("#error-report > summary").click();
  assert.match(await report.inputValue(),/Fallo deliberado de dibujo/);
  await p.click("#error-report-clear");
  assert.equal(await report.inputValue(),""); assert.equal(await p.locator("#error-notice").isVisible(),false);
});
test("una promesa rechazada se registra en la misma sesión y conserva un único aviso", {skip:omitir}, async t=>{
  const {pagina:p,errores}=await sesionDePrueba(t);
  for(const message of ["Rechazo de prueba","Segundo rechazo"]){
    const err=p.waitForEvent("pageerror");
    await p.evaluate(m=>{setTimeout(()=>{Promise.reject(Error(m));},0);},message);
    assert.equal((await err).message,message); assert.deepEqual(errores.splice(0),[message]);
  }
  await p.locator("#error-notice").waitFor(); assert.equal(await p.locator("#error-notice:visible").count(),1);
  await p.locator("#error-report > summary").click();
  assert.ok((await p.locator("#error-report-text").inputValue()).includes("Segundo rechazo"));
});
