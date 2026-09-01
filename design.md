---
name: honestui-brand-guidelines
description: "Design, build, or substantially improve an official Honest UI-authored report website. Use for customer reports, proposals, briefs, benchmarks, comparisons, narrative data pages, pricing or ROI or performance calculators, and bespoke decision pages that need Honest UI information architecture, LoveSans typography, data storytelling, responsive craft, components, tokens, and light and dark themes."
---

# Honest UI design guidelines for report websites

Act as an excellent Honest UI designer, editor, information architect, data storyteller, and design engineer. Turn the available material into an official Honest UI-authored website. Shape the argument and the interface together; do not merely restyle a data dump or assemble generic components.

## Start with the Honest UI point of view

Treat these as official Honest UI-authored report and decision surfaces. Help executives, engineering leaders, security teams, procurement, finance, product teams, and other named stakeholders understand evidence, compare alternatives, test assumptions, and make decisions.

Make the artifact precise, calm, direct, technically literate, evidence-led, editorial, and intentionally crafted. Build confidence through clarity, proof, visible ownership, and command of the material. Use expression when it clarifies the subject or makes the experience recognizably Honest UI. Never manufacture confidence through hype, decoration, novelty, false certainty, or exaggerated claims.

Carry the Honest UI principles into the finished page: good defaults without giving up control; clear code over clever abstractions; useful design over unnecessary decoration; accessibility from the start; no lock-in; quality over hype. The interface should feel considered and distinctive without hiding how it works.

Start with the reader's job, not the document category. Identify what the reader needs to understand or decide, the strongest supported answer, the evidence that earns that answer, and the caveat that could change it.

Treat this as a brand surface even when it contains product-like interactions such as calculators. Communicate official Honest UI authorship without resembling the documentation component gallery, a generic SaaS landing page, or an unrelated marketing campaign.

## Resolve design decisions in this order

When requirements compete, protect them in this order:

1. Preserve supplied facts, formulas, units, qualifiers, privacy requirements, and task constraints.
2. Preserve the caller's framework, routes, delivery surface, and established Honest UI foundation.
3. Make the reader's question, strongest supported answer, and material evidence immediately clear.
4. Establish unmistakable Honest UI authorship through the wordmark, LoveSans type roles, shared grid, semantic tokens, and purposeful craft.
5. Choose a composition specific to this material; avoid both generic model defaults and a fixed report template.
6. Refine responsive behavior, interaction, and details without weakening the hierarchy.

Ask one grouped set of questions only when proceeding could change commercial meaning, security or legal claims, privacy, formulas, units, populations, periods, customer identity, recommendations, approvals, deadlines, owners, or calls to action. Otherwise omit the unknown, label it honestly, and proceed.

## Fit the work to the host project

Preserve the host framework, file structure, routes, component conventions, build system, and output form. Edit the files that naturally own the experience. Do not force a filename, single-file deliverable, raw HTML, or a new framework. When no project exists, choose the smallest runnable web implementation; semantic HTML, CSS, and small JavaScript are the fallback.

Inspect `package.json`, `components.json`, the global stylesheet, existing theme attributes, nearby routes, and local components before adding anything. Reuse installed Honest UI components and the host project's composition primitives. Do not add a second UI kit, icon library, chart library, animation library, registry, preset, or parallel theme when the project already provides the capability.

For a supported React project that does not yet use Honest UI, initialize it with:

```bash
npx honestui@latest init
```

Inspect planned component changes before writing into an established project:

```bash
npx honestui@latest add button dialog field input table --dry-run
```

Then add only the exact components the artifact needs. The destination and aliases recorded in `components.json` are authoritative; `@/components/ui` is common but must not be assumed.

Honest UI has two delivery models:

- UI and animated components are copied into the project with the Honest UI CLI. Their source becomes application code that the project owns and may adapt.
- Charts, icons, logos, vectors, and shaders remain explicit package imports from `honestui/charts`, `honestui/icons`, `honestui/logos`, `honestui/vectors`, and `honestui/shaders`.

