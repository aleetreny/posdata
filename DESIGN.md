---
name: Posdata
description: An evidence-led atlas of professional destinations after a doctorate.
colors:
  blue: "#1747a6"
  blue-hover: "#11377e"
  lime: "#eff25a"
  teal: "#187a78"
  route-plum: "#9a4883"
  route-ochre: "#aa661a"
  route-slate: "#657387"
  paper: "#f3f5f2"
  white: "#fff"
  ink: "#183246"
  muted: "#526570"
  line: "#c8d2d3"
  panel: "#eaf0ed"
  surface: "#e7eeeb"
  soft-hover: "#e6eceb"
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
    backgroundColor: "{colors.blue}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.blue-hover}"
    textColor: "{colors.white}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.soft-hover}"
    textColor: "{colors.blue}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.blue}"
    typography: "{typography.label}"
    padding: "7px 0"
  search-field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    padding: "0 10px"
  nav-link:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.white}"
    padding: "0 11px"
  nav-link-current:
    textColor: "{colors.lime}"
  filter-chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.filter}"
    padding: "8px 13px"
  filter-chip-selected:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.white}"
  segment:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.compact}"
    padding: "7px 10px"
  segment-selected:
    backgroundColor: "{colors.white}"
    textColor: "{colors.blue}"
  evidence-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "30px 0"
  destination-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "11px 4px 11px 9px"
  save-button:
    backgroundColor: "transparent"
    textColor: "{colors.blue}"
    rounded: "{rounded.circular}"
    width: "42px"
    height: "42px"
  save-button-saved:
    backgroundColor: "{colors.lime}"
---

# Design System: Posdata

## Overview

**Creative North Star: "The Scholarly Transit Atlas"**

Posdata treats a doctorate as a departure point and evidence as the map. Cobalt signage establishes orientation; cool paper holds the working material; narrow headings, branching routes and ruled ledgers make a dense research tool readable. The interface is direct and scholarly, with room for exploration and the sources kept close to the claims.

This is a record of the implemented system in `src/style.css`, `src/responsive.css` and `src/App.tsx`, with the font imports in `src/main.tsx`. The metaphor and color names describe that implementation. They were developed within the user's delegated design brief; they do not imply that the user selected these specific tastes or approved an image composition. `PRODUCT.md` supplies the durable commitments to evidence, visible limitations and a transit-atlas identity.

**Key Characteristics:**

- Cobalt orientation, cool paper surfaces and dark blue text.
- Narrow display lettering paired with open, readable body text.
- Branching statistical routes with explicit labels and figures.
- Continuous evidence ledgers separated by fine rules.
- Compact controls, visible selection and responsive reflow.

## Colors

The palette combines a stable blue identity with subdued paper tones; categorical data adds distinct route colors without turning them into page decoration. The frontmatter holds the canonical values. Descriptive names below are explanatory, not new tokens.

### Primary

- **Signage Cobalt (`blue`)** carries the masthead, primary actions, selected filters, source links, focus outlines and the first data category. `blue-hover` is the darker primary-button state.
- **Locator Lime (`lime`)** identifies the current navigation item, the logo's branching mark, the departure node, saved options and text selection. It is used in small, meaningful areas.

### Secondary

- **Route Teal (`teal`)** distinguishes the second statistical category in both the route map and comparison bars.

### Tertiary

- **Route Plum (`route-plum`), Route Ochre (`route-ochre`) and Route Slate (`route-slate`)** extend the ordered category palette. The sequence is cobalt, teal, plum, ochre, slate. These colors identify category positions within the chosen dataset; the category labels remain authoritative across datasets.

### Neutral

- **Cool Paper (`paper`)** is the continuous page ground and the sticky first column in original data tables.
- **White (`white`)** holds results, search fields and the selected presentation segment.
- **Deep Ink (`ink`)** carries headings, body text and the toast surface.
- **Quiet Ink (`muted`)** carries supporting descriptions, units, metadata and source context.
- **Ledger Rule (`line`)** divides rows, bounds controls and separates sections.
- **Panel Wash (`panel`)** distinguishes the discipline picker and presentation switch.
- **Surface Wash (`surface`)** supports table headers, the career introduction and footer.
- **Soft Hover (`soft-hover`)** supports neutral control hover and small metadata tags.

### Named Rules

**The Locator Rule.** Use lime to locate the current place, departure point or saved state; preserve its meaning when extending the interface.

**The Labelled Route Rule.** Every statistical color travels with a category label and a number or missing-value mark. Color alone does not explain a destination.

## Typography

**Display Font:** Archivo Narrow Variable, with a sans-serif fallback.

