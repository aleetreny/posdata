# Verificación de la edición 2026-09-19

La verificación combina los datos originales, interacciones en navegadores reales y revisión visual. Las pruebas automatizadas no garantizan ausencia de todos los defectos ni acreditan por sí solas accesibilidad completa.

## Datos

Siete comprobaciones en `tests/data.test.mjs` contrastan los totales SED originales, cobertura de sus 16 grandes áreas, estados LEO disjuntos, identificadores de observación únicos, integridad de las 196 matrices, procedencia y datos ausentes de los 6.512 registros de Economía, y alcance y granularidad de SDR.

Se conservan valores suprimidos y desconocidos. Las cifras ponderadas, las muestras, los denominadores y los periodos no se mezclan. `public/data/manifest.json` recoge las URLs y SHA-256 de las descargas; `DATA_LICENSES.md` recoge las condiciones de reutilización.

## Interacción y presentación

La última ejecución local de `tests/browser.mjs` completó 17 escenarios, 16 combinaciones de vista y viewport y 51 comprobaciones geométricas, sin errores de navegador ni incidencias axe en las comprobaciones WCAG A/AA ejecutadas.

- Las ocho vistas se capturan a 1440 y 390 px; además se comprueba el ancho de página a 320, 375, 768 y 1280 px. Las tablas anchas usan desplazamiento local y acceso por teclado.
- Se abren las 196 matrices, las 68 fichas de fuentes y las 14 lecturas, y se ejercitan las 18 opciones guardables.
- Se comprueban cambios de fuente, disciplina, cohorte y horizonte; búsqueda sin sensibilidad a tildes; comparación de hasta cuatro disciplinas, enlaces compartibles y estado vacío; filtros y paginación de destinos; CSV, BibTeX y exportación de opciones.
- Se prueban historial del navegador, cambio de idioma, persistencia local, foco de teclado y recuperación tras un fallo de descarga.
- Chromium cubre la batería principal. WebKit móvil comprueba la navegación de las ocho vistas y el selector de fuente.
- La revisión visual independiente inspeccionó 22 capturas de escritorio y móvil. Los dos ajustes solicitados fueron explicitar la cobertura de ciencias, ingeniería y salud en SDR y mantener visible la pestaña activa en el menú móvil. Ambos se corrigieron y el pase de veredicto quedó cerrado como `ship`.

El detector de patrones visuales se ejecutó una vez en modo regex degradado, sin coincidencias. Ese resultado no se usa como prueba de contraste calculado. Las capturas, los resultados axe y el informe de navegador constituyen la evidencia más relevante.

## Publicación reproducible

[GitHub Actions](https://github.com/aleetreny/posdata/actions/workflows/pages.yml) ejecuta las pruebas de datos, compila, verifica el artefacto de producción en Chromium y WebKit y publica ese mismo artefacto. Cada ejecución conserva el informe y las capturas como artefactos descargables.

`release.json` en la web publicada identifica el commit y la fecha de compilación. La comprobación posterior al despliegue contrasta ese identificador y los hashes de los datos con la copia local, y vuelve a ejecutar los escenarios contra la URL pública para comprobar también rutas relativas y enlaces profundos.

## Límites de lo comprobado

El directorio incluye fuentes que no están integradas como datos. Los enlaces externos pueden exigir cookies o bloquear peticiones automáticas; no se certifica su disponibilidad futura. No se ha realizado una auditoría manual exhaustiva con lectores de pantalla. El contenido documental conserva algunos textos en el idioma original. La cobertura de empleadores individuales sigue limitada al archivo histórico de Economía y no representa empleo actual.