Keep the report server-rendered except for stateful controls. Page-owned CSS may create material-specific topology, density, evidence geometry, and semantic compositions from public `--hui-*` tokens when stock components would distort the material. Do not target component internals merely to force a visual result. Adapt copied component source deliberately when its contract truly needs to change, then verify semantics, states, focus, and responsive behavior.

If the host already uses Honest UI, preserve its theme setup. If it does not, run the documented initialization rather than reconstructing the token system by hand. Do not copy the Honest UI website's local font files or identity assets into another product without authorization.

The default network allowlist is the project's existing resources, the Honest UI package or registry resources needed by the implementation, and user-supplied assets. Do not add third-party JavaScript, chart libraries, icon kits, stock assets, analytics, fonts, or other dependencies without authorization.

## Build the page in four stages

### Define the reader and the decision

Inspect all available material before designing. Privately establish:

- Who opens this, in what context, to decide or understand what?
- What is the strongest supported answer?
- What evidence makes that answer credible?
- What tradeoff, uncertainty, or limit changes its interpretation?
- What should remain available for audit without dominating the first read?

Normalize facts, units, dates, sources, formulas, contradictions, unknowns, and privacy constraints. Distinguish observation, derivation, projection, recommendation, and causation. Never invent intent, ownership, urgency, certainty, deadlines, approvals, future behavior, or confidentiality.

Order by reader need, not source order. Support two reading speeds:

- **Executive path:** identity, title, headings, decisive values, captions, and conclusion communicate the argument quickly.
- **Audit path:** exact tables, assumptions, methodology, caveats, and sources preserve the record.

Write the executive path in plain language the least specialized named stakeholder can understand and repeat. Keep exact metric names, technical terms, units, and source vocabulary in the audit path. Define an unfamiliar term in plain words at first use, then use the exact term consistently. Never let this skill's own authoring vocabulary, such as composition, hierarchy, focal relationship, or mediation, leak into page copy.

Simplify language, never the claim. Preserve every qualifier, population, period, unit, condition, comparison basis, and uncertainty that changes meaning. Do not turn a precise test condition into a broader human claim: for example, “unthrottled” does not establish “a normal computer,” and “within measurement noise” does not establish “as fast.” Prefer a concrete supported statement over evaluative shorthand such as “tiny,” “huge,” “safe,” or “fast.”

Describe the method actually used and the limits that change its interpretation. Omit failed attempts, unavailable credentials, and tool or environment diary unless the reason for changing methods materially affects confidence, reproducibility, or the decision.

Keep exhaustive ledgers after the decision path or behind native disclosure when the delivery surface supports it. A filterable audit table with dozens of rows should default to a neutral decision-relevant subset, such as all failures, all exceptions, or every row named in the decision, not “All.” State the active filter and selection rule; never hand-pick favorable rows. Keep an explicit way to inspect all rows and show the current and total counts.

Every section must answer a new reader question. Combine duplicates. Remove ceremony. Keep one evidence home for each claim: a later table may preserve exact lookup, but a second summary, chart, card group, or conclusion must not restate the same answer at equal prominence.

### Shape the page around the argument

The first viewport is the argument, not a masthead followed by setup. It may be claim-led, evidence-led, comparison-led, or tool-led. Choose the composition that exposes identity, the reader's question, and the strongest evidence with the least mediation. If the reader saw only this viewport, they should remember the central relationship, decision, or tool, not merely the title or mood.

Before designing, privately name the obvious layout the artifact category would suggest. Reject it unless the material earns it. A renewal proposal need not resemble every renewal proposal; a calculator need not resemble every calculator. Let the reader's question and the shape of the evidence determine the composition.

When the material admits multiple structures, privately compare two materially different composition hypotheses before coding. Change topology, density, and evidence placement, not merely palette or component choice. Select the hypothesis that makes the reader's job clearest with the least mediation.

Match the opening to the job:

- **A decisive recommendation or conclusion:** make the answer and its decisive basis co-primary.
- **A comparison:** put alternatives on the same visual basis so the difference is seen, not reconstructed from prose.
- **A trend or benchmark:** let the relationship or exception lead; keep exact records below.
- **A calculator:** let the calculator itself be focal evidence when manipulating an assumption is the reader's primary job. Do not require a separate static proof before it.
- **A brief with no supported decision:** lead with the strongest supported state, implication, limit, or unresolved question rather than inventing a call to action.

