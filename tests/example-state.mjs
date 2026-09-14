/** Estado de referencia compartido por la prueba y por la regeneración del ejemplo. */
export const exampleState = {
  metadata: { title: "Notas de Cálculo III", author: "Ana Pérez", course: "Cálculo III", teacher: "Dr. Ruiz", date: "2026-09-11", topic: "Integrales múltiples" },
  blocks: [
    { type: "definition", title: "Integral doble", content: "Sea f: A → R. La integral sobre A se escribe en la ecuación siguiente." },
    { type: "equation", title: "", content: "\\iint_A f(x,y) \\, dx \\, dy" },
    { type: "theorem", title: "Fubini", content: "Bajo las hipótesis del curso, el orden de integración no altera el resultado." },
    { type: "example", title: "Rectángulo", content: "Para f(x,y)=x+y en [0,1] \\times [0,2], calculamos el valor por iteración.\n\nEste bloque tiene dos párrafos y conserva el signo = como texto." },
    { type: "note", title: "", content: "La argumentación escrita cuenta para la calificación: no basta con el símbolo." },
  ],
};
