# Trayectorias: alcance y reglas de la edición

El punto de partida es la institución del doctorado. El destino puede estar en cualquier país. Europa es el filtro inicial, no una nacionalidad atribuida a la persona ni un límite a los empleos que se muestran.

## Qué se extrae

La fuente individual principal es **ORCID Public Data File 2025**, una instantánea del 1 de octubre de 2025 distribuida bajo CC0. El proceso recorre el archivo oficial completo de resúmenes, de 46.328.319.190 bytes comprimidos. Comprueba su MD5 publicado, `210edf71f4a2bb44dd33aaa3037b3f17`, y calcula además SHA-256. Nunca expande a disco los aproximadamente 864 GB de XML.

Se conservan identificador, nombre público, educación doctoral, organizaciones, país y ciudad declarados de la afiliación, departamento, puesto, fechas y procedencia de la afirmación. No se extraen correos, teléfonos, domicilio personal, fecha de nacimiento ni características demográficas.

El manifiesto `public/data/trajectories/manifest.json` es la referencia de los recuentos y de la cobertura final. Una extracción local con `complete: false` es provisional. `scripts/release.mjs` impide publicarla como edición completa.

## Cobertura obtenida en esta edición

Se revisaron **26.078.951 perfiles** del archivo completo. **808.860 identificadores ORCID** cumplen las reglas y reúnen **1.723.995 registros laborales** después de eliminar afirmaciones laborales exactamente duplicadas dentro de cada perfil. De esos perfiles, **310.582** tienen su doctorado de referencia en Europa, **194.140** en Estados Unidos y **304.138** en otros lugares.

La disciplina queda sin identificar en 176.795 perfiles (21,9 %) y aparece como varias áreas en 109.738 (13,6 %). El sector del último inicio laboral queda sin identificar en 133.178 perfiles (16,5 %). Las categorías desconocidas permanecen en los denominadores. Estas proporciones describen la cobertura de este archivo, no la distribución poblacional de titulados ni sus probabilidades de empleo.

Entre los perfiles con doctorado europeo, 17.400 tienen en Estados Unidos el empleo con inicio más reciente registrado. Es un ejemplo de cómo origen y destino se consultan por separado; no acredita residencia ni empleo vigente.

## Inclusión y cronología

1. El título de la educación debe contener una marca explícita de doctorado de investigación reconocida por las reglas multilingües de `parse_orcid.py`. Incluyen PhD/DPhil y formas frecuentes en inglés, francés, español, portugués, italiano, alemán, neerlandés y lenguas escandinavas. No se deduce un doctorado de publicaciones, del cargo «profesor» o de un «Dr.» genérico. Las denominaciones no reconocidas quedan fuera: el archivo completo no implica reconocimiento exhaustivo de todas las lenguas o títulos.
2. Se excluyen candidaturas, estudios en curso, doctorados honoríficos y entradas explícitas de visita, intercambio, estancia «sandwich» o educación posdoctoral. Una estancia doctoral terminada no equivale al título de la universidad anfitriona. MD/JD y otras denominaciones profesionales por sí solas no acreditan un PhD.
3. Debe existir una fecha de finalización doctoral no futura respecto a la instantánea y no anterior a su inicio declarado. No se comprueba el diploma de forma independiente.
4. Se usa el primer doctorado terminado que cumple las reglas. Se requiere al menos un empleo con inicio fechado igual o posterior a esa finalización y no posterior a la instantánea. Se excluyen empleos claramente anteriores, sin inicio fechado, con cronología inválida o cuyo título identifica a un estudiante/candidato.
5. La precisión original se conserva como `[año, mes o 0, día o 0]`. Un mes ausente no se convierte en enero. Cuando faltan meses o días dentro del mismo período, el orden exacto entre doctorado y empleo queda incierto. La ficha del primer empleo lo señala.

La normalización vuelve a aplicar las reglas de grado, por lo que un extracto intermedio creado antes de endurecerlas no puede introducir una visita como título. Se eliminan afirmaciones laborales exactamente duplicadas dentro del perfil y se conservan distintos puestos, incluidos los simultáneos.