Choose geometry before components. Map the material to a visual variable:

- Magnitude or rank → position or length on a common scale.
- Change over time → horizontal order and aligned position.
- Composition → proportion.
- Threshold or range → distance from a boundary.
- Process or dependency → connection and sequence.
- Qualitative alternatives → aligned rows or deliberately contrasted columns.

Use tables for precise lookup, prose for one conclusion, and charts only for relationships that become faster to understand visually. Do not default to bars because values exist.

Compose the page as a field, not a stack of components. Establish one page-level throughline and one focal relationship in each reading moment or major section. Surround each focal object with a small number of supporting objects and enough open space to amplify its local hierarchy. Pace the scroll deliberately: vary density and quiet while retaining one visual grammar. Repetition creates rhythm only when the repeated items are true peers; otherwise it creates template noise. End with the resolved decision, implication, next action, or open question. Let sources and the footer follow quietly; do not let the page simply stop after a ledger or caveat.

Give every artifact one evidence-bearing organizing move that belongs to its material and could not be transplanted unchanged into an unrelated report. It may be a comparison geometry, a threshold, a sequence, a customer-specific diagram, a distinctive evidence rhythm, or the interaction itself. It must clarify the subject, not decorate it.

Use a squint test: at a glance, the dominant claim or evidence should be obvious and the reading path should be stable. Use a text-mask test: with the words blurred, the hierarchy should still communicate identity, emphasis, grouping, and progression. If every block has equal weight, redesign before coding.

Create presence through commitment, not additional effects. When a page feels too safe, strengthen one focal relationship through proportion, hierarchy, density, pacing, line breaks, or evidence placement. Make supporting content quieter. When the material feels thin, improve its selection, hierarchy, comparison, or explanation; leave unsupported gaps honest. Never fill an evidence gap with panels, borders, icons, color fields, decorative charts, or effects.

### Apply the Honest UI visual language

Treat this section as the design authority for these artifacts. Use Honest UI identity for authorship and Honest UI components, semantic tokens, type roles, theme attributes, and effects for implementation. Use these instructions for composition, hierarchy, and when those primitives are appropriate. Do not introduce a parallel visual system.

#### Establish Honest UI authorship

Every completed page must have the same Honest UI authorship outcome. Reuse `BrandWordmark` and the existing `/logo.svg` or `/logo-wordmark.svg` assets. Do not redraw, approximate, typeset, or export a different Honest UI mark. If the artifact is not actually Honest UI-authored, use the real author's identity and do not imply Honest UI endorsement.

Put the identity on the left of the header. The right side may contain at most two sourced fields such as the customer, period, purpose, or confidentiality. Use sentence case. Do not invent metadata. Align the identity and metadata to the same baseline. Keep the footer quiet: identity or ownership left, at most one sourced ownership or confidentiality line right. Separate both shell regions with spacing, not routine borders.

Keep preparation, audience, and document-state metadata in the masthead. Do not repeat it as a preamble between the masthead and the page-defining title.

Use the established component inside semantic structure:

```html
<body>
  <a href="#main">Skip to content</a>
  <header>
    <div><!-- BrandWordmark --></div>
    <dl>...</dl>
  </header>
  <main id="main">...</main>
  <footer>...</footer>
</body>
```

In React, omit the document-level elements when the route or layout already owns them. Reuse the existing site header, `BrandWordmark`, and footer patterns rather than creating report-only duplicates.

#### Build on the layout grid

Use one shared outer grid for the masthead, title, sections, evidence, and footer. The Honest UI report foundation is 12 columns on desktop, 6 on tablet, and 4 on mobile. Reading prose normally occupies 6–7 desktop columns. Tables, charts, calculators, diagrams, and major comparisons may use the full grid.

Every object must align to a shared edge, baseline, grid line, or deliberate optical center. Equivalent blocks share type roles, value positions, internal rows, and action alignment. A split heading and paragraph align on their first text baselines. Tables own the full evidence width of their section. Do not strand content in a narrow track while usable columns remain empty.

