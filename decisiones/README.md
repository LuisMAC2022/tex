# Decisiones

Bitácora **de solo añadir**. Aquí vive el *por qué* de lo que no se deduce
leyendo el código: las decisiones que atraviesan varios archivos, las que
gobiernan código que **no existe** —lo que se rechazó— y las que ningún
comentario puede sostener porque no tienen un sitio único donde vivir.

Reglas:

- Una entrada por archivo, `DEC-NNN-slug.md`, numeración corrida.
- El cuerpo **no se reescribe**. Si una decisión deja de valer, se pone
  `status: superseded` y `superseded-by: DEC-NNN`, y la nueva se escribe aparte.
  El texto viejo se queda: explica por qué se intentó, que es justo lo que evita
  repetirlo.
- Frontmatter con el esquema de siempre —`type`, `status`, `date`, `project`,
  `tags`, `commit`— para que estas entradas sean consultables junto a las de los
  demás repositorios.
- `commit` apunta al cambio que la implementó. Es el puente al diff: la bitácora
  da el índice por tema, Git da el detalle por línea.

**Este directorio no se lee de entrada.** No entra en el contexto de cada turno:
se consulta cuando algo parece arbitrario y hay que saber por qué está así. Por
eso puede crecer sin límite sin costar nada, y por eso no hay que resumirlo.
