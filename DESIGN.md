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

# Design System: Posdata

## Overview

**Creative North Star: "The Scholarly Career Ledger"**

Posdata presents a doctorate as a point of departure and its evidence as a readable trail. Terracotta orientation, warm paper and dark brown ink frame a continuous ledger from doctoral institution to employer. Narrow headings establish landmarks; readable names, aligned dates and nearby source details carry the working evidence. The statistical views retain their branching routes and labelled comparisons.

This document records the current implementation, rather than an approved visual comp. Grounding: `src/style.css`, `src/responsive.css`, `src/trajectories.css`, root navigation in `src/App.tsx`, career records in `src/Trajectories.tsx`, and local font imports in `src/main.tsx`. `PRODUCT.md` and the direction contract in `index.html` establish the current scope. The updated desktop, mobile and navigation-dialog captures in `.impeccable/review` corroborate the hierarchy; their extraction counts are provisional and are not design tokens.

The user authorized a non-blue theme and a Europe-first career explorer with worldwide destinations and easier mobile navigation. The particular terracotta palette, descriptive names and North Star are implementation descriptions, not an exact user palette selection. No approved image comp or original concept-roll seed is recorded. This refresh does not claim full Impeccable process compliance or release readiness; archive completion and checksum verification remain separate release requirements.

**Key Characteristics:**

- Terracotta orientation, warm paper surfaces and dark brown ink.
- Archivo Narrow landmarks with Source Sans 3 reading and record detail.
- Continuous institution-to-employer ledgers with expandable dated evidence.
- Primary discipline and text search, with optional detailed filters.
- Persistent mobile navigation, a live result count and a direct route to records.
- Labelled statistical routes, explicit limitations and readable source tables.

## Colors

A restrained terracotta identity sits on warm paper; ochre locates meaningful states, while the statistical palette distinguishes categories. The frontmatter owns canonical values. The sidecar's synthesized tonal ramps are preview aids, not additional production tokens.

### Primary

- **Terracotta Signage (`accent`)** carries the masthead, primary actions, selected filters, evidence links, focus outlines and the first statistical category. **Deep Terracotta (`accent-hover`)** is the primary-button hover state.
- **Ochre Locator (`locator`)** marks the current desktop section, the branching logo, the statistical origin node, saved options and text selection. Its source custom property retains the legacy name `--lime`; its current value is ochre.

### Secondary

- **Route Teal (`teal`)** is the second category in statistical routes and comparisons.

### Tertiary

- **Route Plum (`route-plum`), Route Ochre (`route-ochre`) and Route Slate (`route-slate`)** complete the ordered statistical palette. The sequence is terracotta, teal, plum, ochre, slate. Category labels, not colors, determine sector meaning across sources.

### Neutral

- **Warm Paper (`paper`)** is the continuous page, modal navigation surface and sticky first column of original data tables.
- **White (`white`)** holds statistical results, legacy search fields and selected presentation segments.
- **Brown Ink (`ink`)** carries headings, reading text and transient notice surfaces.
- **Quiet Ink (`muted`)** carries dates, units, limitations and source context.
- **Ledger Rule (`line`)** separates records, sections and navigation entries.
- **Field Rule (`field-line`)** bounds the trajectory and university fields; **Field Paper (`field-paper`)** is their near-white fill.
- **Panel Wash (`panel`)** groups working filters and expanded career evidence, and retains the statistical picker and presentation track.
- **Surface Wash (`surface`)** supports table headers, the options introduction and footer.
- **Soft Hover (`soft-hover`)** supports neutral action hover and small metadata tags.

### Named Rules

**The Locator Rule.** Use ochre to locate the current desktop section, departure point or saved state; use terracotta on the light mobile navigation surface.

**The Labelled Route Rule.** Every statistical color travels with a category label and a number or missing-value mark. Color alone does not explain a destination.

## Typography

**Display Font:** Archivo Narrow Variable, with a sans-serif fallback.

**Body Font:** Source Sans 3 Variable, with a sans-serif fallback. Both are imported locally through Fontsource. There is no separate mono face.

