# Posdata

**Del doctorado al siguiente destino.** Trayectorias profesionales desde Europa hacia todo el mundo, con otros orígenes disponibles, evidencia enlazada y límites explícitos.

[Abrir la web](https://aleetreny.github.io/posdata/) · [Método](https://aleetreny.github.io/posdata/?view=methods) · [Fuentes](https://aleetreny.github.io/posdata/?view=sources)

## Qué se puede explorar

- 808.860 perfiles ORCID con doctorado de investigación terminado y empleos posteriores fechados: 310.582 con formación doctoral en Europa y 194.140 en Estados Unidos. Se recorrieron los 26.078.951 perfiles del archivo público completo de 2025; el [manifiesto de trayectorias](public/data/trajectories/manifest.json) acredita los recuentos y la integridad del original. Una extracción provisional no puede publicarse.
- Explorador generalista por disciplina, persona, institución, empresa, función, sector, fechas y países de origen/destino independientes. Europa es el filtro inicial; EE. UU. y el resto del mundo están disponibles. Primer empleo observado o último inicio registrado, historial y fuente por perfil, distribuciones y CSV de la selección.
- ROR v2.12, 137.398 organizaciones, para clasificar sectores con reglas de enlace visibles. Veintiuna categorías de disciplina, incluidas áreas no identificadas y múltiples; función y sector permanecen separados.
- 295 fichas complementarias extraídas de Oxford Philosophy, Glasgow MCMP y Università Cattolica Science. Se buscan por separado y no se suman a ORCID: nombres coincidentes no bastan para deduplicar fuentes.
- Navegación móvil fija con cuatro accesos y menú completo, recuento visible y salto directo a resultados; tema terracota. Español e inglés, enlaces de estado y procesamiento de filtros en el dispositivo.

- Cuatro colecciones estadísticas: SED 2024, SDR 2023, IP Doc de Francia y LEO de Inglaterra. 1.273 observaciones agregadas por disciplina, cohorte y horizonte, sin sumar poblaciones solapadas.
- Todas las 16 grandes áreas de SED, con subcampos; 87 filas de disciplinas y agregados. SDR añade 98 filas y errores estándar. Francia aporta 80 observaciones nacionales y 1.010 institucionales. LEO aporta 1.008 observaciones, hasta diez años después del título.
- 6.512 registros históricos de destinos en Economía, de 29 departamentos. Búsqueda por empleador/persona, filtros por origen, año y etiqueta, y exportación. No equivalen a empleo actual ni a 6.512 personas identificadas únicas.
- 196 tablas oficiales consultables, conservando encabezados y valores suprimidos, con descarga del Excel original.
- 18 funciones profesionales para explorar, una lista personal que se guarda localmente, 14 lecturas comentadas y 75 fuentes catalogadas.
- Comparación de hasta cuatro disciplinas dentro de una misma población, CSV, BibTeX, enlaces que retienen el contexto del atlas y la comparación, y una interfaz en español e inglés. Las categorías no traducidas y las fichas documentales conservan su idioma original.

ORCID es voluntario y favorece a quienes siguen vinculados a investigación. Último registro no significa empleo actual. Es una edición amplia y reproducible, no un censo mundial ni una predicción de la carrera de una persona. La profundidad y la actualidad varían entre países. El [contrato editorial](PRODUCT.md) y la página de método explican qué significa cada dato.

## Desarrollo

Node.js 22 o 24 y pnpm 11.19.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm build
```

Los datos procesados están versionados en `public/data/`; no hacen falta servicios externos, claves API, cuentas o conexión a las fuentes para usar el visor.

## Reproducir la extracción

Python 3.12 con las dependencias de `requirements-data.txt`.

```sh
python -m venv .venv
. .venv/bin/activate
pip install -r requirements-data.txt
python scripts/fetch_data.py
python scripts/build_data.py
pnpm test
```

Las descargas originales quedan en `data/raw/`, fuera de Git. El proceso reutiliza los archivos ya presentes. Para actualizar una fuente, elimina solo su snapshot y vuelve a ejecutar la descarga; revisa también su año, esquema, licencia y fecha de recuperación. El manifiesto documenta la edición actual. Los archivos fuente de una futura edición pueden requerir adaptar el parser; no se promete actualización automática sin revisión.

### Trayectorias ORCID, organizaciones y listas universitarias

```sh
python scripts/fetch_ror.py
python scripts/fetch_orcid.py
python scripts/parse_orcid.py
python scripts/build_trajectories.py
python scripts/extract_university_careers.py
```

La descarga ORCID ocupa 46,3 GB comprimidos. Se conserva dividida en rangos reanudables: no se expande todo el XML. El parser también puede ejecutarse en otra terminal mientras el descargador trabaja; espera los fragmentos completos y comprueba el checksum del archivo entero. No descargues el paquete adicional de actividades. El constructor vuelve a validar grados y cronología, resuelve organizaciones y crea los fragmentos comprimidos que usa la web.

`python scripts/build_trajectories.py --preview` permite desarrollar con un prefijo real de la extracción. Marca obligatoriamente `complete: false`; el comando de publicación lo rechaza. Los títulos no reconocidos, estancias de intercambio, candidaturas, fechas ausentes y sectores no identificables no se inventan. Consulta [las reglas y límites de las trayectorias](docs/TRAJECTORY_METHOD.md).

Las listas universitarias se extraen del HTML guardado; para revisar una edición nueva hay que renovar esas copias y comprobar cambios de estructura, recuentos, fechas y condiciones de reutilización. No se promete una actualización automática sin revisión.

## Verificación

```sh
pnpm exec playwright install chromium webkit
pnpm dev
# en otra terminal, contra http://127.0.0.1:5173/
pnpm verify
python -m unittest discover -s tests -p 'test_*.py'
```

La verificación cubre las nueve vistas, Chromium y WebKit móvil, anchos de 320 a 1440 px, accesibilidad automatizada, 196 aperturas de tabla, 75 fichas de fuente, los controles de destinos, filtros, comparación, descargas, idioma, historial y opciones guardadas. El nuevo explorador añade pruebas de búsqueda mundial, movilidad Europa→EE. UU., historiales, compresión y consultas en worker, CSV, filtros persistentes, errores y menú móvil. Once pruebas Python comprueban grado/fechas/clasificación; las pruebas Node verifican unicidad y huellas de todos los fragmentos. La revisión visual complementa las pruebas; el éxito de un analizador no acredita por sí solo accesibilidad completa.

`BASE_URL` permite verificar un despliegue. En macOS, el test usa Chrome instalado; en CI usa Chromium de Playwright. Las capturas y el informe se generan en `.impeccable/review/` y `test-results/`.

GitHub Actions compila, ejecuta pruebas de datos y navegador y publica el artefacto validado en GitHub Pages. La navegación usa query parameters para que los enlaces profundos funcionen sin un servidor de rutas.

## Estructura

`src/` contiene el visor, textos editoriales y estilos. `scripts/` contiene adquisición y normalización. `data/source-directory.csv` es el catálogo de investigación. `public/data/` contiene los snapshots procesados. `tests/` contiene comprobaciones contra totales originales y escenarios de uso. `PRODUCT.md` y `DESIGN.md` registran las decisiones del producto y del diseño.

## Licencias y atribución

Código MIT. Cada dataset conserva sus condiciones y atribución: [DATA_LICENSES.md](DATA_LICENSES.md). No se redistribuyen microdatos restringidos, perfiles privados ni artículos completos. Fuentes tipográficas autoalojadas; sin analítica de terceros.