Make column gutters unmistakable. Wrapped headings, labels, and prose must not visually bridge from one column into the next. If adjacent columns can be misread as one line or phrase, widen the gutter, shorten or rebalance the content, or stack the columns.

Open space must amplify the focal object. Large empty rectangles caused by an underfilled split, orphaned third item, or delayed proof are layout failures. Reflow or rebalance them. Three true peers normally occupy one three-column row; a deliberately dominant peer may earn more width, but its difference must be meaningful.

Do not force materially unequal findings into equal cells. Rank them, group them, or give the decisive finding more visual consequence so the geometry matches the argument.

#### Set type and rhythm

Use LoveSans through `--hui-font-title` for headings and display titles and `--hui-font-body` for prose, labels, controls, tables, KPIs, dates, counts, percentages, durations, and financial figures. Use JetBrains Mono through `--hui-font-mono` only for code, commands, paths, raw tokens, timestamps, and short operational identifiers such as region, plan, SKU, account, or environment IDs. Set only the identifier in Mono, not its sentence or entire table.

Official Honest UI projects load the supplied LoveSans files and bind them to `--font-love-sans`; the semantic family tokens provide the fallback stack. Do not substitute a generic display face, mix unrelated families, or copy the font files into a non-Honest UI product without authorization.

Use the published size, line-height, letter-spacing, and weight tokens. Do not create arbitrary font sizes or numeric font weights. Use `--hui-font-size-t4` for the page-defining title when scale is earned; `--hui-font-size-t3` for major section turns; `--hui-font-size-t2` and `--hui-font-size-t1` for nested structure; the large or regular body recipe for orientation and reading; small for compact labels; mini and micro only for genuinely subordinate metadata. Use the corresponding `--hui-line-height-*` and `--hui-letter-spacing-*` token for every size. Equivalent peers always share role, size, weight, line-height, and numeric treatment; never resize one because its string is longer or its value is larger.

Build vertical rhythm from relationships:

- Heading → its first paragraph: close.
- Paragraph → paragraph or list: one body rhythm.
- Label → value → detail: identical across peers.
- Content group → new section: clearly larger.
- Caption or source → evidence it qualifies: close enough to read together.

Give every gap one owner. A stack, grid, or page-owned custom wrapper sets the gap; its children must not add competing default margins. In page-owned CSS, reset the margins of grouped direct children and use `--hui-space-*` tokens. Within-group gaps are normally `--hui-space-2` through `--hui-space-5`, between-group gaps `--hui-space-6` through `--hui-space-11`, and major section turns normally `--hui-space-12` through `--hui-space-16`. Reserve `--hui-space-17` for a true chapter break, never as the default page-stack gap. These express relationships, not one universal stack rule.

Judge the whole transition, not just its token. A large gap next to an underfilled split, short section, or sparse final row compounds emptiness even when the token is valid. Reduce the gap, rebalance the grid, or stack the content until the open space has a clear compositional purpose.

Do not leave a heading, explanation, and list as unrelated siblings inside a custom grid cell. Group the content, align equivalent roles across peers, and let the group own its internal rhythm. Do not repair one awkward transition with an arbitrary one-off margin; repair the grouping or spacing owner.

Keep body text at a comfortable reading size and line height; never use tiny gray copy to make density fit. Keep prose near 60–68 characters per line. Rewrite before shrinking.

Establish hierarchy through typography before surfaces or color. Separate paragraphs with space; never use first-line indents. Inspect important line breaks. Fix stranded words in large headings or ledes by improving the copy or measure, not by shrinking an individual element.

Write sentence-case headings that state the customer-specific claim or reader question. Avoid all-caps eyebrows, overlines, decorative section numbers, synthetic symmetry, repetitive cadence, generic praise, and internal authoring language. Prefer concrete nouns and active verbs. Avoid em dashes. A useful title says what happened, what changes, or what decision is needed; it does not name the report genre.

#### Use color, surfaces, and borders

Begin with Honest UI's neutral canvas and semantic hierarchy. Use accent color deliberately for interaction, selection, identity, or a specific expressive moment; use status and visualization colors only for their documented roles. Pair every meaningful color with a non-color cue. Do not turn a recommendation, savings figure, cost component, or longer bar green merely because it is favorable or important. Use chart color only when it distinguishes series or encodes a sourced state. Support light and dark themes through the same semantic roles.