**Character:** Condensed headings and prominent values give the working atlas clear landmarks. Open body lettering carries names, employment descriptions, controls, citations and longer reading passages. The type scale follows component needs rather than a fixed mathematical ratio.

### Hierarchy

- **Display:** The frontmatter records the shared page heading. The trajectory entry has its own fluid heading (`clamp(2.45rem, 4.2vw, 3.2rem)`, line height `1.03`, tracking `-0.03em`); it becomes `3rem` at 900px and below, then `2.4rem` at 600px and below. Its mobile line length is bounded at `16ch`. Existing statistical and reading page headings retain their 44px, 39px and 36px changes at the 900px, 650px and 370px breakpoints.
- **Headline / Title:** Section and result headings use the narrow family. Statistical result and methods headings reach 32px; trajectory results use `2rem`, reducing to `1.7rem` at 600px. Reading and evidence headings commonly sit between 22px and 29px.
- **Metric:** Narrow ledger values and comparison figures use tabular numerals. Destination percentages carry their route color. The mobile career count uses semibold body text with tabular numerals so it remains a compact working result.
- **Body:** Prose uses the body role; the root size becomes 16px at 650px and below. Typical reading measures are about 69–77 characters. Record names use Source Sans 3, 17px and weight 650 on desktop, becoming 18px on phones; the employer is a separate, nearby text landmark.
- **Supporting:** Dates, source context, classifications and limitations use the body family at 12–15px, according to their component. Small metadata accompanies, rather than replaces, the institution and employer names.
- **Label:** Controls use semibold, natural-language labels. Functional desktop ledger columns alone use compact uppercase text with tracking; this is table structure, not a reusable decorative eyebrow.

### Named Rules

**The Sign and Ledger Rule.** Use Archivo Narrow for orientation, section names and prominent statistical values; use Source Sans 3 for person and employer names, explanations, controls and evidence detail.

## Layout

The page is a centered, continuous working surface. Header, content and footer share a 1400px maximum container with 42px desktop side padding. At 1500px and above the maximum becomes 1470px. Content padding contracts to 28px at 1150px, 18px at 650px and 13px at 370px. The current mobile masthead has its own 24px inset at 900px and 20px inset at 600px, preserving room for the brand and language action.

The trajectory filters group discipline and text search in two columns, then disclose optional independent origin and employment-country filters plus sector, role, mobility and dates. Europe and worldwide origin shortcuts remain directly available. At 600px the fields form a single column. The result area pairs a fluid career ledger with a 300px distribution column and a 38px gap, reducing to 255px and 27px at 1150px. Records use two flexible evidence columns and a compact disclosure column; at 600px each record becomes an ordered vertical sequence: doctoral origin, indented employer, evidence action.

At 900px and below a live count and a “Ver trayectorias” anchor sit immediately after the introduction. It leads to the focusable results heading; during a query the same region announces preparation instead of a stale count. The archive strip, coverage link and any development-preview notice remain nearby. The job-selection control and stale-employment caution follow the results heading. Distributions move from the desktop sidebar into a closed inline disclosure, so the mobile reading route reaches records without a permanently expanded summary.

The masthead changes to a compact brand/language row at 900px. A fixed four-item bottom navigation presents Trayectorias, Estadísticas, Opciones and Más. Bottom body clearance and toast offsets include the device safe area. Más opens the native all-sections dialog on both desktop and mobile. This replaces the previous horizontally scrolling mobile section strip.

Existing statistical workspaces retain their fixed picker / fluid result relationship: 255px by default, 270px on wide displays, then 230px and 200px at intermediate widths. They stack at 650px, where the discipline choices wrap inside a bounded scrolling region. The branching statistical diagram retains origin / connectors / destinations at 24% / 24% / 52% on desktop, 28% / 14% / 58% on mobile and 27% / 12% / 61% at the narrowest breakpoint. These proportions belong to the diagram, not the general page grid.

Studies, sources, options and methods keep ruled rows and readable columns, then stack in source order. Section spacing generally falls around 20–35px, with larger separation before methods. Source tables preserve useful column widths inside labelled, keyboard-focusable scrolling regions; original tables keep their first column sticky. Horizontal scrolling is local to these regions. Existing print rules flatten the statistical workspace and remove its actions; this record does not imply a separate print audit of the new trajectory surface. Reduced-motion preferences suppress transitions and animations.

