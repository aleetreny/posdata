# Desarrollo y reproducción

## Ejecutar la web

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

`python scripts/build_trajectories.py --preview` permite desarrollar con un prefijo real de la extracción. Marca obligatoriamente `complete: false`; el comando de publicación lo rechaza. Los títulos no reconocidos, estancias de intercambio, candidaturas, fechas ausentes y sectores no identificables no se inventan. Consulta [las reglas y límites de las trayectorias](TRAJECTORY_METHOD.md).

Las listas universitarias se extraen del HTML guardado; para revisar una edición nueva hay que renovar esas copias y comprobar cambios de estructura, recuentos, fechas y condiciones de reutilización. No se promete una actualización automática sin revisión.

## Verificación

```sh
pnpm exec playwright install chromium webkit
pnpm dev
# en otra terminal, contra http://127.0.0.1:5173/
pnpm verify
python -m unittest discover -s tests -p 'test_*.py'
```

La verificación cubre las nueve vistas, Chromium y WebKit móvil, anchos de 320 a 1440 px, accesibilidad automatizada, 196 aperturas de tabla, 76 fichas de fuente, los controles de destinos, filtros, comparación, descargas, idioma, historial y opciones guardadas. El nuevo explorador añade pruebas de búsqueda mundial, movilidad Europa→EE. UU., historiales, compresión y consultas en worker, CSV, filtros persistentes, errores y menú móvil. Las pruebas Python comprueban grado, fechas y clasificación; las pruebas Node verifican unicidad y huellas de todos los fragmentos. La revisión visual complementa las pruebas; el éxito de un analizador no acredita por sí solo accesibilidad completa.

`BASE_URL` permite verificar un despliegue. En macOS, el test usa Chrome instalado; en CI usa Chromium de Playwright. Las capturas y el informe se generan en `.impeccable/review/` y `test-results/`.

GitHub Actions compila, ejecuta pruebas de datos y navegador y publica el artefacto validado en GitHub Pages. La navegación usa query parameters para que los enlaces profundos funcionen sin un servidor de rutas.


Los originales y los archivos de trabajo quedan fuera de Git. Se reutilizan las descargas existentes; reconstruir sectores solo requiere `build_trajectories.py`, sin descargar ni recorrer de nuevo el archivo ORCID.
