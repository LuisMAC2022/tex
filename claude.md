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