## Elevation & Depth

Depth is primarily tonal: warm paper, washed working panels and white statistical results, joined by fine rules. Career records and reading rows stay flat. The three implemented shadows distinguish a selected control and transient overlays.

### Shadow Vocabulary

- **Selected presentation segment** (`0 2px 5px #332e2912`): separates the selected white segment from its track.
- **Transient notification** (`0 8px 30px #332e2925`): separates a fixed dark toast from underlying content.
- **Navigation dialog** (`0 16px 60px #332e2940`): lifts the native modal above a dark brown translucent backdrop (`#332e2980`).

### Named Rules

**The Flat Evidence Rule.** Separate evidence with alignment, paper tone and rules. Reserve shadow for the selected presentation segment, transient notification and modal navigation.

## Shapes

The career ledger is orthogonal and ruled. Working filter fields use almost square corners; existing general controls keep their small-radius family. The statistical workspace retains its component-specific 9px desktop and 6px mobile enclosure. These values do not turn ordinary evidence rows into detached cards. Circular forms belong to statistical route nodes, saved-option actions and compact icon controls.

The current all-sections dialog has square corners. Borders are predominantly one-pixel ledger rules, with darker rules beginning a record table or distribution section. The statistical origin is an ochre center bounded in terracotta; destination endpoints have white centers and category-color outlines. Curves belong to the data branches, while career routes use a small inline SVG arrow. Icons are SVG and are accompanied by visible text or an accessible label.

## Components

### Buttons

Direct, compact actions use visible labels or a labelled SVG control. Primary and secondary buttons share the control radius, semibold label role and minimum 44px desktop height. Terracotta primary actions darken on hover. Secondary actions are transparent with a ledger border; hover adds the soft wash and terracotta text. Text actions use terracotta and underline on hover. Record export, sharing and pagination use simple outlined controls with 44px minimum targets.

Color and border transitions last 160ms. Disabled buttons use reduced opacity and the unavailable cursor. General keyboard focus is a three-pixel terracotta outline offset by four pixels; the masthead substitutes ochre for contrast. No new validation-error visual is defined where the app has none.

### Filters, chips and presentation segments

The entry shows discipline and text search first. A native disclosure reveals the detailed filters; its SVG chevron turns on opening. Europe/worldwide shortcuts use an underlined terracotta selected state with `aria-pressed`, distinct from the enclosed filter chips retained elsewhere. Reset appears when a non-default filter is active.

Existing filter chips retain outlined rectangles, with terracotta fill and white text when selected. Static metadata tags use a quiet wash. The statistical map/table switch keeps a washed track and a white selected segment with terracotta text and the small selection shadow. Selection is exposed by `aria-pressed` rather than color alone.

### Cards / Containers

Evidence is usually a continuous row. Career records, studies, sources and data directories align their metadata and separate entries with rules. Expanded career evidence uses a full-width panel wash inside the current record. The statistical atlas remains an enclosed workspace with a washed picker and white result area; the options introduction keeps its specific tonal container.

### Inputs / Fields

Trajectory and university fields use the field-paper fill, stronger neutral border, field radius and a minimum 46px height. Labels remain above the control. Search includes a leading SVG icon with text inset to clear it; focus follows the global visible outline. Optional country selectors represent doctoral origin and employment destination independently.

Other views retain the white, five-pixel search wrapper and its two-pixel terracotta focus outline, offset by two pixels. Its labelled clear action appears when text is present. Standard selects are lightly rounded; statistical population controls remain a distinct underlined transparent variant. All fields inherit the readable body font, ink text and terracotta caret/accent.

### Navigation and mobile result jump

Desktop navigation exposes four primary sections, Más and a language action. Current links use ochre text and a three-pixel underline; hover uses a translucent white wash. At 900px the persistent bottom navigation uses SVG icons above 12px labels in four equal columns, with 58px minimum item heights. Its current section uses terracotta on a light warm wash. Más carries the current state for sections outside the three direct mobile destinations.