For an official report, default to `data-style="modern"`, the built-in indigo accent, and gray neutrals. Use `traditional`, orange or mint accents, or mauve, slate, or sage neutrals only when the material earns a different tone. A palette switch is an art-direction decision, not variety for its own sake.

The page is normally one continuous canvas. Earn a surface or boundary only when it communicates selection, interaction, warning, contrast, or a real grouping that spacing cannot express. Prefer spacing, alignment, typography, and a change in density before borders or boxes.

Do not wrap every section, metric, or comparison in a card. Avoid nested panels. Keep radii restrained and consistent with the foundation.

Create a strong contrast field only when the content earns it. Build it from Honest UI's matching semantic foreground, background, and border tokens so nested text, controls, and focus states remain correct in both themes. Do not recreate an inverse palette from arbitrary raw values.

Diagnose quantity separately from intensity. If the page feels busy, remove, combine, or reorder content. If it feels loud, reduce competing color, scale, weight, borders, surfaces, and motion. Preserve one deliberate anchor; restraint must not flatten the page into neutral sameness.

Reject generic decorative gradients, gradient text, glows, blobs, glass effects, paper simulations, colored side rails, ornamental shadows, and fake depth. Honest UI vectors, textures, gradients, and shaders are allowed only as one earned expressive lever with a clear compositional job, accessible contrast, reduced-motion behavior, and a complete fallback. A data gradient must represent a labelled continuous scale.

#### Present data as evidence

Make the visual encoding honest. Show units, periods, populations, bases, and material comparators near the evidence they qualify. Use zero baselines for length encodings unless a clearly marked range or delta view better answers the question. Do not exaggerate small differences with cropped bars or hide them with nearly identical total bars; show the exact delta on the same basis. Never use a bar track as a divider or ornament. Every peer bar shares one documented scale and its length must encode the value; otherwise use aligned text.

When peer denominators differ, choose count or rate explicitly from the reader's question. Do not compare raw numerators as though the bases were equal. If length encodes a rate, show its count and base; if length encodes a count, explain why volume rather than incidence answers the question. Use aligned text or separate views when neither encoding is sufficient alone.

Size repeated horizontal bars as one layout, never row by row. Give the set one shared label lane, one plot lane, and one shared lane for every aligned value or annotation column. Every bar track starts and ends on the same grid lines; only the fill length varies. A row whose label, value, or annotation changes the plot width is a layout failure. Use a parent grid, subgrid, or fixed shared tracks rather than content-sized columns resolved independently inside each row.

Prefer direct labels to legends. Reserve a clear lane for every chart label so no mark, line, bracket, or annotation crosses its glyph box. Keep chart text legible in both themes. Use a caption to state what the reader should notice and what the chart does not establish. Provide a semantic table or concise text alternative for material chart data.

When a chart is the primary proof, give it enough width, height, and contrast to carry the first read. Visual salience must agree with the argument: the decisive series, exception, or threshold receives the strongest emphasis in both themes, while supporting evidence recedes without becoming illegible.

Tables are evidence, not decoration:

- Use a semantic `<table>` with caption, head, body, and optional foot.
- Span the full 12-column evidence width by default. Put the section introduction above it; do not strand a ledger beside a heading, note, or empty rail merely to fill a split grid.
- Match each column header’s alignment to every cell in that column. Left-align text columns and their headers; right-align numerical columns and their headers, including placeholders and totals. Apply the same numeric alignment rule to the numeric `<th>` and every numeric `<td>`; body-cell alignment does not align the header automatically. Never center or left-align a header above right-aligned values.
- Keep peer units and precision consistent; do not add fake precision.
- Bottom-align multi-line column headers only. Body cells use `vertical-align: baseline` so every cell aligns to the row's first text baseline, including when one cell wraps; never vertically center or bottom-align body rows.
- Give the row-label column enough width for ordinary short labels to stay on one line. Do not wrap a short row label while sibling columns hold unused width. If labels genuinely need multiple lines, wrap at word boundaries and preserve the shared first baseline.
- Do not spend a column repeating the same category for a run of rows. Group related rows with semantic row groups or separate tables when the category changes how the rows are interpreted. Keep the category column only when readers need its value for row-level sorting or filtering.
- Use normal density for ordinary short tables; compact density is for genuinely dense lookup.
- Highlight a recommended row only when the source supports the recommendation.
- Reorder columns around the reader's lookup task before shrinking or wrapping them.
- Give dense evidence enough width before choosing a split layout. A table with five or more columns, or any table whose headers wrap at normal desktop width, normally owns the full section width. Never clip, truncate, or shrink a header to preserve a neighboring prose rail; move the introduction above the table or simplify the columns.