«Primer empleo posterior observado» es el primero que cumple estas reglas, no necesariamente el primer trabajo real de la persona. «Último inicio de empleo registrado» selecciona el puesto con el inicio más reciente. No significa empleo actual: puede tener fecha de fin o estar desactualizado. Un puesto sin fecha de fin no se certifica como vigente. En empates de fecha, el desempate es estable por organización y puesto; la ficha conserva todas las alternativas.

## Dimensiones separadas

| Dimensión | Evidencia y tratamiento |
| --- | --- |
| Disciplina doctoral | Reglas sobre departamento y título del doctorado. Se elimina el nombre genérico «Doctor of Philosophy» y sus variantes para no atribuir Filosofía a cualquier PhD. Una coincidencia da un área; varias dan «Varias áreas declaradas»; ninguna queda sin identificar. Son categorías de navegación, no códigos FORD/ISCED validados. |
| Organización de formación | Nombre y país declarados en la educación doctoral elegida. |
| Organización de empleo | Nombre original del empleo. Distintas grafías pueden corresponder al mismo empleador; los rankings por nombre no consolidan equivalencias no demostradas. |
| Sector | Tipos de **ROR v2.12**, 137.398 organizaciones, y reglas explícitas sobre nombres educativos. Se distingue una identidad enlazada de una universidad de referencia o una categoría deducida solo del nombre. Véase el procedimiento siguiente. |
| Función | Reglas sobre el título del puesto: posdoctorado explícito, docencia, datos/software, investigación, ingeniería, consultoría, dirección y clínica. «Research fellow» no prueba posdoctorado ni estabilidad. Las funciones no equivalen a contratos. |
| País y movilidad | Se preserva el país del empleo declarado, incluso cuando ROR sitúa la sede de la organización en otro país. Se compara con el país del doctorado, no con ciudadanía ni residencia actual. |

Los tipos ROR corresponden a su edición de agosto de 2026, aplicada a los registros históricos: no reconstruyen cambios de sector a lo largo del tiempo. ROR puede asignar varios tipos a una organización; la prioridad determinista usada por esta edición figura en el constructor. «Education» incluye universidades y otras organizaciones educativas; «facility» es infraestructura de investigación, no una prueba de contrato académico. «Añadido por integración de ORCID» no acredita por sí solo verificación del empleador.

La convención de Europa incluye íntegramente Rusia, Turquía y Chipre, además de Reino Unido, Suiza y otros países no pertenecientes a la UE. La lista exacta de códigos está en el manifiesto. Todos los países siguen disponibles como filtros individuales.

## Clasificación del empleador

El sector describe la actividad de la organización, no su titularidad. Una universidad pública o privada pertenece a **Universidades y educación**. «Sin identificar» no significa empresa privada ni empleo fuera de la academia.

1. Se consultan el identificador ROR y la correspondencia GRID declarados. También se busca una coincidencia única de nombre completo y país. Si esta señala otra organización sin relación registrada con la del identificador, se usa el nombre y se conserva el identificador en conflicto para inspeccionarlo. Por ejemplo, algunos registros de Trinity College Dublin apuntaban a un GRID de Nokia Ireland.
2. Sin un identificador utilizable, se prueban el nombre exacto, su normalización de tildes y puntuación y los acrónimos ROR de al menos cuatro letras escritos en mayúsculas. Siempre se exige una coincidencia única en el país declarado. No se aplica emparejamiento difuso por similitud.
3. Para una facultad, departamento u otra unidad académica, se permite enlazar una universidad de referencia cuyo nombre ROR completo aparezca de forma inequívoca en el texto. La ficha indica que se trata de la institución de referencia, no de la identidad ROR exacta de la unidad.
4. Un nombre explícito de universidad o escuela de medicina puede justificar la categoría educativa sin resolver la identidad. Se excluyen términos que señalan hospitales, editoriales, fundaciones, asociaciones, empresas y nombres compuestos. Esta regla también puede corregir un tipo ROR genérico como «other»; el tipo original permanece visible.
5. Los casos ambiguos sin evidencia suficiente siguen sin identificar. Se conserva el nombre original, la regla aplicada y la evidencia del enlace en cada historial. La clasificación describe esta edición y puede contener errores; no equivale a una revisión manual de cada empleador.