**Body Font:** Source Sans 3 Variable, with a sans-serif fallback. Both families are imported locally through Fontsource. There is no separate mono face.

**Character:** The condensed display face recalls readable transport signage and gives data values a clear silhouette. The body face handles longer explanations, forms, citations and tables without competing with those landmarks.

### Hierarchy

- **Display:** The frontmatter's fluid display role is the desktop page heading. It becomes a fixed, balanced heading at narrower breakpoints: 44px below 900px, 39px below 650px and 36px below 370px. Mobile page headings use slightly tighter tracking and a bounded line length.
- **Headline / Title:** The base heading roles are supplemented by contextual sizes: working result titles and methods headings reach 32px; evidence titles typically sit between 22px and 29px. These are component adjustments, not a mathematically regular type scale.
- **Metric:** Narrow, medium-weight ledger values use tabular numerals. Destination percentages use a slightly heavier display treatment in the corresponding route color. Keep values and their units together.
- **Body:** Prose follows the body role, with the root size reduced to 16px below 650px. Reading measures generally fall around 69–77 characters; short explanatory notes can be wider where they accompany a table.
- **Supporting:** Metadata, figure context and limitations use a smaller body face, usually 13–15px depending on the component and viewport.
- **Label:** Actions use the semibold label role. Navigation is sentence case with medium weight. Headings and labels retain natural language casing.

### Named Rules

**The Sign and Ledger Rule.** Use Archivo Narrow for orientation, section names and prominent values; use Source Sans 3 for explanations, controls and evidence detail.

## Layout

The page is a centered, continuous working surface. Header, content and footer share a 1400px maximum container and 42px side padding on desktop. At 1500px and above the maximum becomes 1470px. Side padding contracts to 28px below 1150px, 18px below 650px and 13px below 370px. Main content keeps substantial lower breathing room rather than filling the viewport with panels.

The desktop atlas joins a fixed discipline column to a fluid result column: the default picker is 255px, expanding to 270px on wide displays and contracting through 230px and 200px at intermediate widths. Comparison uses the same fixed-selector / fluid-evidence relationship. At 650px these layouts become vertical; the discipline list becomes wrapped compact controls inside a bounded scrolling region. Related questions and footer columns also stack.

At 900px the masthead becomes two rows. Navigation remains a horizontal strip with overflow, a visible swipe hint when needed, and programmatic centering of the active section. The current link keeps its lime underline. This behavior is part of orientation, not an invitation to clip the current section's name.

The route diagram preserves three functional zones: origin, connectors and destination labels. Desktop proportions are 24% / 24% / 52%; the final mobile override is 28% / 14% / 58%, then 27% / 12% / 61% at the narrowest breakpoint. The ledger goes from three columns to two, with its final interpretation spanning the row. These ratios are specific to this signature component, not a general page grid.

Spacing is optical and content-led rather than a strict arithmetic scale. The frontmatter records recurrent gaps and insets; section rows use roughly 20–35px vertical intervals. Tables retain their useful column widths inside a labelled, keyboard-focusable scrolling region. Original tables keep their first column sticky. Horizontal scrolling belongs to these explicit regions, not the document body.

Print styles remove the navigation and action controls, flatten the atlas container and expose table content. Reduced-motion preferences suppress transitions and animations.

## Elevation & Depth

Depth is mostly tonal: paper, washed panels and white result surfaces, joined by fine borders. Evidence rows remain flat and continuous. The implementation contains two soft shadows with specific state roles; they are not a general card style.

### Shadow Vocabulary

- **Selected presentation segment** (`0 2px 5px #18324612`): a very small lift separates the selected white segment from its washed track.
- **Transient notification** (`0 8px 30px #18324625`): a diffuse shadow separates a fixed dark toast from the page underneath.

### Named Rules

**The Flat Evidence Rule.** Separate evidence with alignment, paper tone and rules. Reserve shadow for the selected presentation segment and transient overlay role already present in the system.

## Shapes

Controls are compact rectangles with lightly rounded corners. The small-radius family distinguishes list selections, filter buttons, input fields and presentation segments without softening them into pills. The main atlas has a slightly more generous 9px enclosure on desktop and 6px on mobile; this is a component-specific boundary. Circular forms belong to route nodes and compact icon actions.

Borders are predominantly one-pixel ledger rules. The origin node is a lime center bounded in cobalt; destination endpoints are white centers outlined in their route color. Curves belong to the branching statistical diagram, while reading surfaces keep a simple orthogonal structure. The interface uses inline SVG icons alongside text or accessible labels.

## Components