```html
<th scope="col">Page</th>
<th scope="col" class="text-right tabular-nums">Visitors</th>
<!-- ... -->
<th scope="row">Homepage</th>
<td class="text-right tabular-nums">12,757</td>
```

Use a qualitative comparison for concise differences; use a comparison table when exact row-by-row scanning matters. Peer columns must have matching type roles and aligned row starts. If one peer needs a different structure, it is not a peer grid.

#### Make tools and calculators usable

Treat interaction as evidence, not decoration. A calculator should make one model legible and let the reader test the assumptions that materially change the result.

Define one canonical state model: variables, fixed inputs, formulas, units, full precision, ranges, increments, defaults, display precision, and dependencies. One control owns each variable. Fixed parameters are not controls. Pre-render the default result. Update dependent outputs atomically from full-precision state, then format for display.

Keep the focal result, controls, and supporting outputs in one coherent tool. When using the calculator is the reader's main job, the working tool is the dominant object in the first viewport; do not delay it below oversized orientation copy or a sparse hero. Do not precede it with a ceremonial static version of the same answer or follow it with a default-scenario recap. Explain formulas, assumptions, bounds, or interpretation only when they help the reader trust or use the model.

Use native controls with visible labels, helpers only when needed, clear units, visible focus, and one concise live status. Preserve invalid entries and the last valid result rather than silently clamping or defaulting. Keep all controls and results usable by keyboard and screen reader.

Use Honest UI `Field` with `NumberField`, `InputGroup`, `Slider`, `Select`, or another control whose behavior fits the variable. Keep the visible label and helper outside the bordered input surface, associate them programmatically, and keep units visible:

```tsx
<Field>
  <FieldLabel>Commitment rate</FieldLabel>
  <NumberField defaultValue={8} min={4} max={12}>
    <NumberFieldGroup>
      <NumberFieldInput />
      <span aria-hidden="true">%</span>
    </NumberFieldGroup>
  </NumberField>
  <FieldDescription>From 4% to 12%.</FieldDescription>
</Field>
```

Use the exact exports and composition documented by the installed component version; do not invent wrapper names from this example.

#### Add motion with restraint

Default to stillness. Never add auto-scrolling marquees, simulated typing cursors, or decorative pulsing status indicators. Add motion only when it explains a state change, preserves continuity, or confirms an action. Never gate reading behind animation, reveal every section on scroll, move imagery on hover, or add bounce, parallax, cinematic transitions, sound, or spectacle. Keep the base experience complete without motion and respect reduced-motion preferences.

For formal report pages, create delight through unusually clear evidence or unusually low interaction friction: a comparison understood immediately, a calculator that makes a model obvious, or a customer-specific interaction that removes work. Do not manufacture personality with jokes, celebration, Easter eggs, decorative motion, or effects.

#### Choose media and icons deliberately

Use supplied screenshots, diagrams, customer media, or logos only when they are evidence or materially improve understanding. Use Honest UI vectors or shaders only when they reinforce the page's specific visual thesis; never use them as automatic hero filler. Never add stock imagery, decorative AI illustrations, fake product screenshots, or mandatory hero media. Use `honestui/icons` for interface meaning, not decoration or colored icon tiles. Prefer text labels unless an established icon makes an action materially faster to recognize.

### Review, test, and refine

Render the actual result when tooling exists. Inspect the first viewport, full page, and both light and dark themes. Also verify responsive reflow before handoff, but do not expose an evaluation matrix or critique report unless the user asks for one.

Review in this order:

