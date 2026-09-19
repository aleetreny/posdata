# Posdata

**Un doctorado. Muchos destinos.** Un atlas abierto para explorar salidas profesionales con datos verificables, límites explícitos y una biblioteca de estudios.

[Abrir la web](https://aleetreny.github.io/posdata/) · [Método](https://aleetreny.github.io/posdata/?view=methods) · [Fuentes](https://aleetreny.github.io/posdata/?view=sources)

## Qué se puede explorar

- Cuatro colecciones estadísticas: SED 2024, SDR 2023, IP Doc de Francia y LEO de Inglaterra. 1.273 observaciones agregadas por disciplina, cohorte y horizonte, sin sumar poblaciones solapadas.
- Todas las 16 grandes áreas de SED, con subcampos; 87 filas de disciplinas y agregados. SDR añade 98 filas y errores estándar. Francia aporta 80 observaciones nacionales y 1.010 institucionales. LEO aporta 1.008 observaciones, hasta diez años después del título.
- 6.512 registros históricos de destinos en Economía, de 29 departamentos. Búsqueda por empleador/persona, filtros por origen, año y etiqueta, y exportación. No equivalen a empleo actual ni a 6.512 personas identificadas únicas.
- 196 tablas oficiales consultables, conservando encabezados y valores suprimidos, con descarga del Excel original.
- 18 funciones profesionales para explorar, una lista personal que se guarda localmente, 14 lecturas comentadas y 68 fuentes catalogadas.
- Comparación de hasta cuatro disciplinas dentro de una misma población, CSV, BibTeX, enlaces que retienen el contexto del atlas y la comparación, y una interfaz en español e inglés. Las categorías no traducidas y las fichas documentales conservan su idioma original.

Es una edición amplia y reproducible, no un censo mundial ni una predicción de la carrera de una persona. La profundidad y la actualidad varían entre países. El [contrato editorial](PRODUCT.md) y la página de método explican qué significa cada dato.

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

## Verificación

```sh
pnpm exec playwright install chromium webkit
pnpm dev
# en otra terminal, contra http://127.0.0.1:5173/
pnpm verify
```

La verificación cubre las ocho vistas, Chromium y WebKit móvil, anchos de 320 a 1440 px, accesibilidad automatizada, 196 aperturas de tabla, 68 fichas de fuente, los controles de destinos, filtros, comparación, descargas, idioma, historial y opciones guardadas. La revisión visual complementa las pruebas; el éxito de un analizador no acredita por sí solo accesibilidad completa.

`BASE_URL` permite verificar un despliegue. En macOS, el test usa Chrome instalado; en CI usa Chromium de Playwright. Las capturas y el informe se generan en `.impeccable/review/` y `test-results/`.

GitHub Actions compila, ejecuta pruebas de datos y navegador y publica el artefacto validado en GitHub Pages. La navegación usa query parameters para que los enlaces profundos funcionen sin un servidor de rutas.

## Estructura

`src/` contiene el visor, textos editoriales y estilos. `scripts/` contiene adquisición y normalización. `data/source-directory.csv` es el catálogo de investigación. `public/data/` contiene los snapshots procesados. `tests/` contiene comprobaciones contra totales originales y escenarios de uso. `PRODUCT.md` y `DESIGN.md` registran las decisiones del producto y del diseño.

## Licencias y atribución

Código MIT. Cada dataset conserva sus condiciones y atribución: [DATA_LICENSES.md](DATA_LICENSES.md). No se redistribuyen microdatos restringidos, perfiles privados ni artículos completos. Fuentes tipográficas autoalojadas; sin analítica de terceros.
