/**
 * Estado de referencia compartido por la prueba y por la regeneración del ejemplo.
 *
 * Cubre a propósito los contratos vigentes: bloques planos sin `children` —que
 * siguen siendo válidos—, un teorema con matemática delimitada en su prosa que
 * contiene una lista hija, y contenido literal con caracteres reservados
 * escapados por quien escribe (`\%`, `\&`), que es como se obtienen impresos
 * desde que la aplicación dejó de escapar el contenido.
 */
export const exampleState = {
  metadata: { title: "Notas de Cálculo III", author: "Ana Pérez", course: "Cálculo III", teacher: "Dr. Ruiz", date: "2026-09-11", topic: "Integrales múltiples" },
  blocks: [
    { type: "definition", title: "Integral doble", content: "Sea $f: A \\to \\mathbb{R}$ acotada en $A \\subseteq \\mathbb{R}^2$. La integral sobre $A$ se escribe en la ecuación siguiente." },
    { type: "equation", title: "", content: "\\iint_A f(x,y) \\, dx \\, dy" },
    {
      type: "theorem",
      title: "Fubini",
      content: "Bajo las hipótesis del curso, el orden de integración no altera el resultado: se cumple $\\iint_A f = \\int \\! \\int f \\, dx \\, dy$ siempre que",
      children: [
        { type: "itemize", title: "", content: "$f$ sea continua en el rectángulo $[a,b] \\times [c,d]$\nel 100\\% del recinto quede dentro de $A$ \\& sin cortes" },
      ],
    },
    { type: "example", title: "Rectángulo", content: "Para $f(x,y)=x+y$ en $[0,1] \\times [0,2]$, calculamos el valor por iteración con \\textbf{el orden natural}.\n\nEste bloque tiene dos párrafos y llega al .tex tal cual se escribió." },
    { type: "note", title: "", content: "La argumentación escrita cuenta para la calificación: no basta con el símbolo." },
  ],
};
