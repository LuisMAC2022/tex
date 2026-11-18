---
type: decision
status: accepted
date: 2026-11-18
project: tex
tags: [listas, accesibilidad, latex]
commit: 82ec9dc
---

# DEC-012 — Listas anidadas mediante sangría y marcadores

La sangría permite pegar una lista completa y editarla en un solo campo. Se
miden dos espacios o un tabulador por nivel. La primera línea fija la raíz y
los saltos de más de un nivel se recortan para que cada sublista tenga un elemento
padre. Se conserva la estructura de bloques de «Añadir dentro» para alojar otros
contenidos.

El tipo del bloque fija la lista raíz. La primera línea que abre una sublista
cambia su tipo con `- ` o `* `, o con un número seguido de `. ` o `) `. Los demás
marcadores se consumen al pegar listas. El número que se escribió sirve como
marcador de edición y LaTeX sigue manejando la numeración del documento.
Para conservar un guion inicial se antepone `{}` en el propio campo, de acuerdo
con [DEC-004](DEC-004-contenido-sin-escapar.md).

Se conservan todos los elementos cuando un nivel supera el límite de LaTeX.
Los subniveles se aplanan y, si un bloque entero queda fuera del límite, se
emite como párrafos. Así se pueden conservar también los elementos de una lista
contenida directamente en un teorema, donde un `\item` suelto no representa una
lista válida.

Alt+Mayús+G y Alt+Mayús+Q sustituyen las combinaciones propuestas con flechas.
En macOS, Opción+Mayús y las flechas seleccionan hasta el límite de la palabra
en el campo de texto. Las letras conservan esa función nativa y los atajos se
aplican solo en «Contenido» al editar una lista.
