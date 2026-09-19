# Posdata

**¿Dónde lleva un doctorado?** Explora personas, empleadores, sectores y salidas profesionales, con la fuente detrás de cada resultado.

[**Abrir Posdata →**](https://aleetreny.github.io/posdata/) · [English interface](https://aleetreny.github.io/posdata/?lang=en) · [Método](docs/TRAJECTORY_METHOD.md)

## Encuentra una respuesta

| Tu pregunta | Por dónde empezar |
| --- | --- |
| ¿Dónde trabajan personas de mi disciplina? | **Trayectorias**: elige disciplina y sector; abre una ficha para seguir los empleos declarados. |
| ¿Dónde acaban quienes hicieron el doctorado en una universidad concreta? | En el buscador, elige **Universidad del doctorado**. **Empleador** busca exclusivamente el destino laboral. |
| ¿Qué proporción va a empresa? ¿Cuánto gana? | **Estadísticas**: elige población, disciplina y momento. **Comparar** mantiene el mismo contexto. |
| ¿Qué trabajos podría explorar? | **Salidas**: 18 funciones, ejemplos enlazados y una lista personal guardada en tu navegador. |
| ¿De dónde sale una cifra? | **Fuentes**, **Estudios** y **Tablas** conservan procedencia, definiciones y descargas. |

## Qué contiene

- **808.860 perfiles ORCID** con doctorado terminado y empleos posteriores fechados; 1.723.995 registros laborales. Europa es el filtro inicial, con orígenes y destinos de todo el mundo disponibles.
- **Cuatro colecciones estadísticas**: SED 2024 y SDR 2023 (EE. UU.), IP Doc (Francia) y LEO (Inglaterra). 1.273 observaciones agregadas y 196 tablas originales.
- **295 fichas universitarias** y **6.512 destinos históricos de Economía**, consultables por separado.
- **76 fuentes catalogadas**, 14 lecturas comentadas, filtros compartibles y exportación de resultados.

ORCID es voluntario y favorece a quienes siguen en investigación: sus porcentajes describen este archivo, **no tus probabilidades de empleo**. El último puesto registrado puede no ser actual. Las encuestas conservan sus propias poblaciones y denominadores; no se suman fuentes solapadas.

Los sectores combinan ROR con reglas documentadas para variantes de nombre y centros universitarios. Una universidad privada pertenece a educación. Cada historial distingue identidad enlazada, unidad universitaria, categoría deducida del nombre y casos sin resolver. [Reglas de clasificación](docs/TRAJECTORY_METHOD.md#clasificación-del-empleador).

## Ejecutar en local

Requiere Node.js 22 o 24 y pnpm 11.19.0. Los datos procesados están incluidos; no se necesitan claves ni servicios externos.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

```sh
pnpm test
pnpm build
```

[Desarrollo, extracción y pruebas de navegador](docs/DEVELOPMENT.md) · [Verificación](docs/VERIFICATION.md) · [Criterios del producto](docs/PRODUCT.md) · [Diseño](DESIGN.md)

## Organización

- `src/`: aplicación React, TypeScript y estilos.
- `scripts/`: descarga, extracción, clasificación y control de publicación.
- `data/`: catálogo, procedencia y correcciones revisadas. Los originales de gran tamaño se guardan en `data/raw/`, fuera de Git.
- `public/data/`: edición procesada que sirve la web, con manifiestos y huellas SHA-256.
- `tests/`: integridad de datos, reglas de clasificación y recorridos de navegador.

GitHub Actions verifica y publica en GitHub Pages. Español e inglés, fuentes tipográficas autoalojadas, sin cuentas ni analítica de terceros.

## Licencias

Código [MIT](LICENSE). Cada fuente conserva sus condiciones y atribución: [licencias de datos](DATA_LICENSES.md). ORCID y ROR se reutilizan bajo CC0; las listas universitarias tienen condiciones diferentes.