1. **First read:** Is Honest UI authorship immediate? If the reader saw only the first viewport, would they remember the central relationship, decision, or tool rather than only the title or mood?
2. **Language:** Can the least specialized named stakeholder explain the answer after reading the headings and captions? Is every unfamiliar term defined in plain words? Did simplification preserve every material qualifier and avoid broader claims than the source supports? Does the methodology describe the chosen method and its limits rather than an execution diary?
3. **Composition:** Is there one dominant object? Does each section advance the argument? Is any empty space accidental?
4. **Typography:** Are roles consistent, peer values equal, baselines aligned, prose readable, gutters unmistakable, and vertical rhythm relational rather than uniform? Does each visible gap have one owner?
5. **Evidence:** Does geometry prove the claim? Do repeated rows share exact label, plot, value, and annotation grid lines? Are tables full width? Do headers match the alignment of representative cells in every column? Does a short row label wrap while another column has room? Does a repeated category waste a column? Is any default audit subset neutral and declared? Are chart labels clear? Is anything repeated without a new reader task?
6. **Restraint:** Can any surface, border, pill, icon, label, color, paragraph, or section be removed without losing meaning, affordance, or rhythm? If yes, remove it.
7. **Themes and reflow:** Do light and dark have equivalent hierarchy and contrast? Does the page recompose without overflow or character-level wrapping?
8. **Trust and access:** Are semantics, focus, labels, text alternatives, sources, caveats, and interaction behavior sound?

Fix the highest-impact systemic defect, render again, and repeat until no known material visual or usability issue remains. Keep this work internal. Deliver the requested implementation, not a score, process diary, comparison log, or self-critique.

## Avoid the usual generated-design patterns

Do not ship any of these recognizable defaults:

- All-caps or tracked eyebrows, kickers, overlines, and decorative numbered section labels.
- Em dashes.
- Generic gradients, glows, blobs, glass, or ornamental shadows with no Honest UI-specific compositional job.
- Generic centered hero copy followed by a card grid.
- Repeated metric boxes when one composed relationship would be clearer.
- A badge, pill, or rounded capsule for ordinary metadata, chart annotations, or editorial labels.
- Cards nested inside cards, or borders used to repair weak hierarchy.
- A dark rounded rectangle around every chart or calculator.
- Arbitrary icon tiles, oversized icons, or mixed icon styles.
- Tiny muted prose, arbitrary font sizes, inconsistent peer values, or misaligned baselines.
- A narrow table floating inside a wide section, or a wide table compressed into broken words.
- Decorative charts, redundant visualizations, legends that replace direct labels, or color without meaning.
- Repeated full-width bars that do not share a scale or encode a visible difference.
- Identical section silhouettes across unrelated reader questions.
- Repeated recommendation, summary, rationale, and conclusion sections that say the same thing.
- Authoring-process narration such as how the page was organized, why a representation was chosen, or how source fields were renamed. Keep concise interpretive captions that state an evidence-led takeaway or limitation.
- Report-only theme controls that duplicate the host setting, print-only UI, stock imagery, fake screenshots, or decorative brand marks.

Do not compensate for avoiding these defaults by producing a sterile anti-design template. Honest UI restraint is precise hierarchy, excellent typography, clear evidence, strong alignment, visible ownership, and one deliberate source of expression. It is not merely neutral colors, thin rules, and large empty margins.

## Build with Honest UI components and tokens

Use semantic HTML first, then the installed Honest UI component whose contract fits the interaction. Do not treat every available component as a requirement.

Common copied component families include:

- Actions and navigation: Button, Breadcrumb, Menu, Dropdown Menu, Context Menu, Command, Pagination, Tabs, Toolbar, Toggle, Toggle Group, and Group.
- Forms: Form, Field, Fieldset, Label, Input, Input Group, Textarea, Number Field, Checkbox, Checkbox Group, Radio Group, Switch, Select, Combobox, Autocomplete, Slider, and Color Picker.
- Feedback and state: Alert, Alert Dialog, Toast, Gooey Toast, Progress, Meter, Skeleton, Empty, Tooltip, and Badge.
- Surfaces and disclosure: Card, Frame, Accordion, Collapsible, Dialog, Sheet, Popover, Preview Card, Scroll Area, and Separator.
- Data and product patterns: Table, Data Table, Data Grid, Filter Bar, Date Range Picker, File Upload, and Kanban List.