The native dialog contains every section, a clear title and a labelled close control. It opens with `showModal()`, initially focuses the close action, and retains native modal and Escape behavior. Its width is capped at 500px with 16px side clearance, and its maximum height leaves 48px of viewport space. Ruled links are 52px tall on larger screens and at least 47px at 600px. The dialog is the complete section index, not a fullscreen requirement.

The mobile result jump is a compact live region with a semibold filtered count and “Ver trayectorias” text plus SVG arrow. The anchor targets the result heading with scroll clearance. Counts come from the current query; an updating state is descriptive text. The result count, archive size and distribution percentages must never be frozen into design examples as published product facts.

### Doctoral institution-to-employer ledger

Each record presents a person or ORCID identifier, doctoral institution, country/year and discipline; alongside it, the employer, declared role, country/job-start year and sector. A terracotta arrow expresses the direction. Desktop column labels support scanning; mobile preserves the sequence with an indented employment block. Long names and institutions wrap inside their columns.

The labelled evidence action exposes `aria-expanded`. Opening it reveals the profile link, archive date, completed doctorate and dated employment timeline on a panel wash. Each dated entry keeps the declared institution/role, assertion source and available ROR link together. Missing dates, ambiguous ordering and incomplete history remain visible in ordinary supporting text. The panel reveals with a 260ms clip animation using the shared easing; reduced motion disables it. Loading and evidence failures remain explicit, with a retry action where available.

The distributions describe the filtered profiles and keep their denominator and representativeness caveat adjacent. University placement evidence uses a separate searchable, ruled disclosure list, preserving its source context. These distinct evidence types share typography and rules without visually implying that they are one combined person count.

### Statistical routes and reading evidence

The retained route map connects a named origin and population to labelled destinations. Connector width follows the displayed percentage; missing values have dashed paths and a visible dash. Selection highlights the destination, reveals its detail and fades other branches. Width animates over 700ms and opacity over 300ms using the shared easing, disabled under reduced motion.

The statistical ledger joins values, denominator/context and interpretation, followed by expandable limitations and source/export actions. The alternate table exposes the same categories and original values. Studies, sources and methods retain readable measures, clear headings and nearby citations. Preserve these established reading patterns alongside the new career entry.

### Saved options, notices and result states

The saved-option SVG action remains circular and outlined; its selected state uses ochre fill, a check icon and `aria-pressed`. Transient confirmation is a dark, centered bottom toast with an ochre status icon, raised above the mobile navigation.

Trajectory loading exposes preparation and progress, errors provide retry, and an empty query provides a broadening/reset route without implying that the career path cannot exist. A development extract carries its explicit preview notice while incomplete. These are source and query states, not decorative status badges.

## Do's and Don'ts

### Do:

- **Do** preserve terracotta orientation, warm paper and brown ink as the visual foundation.
- **Do** use ochre for the established locator and saved states, with terracotta selection on light mobile navigation.
- **Do** keep doctoral origin, declared employer and dated source evidence in a readable sequence.
- **Do** expose the mobile live count, direct result route and persistent section labels.
- **Do** retain optional detailed filters and visible origin/destination context.
- **Do** pair statistical colors with category names, values and visible missing-value treatment.
- **Do** keep archive dates, denominators and limitations adjacent to the records or figures they qualify.
- **Do** preserve the bundled font pairing, tabular comparable values, visible keyboard focus and reduced-motion behavior.

### Don't:

- **Don't** restore the former blue identity when extending the current system.
- **Don't** treat the latest declared employment start as visually verified current employment.
- **Don't** turn provisional extraction counts or preview examples into permanent product claims.
- **Don't** assign a permanent sector meaning to a statistical route color across source classifications.
- **Don't** hide missing values, source limitations or the incomplete-extract notice to simplify the layout.
- **Don't** spread modal or notification shadows across ordinary evidence rows.
- **Don't** replace the SVG icon language with text glyphs as a reusable convention.

Not canonized: the statistical limitations disclosure still uses CSS-generated plus/minus glyphs, an existing icon-language inconsistency. Incidental legacy hover tints, component-only spacing and extraction counts are not promoted into the reusable token scale. Missing concept-roll provenance is recorded as a process gap, not invented after the fact.
