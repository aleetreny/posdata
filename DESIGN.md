---
name: "Posdata"
description: "A scholarly career atlas with traceable doctoral institution-to-employer records."
colors:
  accent: "#86452f"
  accent-hover: "#663323"
  locator: "#f2d88c"
  teal: "#187a78"
  route-plum: "#9a4883"
  route-ochre: "#aa661a"
  route-slate: "#657387"
  paper: "#f6f3ed"
  white: "#fff"
  ink: "#332e29"
  muted: "#686057"
  line: "#d5cdc0"
  field-line: "#a69b8d"
  field-paper: "#fffdfa"
  panel: "#ece6da"
  surface: "#ede7dc"
  soft-hover: "#e9e1d4"
typography:
  display:
    fontFamily: "Archivo Narrow Variable, sans-serif"
    fontSize: "clamp(2.4rem, 4.2vw, 3.5rem)"
    fontWeight: 650
    lineHeight: 1.05
    letterSpacing: "-0.018em"
  headline:
    fontFamily: "Archivo Narrow Variable, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.018em"
  title:
    fontFamily: "Archivo Narrow Variable, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 650
    letterSpacing: "-0.018em"
  metric:
    fontFamily: "Archivo Narrow Variable, sans-serif"
    fontSize: "29px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Source Sans 3 Variable, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
  supporting:
    fontFamily: "Source Sans 3 Variable, sans-serif"
    fontSize: "14px"
    lineHeight: 1.5
  label:
    fontFamily: "Source Sans 3 Variable, sans-serif"
    fontSize: "15px"
    fontWeight: 600
rounded:
  field: "2px"
  compact: "3px"
  filter: "4px"
  control: "5px"
  floating: "6px"
  circular: "50%"
spacing:
  tight: "5px"
  compact: "8px"
  inline: "10px"
  small: "12px"
  medium: "16px"
  group: "20px"
  section: "24px"
  roomy: "30px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.white}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.soft-hover}"
    textColor: "{colors.accent}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    typography: "{typography.label}"
    padding: "7px 0"
  search-field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    padding: "0 10px"
  trajectory-field:
    backgroundColor: "{colors.field-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
  nav-link:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.white}"
    padding: "0 11px"
  nav-link-current:
    textColor: "{colors.locator}"
  mobile-nav-link:
    textColor: "{colors.muted}"
    padding: "6px 2px"
  mobile-nav-link-current:
    textColor: "{colors.accent}"
  navigation-dialog:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "26px"
    width: "min(500px, calc(100% - 32px))"
  filter-chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.filter}"
    padding: "8px 13px"
  filter-chip-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.white}"
  segment:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.compact}"
    padding: "7px 10px"
  segment-selected:
    backgroundColor: "{colors.white}"
    textColor: "{colors.accent}"
  evidence-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "30px 0"
  career-record:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "20px 0 22px"
  career-evidence:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    padding: "22px 24px"
  mobile-result-jump:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "4px 0 14px"
  destination-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "11px 4px 11px 9px"
  save-button:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    rounded: "{rounded.circular}"
    width: "42px"
    height: "42px"
  save-button-saved:
    backgroundColor: "{colors.locator}"
---

# Diseño de Posdata

La interfaz prioriza encontrar una respuesta y comprobar su evidencia. Conserva una identidad editorial de terracota, papel cálido y tinta oscura.

## Lenguaje visual

Archivo Narrow establece títulos y cifras; Source Sans 3 se usa para lectura y controles. Los colores y componentes del encabezado describen los tokens implementados en `src/style.css` y `src/trajectories.css`. El ocre señala la sección activa y las opciones guardadas. Las categorías estadísticas siempre llevan texto además de color.

Las trayectorias forman un listado continuo: persona e institución doctoral → empleador y puesto → historial. Se usan separadores y alineación para comparar registros; los detalles se despliegan dentro de la fila. Las tablas anchas tienen desplazamiento propio.

## Navegación y búsqueda

El escritorio muestra Trayectorias, Estadísticas, Salidas, Estudios y Más. En móvil, tres destinos y el índice completo permanecen accesibles desde la barra inferior. El menú explica qué responde cada sección y usa un diálogo nativo con cierre, foco y Escape.

Disciplina, sector y búsqueda ocupan el primer nivel del explorador. La búsqueda distingue persona, universidad doctoral, empleador y puesto. Países, fechas y función se despliegan como filtros adicionales; su selección permanece visible y puede quitarse individualmente. El recuento móvil enlaza directamente con los resultados.

Las salidas profesionales incluyen enlaces a filtros concretos del explorador. Los textos indican qué ejemplos se van a buscar. El catálogo distingue datos integrados de otras referencias investigadas.

## Evidencia y estados

Una ficha muestra el nombre original, fechas, procedencia y criterio de clasificación del sector. Las inferencias a partir del nombre no aparentan ser identidades ROR verificadas. Los conflictos de identificador quedan enlazados. Sin identificar no se presenta como privado.

Carga, error recuperable, ausencia de resultados y filtros activos tienen textos explícitos. Fechas, denominadores y limitaciones se conservan cerca de los datos. La navegación y los controles mantienen foco visible, tamaños táctiles y etiquetas. La preferencia de movimiento reducido desactiva las animaciones de detalle y gráficos.

## Archivos de referencia

- `src/style.css`: tipografía, paleta y componentes generales.
- `src/responsive.css`: adaptación de las vistas estadísticas y documentales.
- `src/trajectories.css`: explorador, navegación y evidencia individual.
- `docs/PRODUCT.md`: tareas y criterios editoriales.
- `docs/VERIFICATION.md`: alcance de las comprobaciones.