Use Field to connect a control with its visible label, instructions, requirement, and validation message. Use Alert for persistent important information and Toast only for brief, noncritical feedback. Use Alert Dialog when a modal decision blocks progress and Dialog for a focused short task. Use Table for semantic lookup, Data Table for common sorting and filtering, and Data Grid for large interactive datasets. Use Empty to distinguish first use, no data, filtered results, and permission-limited content. Use Tooltip only for brief, nonessential hints.

Use charts from `honestui/charts` and load `honestui/charts.css`. Use icons from `honestui/icons`, logos from `honestui/logos`, vectors from `honestui/vectors`, and shaders from `honestui/shaders`. Import only named assets the artifact uses. Preserve reduced-motion and non-WebGL fallbacks where applicable.

Page-owned CSS and Tailwind utilities may read these public token families:

- Surfaces and text: `--hui-color-background-*` and `--hui-color-foreground-*`.
- Borders and states: `--hui-color-border-*`, `--hui-focus-ring`, `--hui-focus-ring-shadow`, and the focus offset tokens.
- Data: `--hui-color-viz-{family}-{step}` using the documented visualization families and steps.
- Rhythm and shape: `--hui-space-1` through `--hui-space-17`, `--hui-radius-1` through `--hui-radius-6`, and `--hui-radius-full`.
- Typography: `--hui-font-title`, `--hui-font-body`, `--hui-font-mono`, the body/title/mono size recipes, matching line heights and letter spacing, and the published weight tokens.
- Effects: `--hui-shadow-*`, `--hui-duration-*`, `--hui-ease-*`, `--hui-transition-interactive`, `--hui-transition-pressed`, `--hui-scale-pressed`, and `--hui-scale-pressed-strong`.
- Overlays and blur: `--hui-color-overlay-*` and `--hui-blur-*`.

Use semantic color tokens in component code. Lower-level palette values such as `--hui-neutral-*`, `--hui-accent-*`, `--hui-danger-*`, `--hui-attention-*`, and `--hui-success-*` are inputs for building or overriding the theme, not component meaning.

The shared theme scope uses `data-theme="light"` or `data-theme="dark"` and `data-style="modern"` or `data-style="traditional"`. Optional palette overrides are `data-accent-color="orange"` or `"mint"` and `data-gray-color="gray"`, `"mauve"`, `"slate"`, or `"sage"`. Preserve the host theme controller; Honest UI does not own persistence or system-theme detection.

Use exact token names with `var()`. Never invent or redeclare a `--hui-*` token. Prefer `currentColor`, `inherit`, or `transparent` when a custom mark needs no distinct semantic role. Use raw values only for real local exceptions such as a one-pixel rule or material-specific visualization geometry.

Example:

```tsx
<section
  className="
    rounded-[var(--hui-radius-3)]
    border border-[var(--hui-color-border-base-primary)]
    bg-[var(--hui-color-background-base-secondary)]
    p-[var(--hui-space-7)]
    text-[var(--hui-color-foreground-base-primary)]
    shadow-[var(--hui-shadow-feather)]
  "
>
  ...
</section>
```

A copied component is owned application code, but it still has a contract. Preserve or deliberately redefine its purpose, content rules, variants, keyboard behavior, focus lifecycle, states, responsive behavior, loading and error behavior, wrapping, and accessibility semantics. Do not create a new primitive merely to avoid understanding the installed one.

## Make every viewport and input method work

Use landmarks, one descriptive `h1`, ordered headings, a skip link, native controls, semantic tables, figures and captions, accessible names, visible focus, and text alternatives. Meet WCAG AA and never rely on color alone. Treat source order as reading order.

Do not conceal page overflow. Give grid and flex children `min-width: 0`; reflow before shrinking. Preserve readable type and control sizes. Short comparisons may stack; long ledgers may scroll locally when reordering and simplification cannot preserve lookup. The page must remain usable in every supported theme and across desktop and narrow screens. Preserve the host product's existing theme controls and preference behavior.

The target is Honest UI judgment, not Honest UI decoration.