La revisión conserva los mismos 808.860 perfiles y 1.723.995 empleos. Reduce los últimos empleos sin sector de **217.059 a 133.178** (83.881 menos), sin convertir la ausencia de información en una categoría laboral. Las pruebas incluyen facultades de Lisboa, la distinción con NOVA, variantes de Berkeley, Purdue sin campus inventado, escuelas de medicina y contraejemplos de hospitales y editoriales. Las fixtures contienen únicamente registros ROR bajo CC0.

En el archivo independiente de Economía, `data/placement-corrections.json` documenta 23 correcciones de bancos centrales y BIS con enlaces de referencia. La etiqueta original se conserva junto a la revisada en la interfaz y en el CSV. El resto de etiquetas procede de la fuente histórica y no se presenta como revisado individualmente.

## Qué significan las cifras

Una trayectoria principal corresponde a un **identificador ORCID único**, no a una identidad real verificada ni a un registro censal. La distribución tiene como denominador todos los perfiles que pasan los filtros, incluidas las categorías desconocidas. No se aplican pesos poblacionales.

ORCID es voluntario, incompleto y especialmente visible entre quienes siguen vinculados a investigación. Se pierden personas sin perfil público, títulos no reconocidos, afiliaciones ocultas, empleos sin fechas y trayectorias anteriores a la información declarada. La muestra puede representar peor a quienes abandonan la academia. No permite calcular probabilidades generales de colocación, tasas de desempleo o comparaciones causales entre universidades. Ausencia de empleo en estos datos no significa desempleo.

Las encuestas estadísticas de la web conservan sus propias poblaciones, pesos y horizontes. No se combinan con ORCID para fabricar una tasa mundial.

## Evidencia universitaria complementaria

Se extraen **295 fichas** de tres fuentes: Oxford Philosophy (208), Glasgow Materials and Condensed Matter Physics (76) y Università Cattolica Science (11 con destino indicado). Se conservan enlaces, fecha de consulta, hechos publicados y hash del HTML fuente.

- Oxford publica nombramientos con consentimiento. El año de anuncio no es necesariamente el de graduación o inicio de empleo; puede incluir puestos futuros. Varias apariciones de un mismo nombre dentro de la lista se agrupan, sin afirmar una resolución global de identidad.
- Glasgow publica una selección histórica de lugares de trabajo desde 1995, sin año individual. Se excluye una entrada que solo indica una studentship.
- Cattolica separa alumni de estudiantes. Solo se incluyen graduaciones explícitas con destino; «TBC» permanece como falta de información y no se convierte en empleo o desempleo.

Estas fichas son buscables por separado y **no se suman a ORCID**. El nombre por sí solo no basta para deduplicar entre fuentes. El archivo de Economía anterior también mantiene su propia unidad y limitaciones. QMUL sigue como referencia de 2017: la descarga directa devolvió HTTP 403 y no se presenta como una nueva importación automatizada.

## Reutilización y actualización

Los originales ORCID y ROR usan CC0; las páginas universitarias no se presentan como bases con licencia abierta. Véase [DATA_LICENSES.md](../DATA_LICENSES.md). La API individual ORCID se comprobó como vía de consulta, pero la extracción masiva de esta edición usa el archivo público y sus condiciones específicas.

Los datos de exploración se dividen por cobertura (Europa, EE. UU., otros) en archivos comprimidos; esa partición es de descarga, no una barrera conceptual para buscar. Los historiales se descargan al abrir una ficha. Un worker realiza las búsquedas y recuentos sin bloquear la escritura. Los nombres de archivo se acompañan de huellas en la URL para no reutilizar un fragmento de una edición diferente desde la caché.

Para una nueva edición, hay que fijar fuente, fecha, tamaño y checksum, revisar el esquema y las reglas de reconocimiento y volver a medir cobertura. Una actualización sin revisión no se promete. Las pruebas comprueban inclusión, fechas, categorías, unicidad, referencias a fichas, huellas, filtros, exportación, idiomas, recuperación de errores y navegadores; no demuestran exhaustividad ni veracidad individual de cada declaración.