### Buttons

Direct, compact actions with visible labels. Primary and secondary buttons share the control radius, semibold label style and a minimum 44px desktop height. Primary actions are cobalt with white text and darken on hover. Secondary actions are transparent with a ledger border; hover adds a soft wash, a stronger border and cobalt text. Text actions use cobalt without an enclosing fill and underline on hover.

Color and border transitions last 160ms. Disabled buttons reduce opacity and use the unavailable cursor. General keyboard focus uses a three-pixel cobalt outline offset by four pixels; inside the cobalt masthead the outline is lime. The sidecar contains the exact focus and state CSS.

### Chips and presentation segments

Filter buttons are lightly rounded outlined rectangles. Their selected state uses cobalt fill, border and white text. Small static metadata tags instead use a quiet neutral wash. The mobile discipline picker follows its own compact wrapping treatment with the selected discipline kept cobalt.

The map/table switch sits on a washed track. Its selected segment is white with cobalt text and the small selection shadow. `aria-pressed` exposes both filter and presentation state. These controls compress at mobile widths; they are not a universal pill navigation system.

### Cards / Containers

Most evidence is presented as a row, not a detached card. Careers, studies, sources and data directories use aligned columns, generous row padding and horizontal rules. Their columns reflow into a readable sequence on small screens. The atlas is the principal enclosed workspace, with a washed picker adjoining white results. A career introduction has a tonal container; these specific containers do not make every paragraph a card.

### Inputs / Fields

Search fields combine a white surface, thin rule, compact radius and a leading SVG search icon. Text and caret use ink and cobalt; supporting placeholder text remains visible. The wrapper receives a two-pixel cobalt focus outline offset by two pixels. A clear button appears when there is input and keeps an accessible label.

Standard selects are white, bordered and lightly rounded. The population/context controls are a distinct underlined, transparent variant with visible labels. Checkbox selections use cobalt. Loading and empty results are explicit centered states with a descriptive message and a relevant retry or reset action where available; the document does not invent field-error styling that the app does not have.

### Navigation

The cobalt masthead pairs the narrow wordmark with direct section links and a language action. Current navigation uses both lime text and an underline. Hover adds a translucent white wash. The mobile strip, its scroll hint and active-section centering follow the behavior described in Layout. Source links use the familiar external-arrow SVG plus text, and relevant links keep their underline.

### Destination map and evidence ledger

The map is the signature: a named origin and its population count branch into labelled destination rows. Connector widths are calculated from percentages; missing values receive dashed paths and a visible dash in the value. Selecting a row highlights it, reveals detail and fades the other routes. The paths animate width over 700ms and opacity over 300ms using the implemented easing curve; reduced motion disables both transitions. This is a view of actual data, not a decorative route illustration.

The ledger directly beneath the map joins a metric, denominator/context and an interpretation. Fine rules connect it to the expandable limitations note and source/export actions. Values use tabular numerals; missing and suppressed values retain their explicit representation. The alternate table view exposes the same categories and original values.

### Saved options and notices

A circular outlined SVG action saves a career option. The saved state has a lime fill and check icon, with `aria-pressed` and an updated accessible label. Transient confirmation appears in a dark, centered bottom toast, with a lime status icon and a soft overlay shadow. Neither pattern is a general promotional badge.

## Do's and Don'ts

### Do:

- **Do** preserve cobalt orientation, paper surfaces and dark ink as the stable visual foundation.
- **Do** use lime for a meaningful locator or saved state.
- **Do** pair statistical colors with category names, values and visible missing-value treatment.
- **Do** keep population, timeframe and limitations adjacent to the figures they qualify.
- **Do** extend the ruled evidence rows and readable columns before introducing another container type.
- **Do** preserve visible keyboard focus, the current mobile navigation label and reduced-motion behavior.
- **Do** use the bundled display/body pairing and tabular numerals for comparable values.

### Don't:

- **Don't** assign a permanent sector meaning to a route color across different source classifications.
- **Don't** turn lime into an unrelated background treatment or an unlabelled data category.
- **Don't** derive decorative route thickness from anything other than the displayed data.
- **Don't** hide denominators or missing values to make the visual simpler.
- **Don't** spread the segment or toast shadows across ordinary evidence rows.
- **Don't** replace the implemented SVG icon language with text glyphs as a reusable icon convention.

Not canonized: the limits disclosure currently uses CSS-generated plus/minus glyphs. That existing icon-language inconsistency is not a reusable component rule; the sidecar follows the implemented SVG language for its reusable icon examples. Component-specific radii and incidental spacing values are also not promoted into a universal scale.
