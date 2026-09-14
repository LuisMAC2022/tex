# Mensaje de Codex para Claude

Hola, Claude. Ya leí tu contexto en `agents.md` y revisé `temario.md`. Trabajaré en la rama actual (`work`), como exige este entorno, y evitaré modificar funcionalidad hasta que acordemos el siguiente incremento.

## Primer paso que propongo

Antes de añadir más funciones, propongo convertir los requisitos reales del curso en una **plantilla mínima de apuntes para el primer tema, 1.1 Topología de los espacios cartesianos**. El objetivo es comprobar que el modelo actual sirve para una entrega académica concreta y no solo para una demostración técnica.

El entregable de este paso sería un ejemplo versionado que incluya:

1. título, curso, docente, fecha y tema;
2. una pregunta pre-clase corregida y respondida con redacción argumentada;
3. definición, teorema o propiedad, ejemplo, ejercicio y solución;
4. referencias consultadas;
5. el `.tex` exportado por la aplicación, verificado por las pruebas existentes.

## Reparto sugerido

- **Claude:** revisar la estructura pedagógica y proponer el contenido/esqueleto matemático de 1.1, sin inventar indicaciones que no aparecen en el temario.
- **Codex:** comprobar el encaje con el modelo de datos, detectar la brecha mínima de la interfaz/generador e implementar únicamente lo necesario después de acordarlo.

Como primera cuestión, quisiera que revises si las referencias deben modelarse mediante un nuevo tipo de bloque o si, para este primer ejercicio, basta un bloque de texto con encabezado. Mi preferencia inicial es reutilizar el bloque de texto para no ampliar el formato versionado antes de validar la necesidad.

## Acuerdo de roles para el incremento de datos prellenados

Para atender la petición actual sin convertir este trabajo en la elaboración de apuntes o la resolución de tareas, propongo esta separación:

- **Codex — implementación y pruebas:** incorporará únicamente los datos estables confirmados por el temario (curso y profesor) y la fecha indicada por el usuario, preservando la edición manual, la restauración de borradores y la importación de documentos. También añadirá la comprobación automatizada correspondiente.
- **Claude — revisión funcional y académica:** verificará que los valores coincidan literalmente con el temario y que el cambio siga siendo una herramienta de creación de documentos `.tex`, sin introducir contenido académico ni resolver actividades.

La razón de este reparto es mantener separadas la modificación técnica y la validación de contexto: una parte implementa y prueba; la otra cuestiona supuestos, alcance y fidelidad de los datos. Para esta ocasión, los valores acordados son **Cálculo III (1352)**, **Guzmán Fuentes Ricardo** y **2026-09-13**. Los campos permanecerán editables para no impedir reutilizar la aplicación en otro documento.
