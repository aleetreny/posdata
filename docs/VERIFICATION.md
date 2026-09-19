# Verificación de la edición 2026-09-19

Se combina inspección de las fuentes, pruebas reproducibles y uso manual del sitio. El éxito de las pruebas no garantiza ausencia de todos los defectos ni accesibilidad completa.

## Datos y clasificación

- **20 pruebas Python** comprueban reconocimiento de doctorados, fechas, funciones y clasificación de organizaciones. Incluyen facultades de Lisboa, NOVA, variantes de nombres, escuelas de medicina, identificadores contradictorios y contraejemplos de hospitales y editoriales.
- **11 pruebas Node** comprueban las cuatro colecciones estadísticas, las 196 matrices, los 6.512 registros de Economía y sus 23 correcciones documentadas, además de unicidad, recuentos, categorías, referencias y SHA-256 de todos los fragmentos ORCID.
- La revisión conserva **808.860 perfiles y 1.723.995 empleos**. Una comparación completa de los índices anteriores y nuevos confirma la reducción de los últimos empleos sin sector de 217.059 a 133.178. Se reclasifican como educación 1.769 registros antes desconocidos cuyo empleador contiene Lisboa o Lisbon; esto no supone revisar individualmente todos los empleadores de la ciudad.

Se conservan valores suprimidos, categorías desconocidas, textos originales y fechas incompletas. Poblaciones ponderadas, respuestas, denominadores y períodos no se mezclan. Los manifiestos documentan archivos y huellas; [las reglas de trayectorias](TRAJECTORY_METHOD.md) y [las licencias](../DATA_LICENSES.md) explican el alcance.

## Navegación y presentación

Las dos baterías de navegador completan **31 escenarios**: 17 para las vistas estadísticas y documentales y 14 para las trayectorias. Cubren las nueve vistas, Chromium y WebKit móvil, con anchos entre 320 y 1440 píxeles. La ejecución local no registra errores de navegador, desbordamientos de página ni infracciones en las comprobaciones axe WCAG A/AA ejecutadas. Las tablas anchas conservan desplazamiento local.

Se ejercitan filtros, búsqueda sin sensibilidad a tildes, sector, país de doctorado y empleo, búsqueda por empleador o universidad doctoral, primer y último empleo observado, historial y fuentes de cada ficha, enlaces compartidos, comparación de disciplinas, estados vacíos, paginación, idiomas, navegación atrás, recuperación de errores y descargas. También se abren las 196 tablas, las 76 fichas de fuentes y las 14 lecturas, y se prueban las 18 opciones guardables.

La revisión manual recorre las nueve vistas y comprueba tareas de visitantes: encontrar ejemplos de una disciplina, investigar un empleador, interpretar estadísticas de las cuatro fuentes, comparar disciplinas, explorar salidas, guardar opciones, consultar estudios y volver a la fuente. La comprobación en móvil incluye legibilidad, filtros, menú completo y acceso a resultados. Las capturas y los informes de las pruebas quedan como artefactos de CI, fuera del código del producto.

## Publicación

[GitHub Actions](https://github.com/aleetreny/posdata/actions/workflows/pages.yml) ejecuta las pruebas Python y Node, compila, verifica el artefacto en Chromium y WebKit y publica ese mismo artefacto. Cada ejecución conserva informes y capturas descargables.

El archivo público `release.json` identifica el commit y la compilación. Tras publicar, se contrasta esa revisión con Git, el manifiesto completo y las huellas de todos los índices, una muestra de historiales y los restantes datos públicos. La revisión del sitio publicado comprueba además navegación y enlaces con el prefijo de GitHub Pages.

## Límites

La clasificación combina registros públicos y reglas documentadas, no una comprobación individual de 808.860 personas. ORCID es voluntario y puede estar incompleto o desactualizado; sus porcentajes no representan a todos los doctorados. El catálogo incluye referencias que no están integradas. Los enlaces externos pueden cambiar o bloquear peticiones. No se ha realizado una auditoría exhaustiva con lectores de pantalla ni una prueba con usuarios externos. El contenido de las fuentes puede conservar su idioma original.

Los comandos para repetir las comprobaciones están en [Desarrollo y reproducción](DEVELOPMENT.md).
