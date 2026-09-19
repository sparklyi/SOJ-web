# SOJ Visual Language

This document is the visual contract for SOJ-web. Page work must consume these tokens, primitives, and patterns instead of inventing page-local styles. Where this document and an existing page disagree, **this document wins and the page is the bug**.

The live baseline route is `/style-guide`. It is built from the real shared components, so it cannot drift from them. Page work is not reviewable until it is consistent with that route.

## What changed, and why

This revision replaces the earlier "premium dark contest cockpit" direction. That direction failed on three counts, and all three were visible to a first-time visitor:

1. **It read as a template.** Acid lime on near-black over the Geist font stack is one of the most recognisable default combinations in existence. Nothing about it said "this particular product".
2. **It had no material.** Surfaces were 1px borders plus flat fills. A dark UI built only from outlines reads as a wireframe, no matter how tight the spacing is.
3. **It had no motion.** Every state change was instantaneous, so nothing communicated "this system is running".

The replacement is **cold silver + obsidian blue**, a material layer, and a small motion layer. It keeps the discipline that made the old contract worth having (no page-local styling, no decorative gradients, no boxed metric grids) and drops the palette and the flatness.

It also drops a piece of invented product narrative. "SOJ" is a name; the earlier copy explained it as an acronym ("Signal Arena", "Signal Path", "signal network") and dressed the mock data in that story. Invented lore in placeholder data is the fastest way to make a real product look like a demo.

Two corrections followed, both of which only became visible once the redesign was reviewed somewhere other than the homepage. The motion layer existed only on the route it had been written into, so every other page had a dead background; and the pages showed everything they had rather than what the reader had come for. Those two failures produced the **Environment** and **Information Architecture** sections below. They are the two sections most likely to be skipped by page work that believes it is only doing styling.

## Design Read

A precision instrument for students, contest participants, and operators: a dark, quiet, high-density surface where structure comes from luminance steps and 1px hairlines, and colour is spent deliberately.

- Design variance: 6
- Motion intensity: 5
- Visual density: 7

The one-line test for any screen: **if you removed every colour, would you still know what is a container, what is a row, what is a number, and what you are supposed to click?** If not, the hierarchy is being carried by colour and the screen needs rework.

The second test, which the previous version did not have: **does the page have any surface with thickness?** If every element is a flat fill with an outline, the layout may be correct and still feel cheap. See "Material" below.

## Palette

All colours are semantic CSS variables in `app/globals.css` and Tailwind tokens in `tailwind.config.ts`. Components reference `soj.*` classes only.

| Token | Value (RGB) | Use |
| --- | --- | --- |
| `soj.bg` | `8 10 15` | App background. Blue-leaning near-black. |
| `soj.bg-raised` | `12 15 21` | Panels and shells. One step above the page. |
| `soj.surface` | `17 21 30` | Interactive groups, tag chips, nested wells. |
| `soj.surface-2` | `25 30 41` | Hovered rows, selected tabs, meter tracks. |
| `soj.line` | `30 36 47` | Hairlines, row dividers, table borders, panel outlines. |
| `soj.line-strong` | `46 54 68` | Edges that must survive on top of a panel. |
| `soj.text` | `226 232 241` | Primary copy and numeric values. |
| `soj.muted` | `146 157 174` | Secondary labels and helper copy. |
| `soj.faint` | `96 106 122` | Eyebrows, column labels, placeholders, footnotes. |
| `soj.silver` | `205 216 231` | The material colour. Metres, bars, non-primary emphasis. |
| `soj.accent` | `108 152 255` | Obsidian blue. See "Accent budget". |
| `soj.success` | `74 214 158` | Accepted and successful outcomes. |
| `soj.warning` | `240 178 88` | Pending, frozen, risky, partial outcomes. |
| `soj.danger` | `246 106 118` | Rejected, failed, destructive, blocked outcomes. |

Two editorial rules that were learned the hard way:

- **The background steps must lean blue, not neutral grey.** A neutral grey base makes obsidian blue look grey; a green-grey base kills it outright. The base has a deliberate blue cast for this reason — do not "clean it up" to neutral.
- **A ladder must start brighter than its track.** The first attempt at the difficulty ladder used `soj.line-strong` for the easiest tier, which is roughly the same value as the track it sits in. The easiest tier vanished and the whole chart read as a single blue bar. Any ordered ladder needs its lowest step to be clearly lighter than its own track.

Run `npm run lint:style` before every commit. It rejects raw hex and rgb literals in `app/`, `components/`, and `features/`.

### Canvas colours

The particle field reads its colours from `--soj-fx-*` at runtime, so no colour literal appears in the component source. Those variables must be **resolved, comma-separated** colours — `rgb(8, 10, 15)`.

- `rgb(var(--x))` fails: `getComputedStyle().getPropertyValue()` returns the literal text, not a resolved colour.
- Space-separated CSS Color 4 syntax fails: several browsers' canvas paths reject it.
- Comma-separated resolved values are the only form that works for both.

## Accent Budget

Obsidian blue is the scarcest resource. On any single screen it may appear for **at most four** distinct semantics:

1. **Live state** — something is happening right now (running contest, active judge, live pulse).
2. **Focus** — focus rings and selection.
3. **Link** — a navigation affordance.
4. **Data extreme** — the top of an ordered ladder (the hardest tier, the busiest problem, the filled portion of a gauge).

There is no "primary action" slot in this list, and that is the point. **The primary action is metallic silver, not blue.** A silver button is the brightest object on a dark page, so hierarchy is established by luminance instead of saturation — which is what makes a dark UI look expensive rather than loud.

Consequences:

| Wrong | Right |
| --- | --- |
| Solid accent-filled button with a coloured glow shadow | `Button` variant `primary` (`.soj-metal`) |
| Accent eyebrow / kicker text | `soj.faint` |
| Accent-tinted count in a "how many of X" chip | neutral surface; accent is for state, not quantity |
| Accent inline status text that is not a link | `Badge` with the matching semantic tone |
| Glow shadows on buttons | no glow. Glow is a page-level light source, at most two per page. |

Practical check: open the page and count saturated blue elements. A dense data page should land around 4–7 (logo mark, live badge, one or two links, the data-extreme tier, one glow). Above 9 means the accent has leaked into decoration again.

## Material

Three things together are what make a flat fill read as a surface. Remove any one and it degrades back to a wireframe:

1. **Micro-grain** — a fixed `body::after` overlay with an SVG turbulence noise image at ~4% opacity. This is what removes the "digitally flat" emptiness from large dark areas.
2. **1px inner highlight** — `inset 0 1px 0 rgb(255 255 255 / 0.05)` on the top edge of raised surfaces. It makes a plane read as having thickness.
3. **One radial glow** — a single page-level light source. At most two per page (the homepage hero, and one live/focal region).

Material primitives:

| Class | Role |
| --- | --- |
| `.soj-panel` | Raised surface: top-lit gradient + inner highlight. `Panel` default variant. **Semi-transparent** (`soj.bg-raised` at 86%) so the app environment reads through it. |
| `.soj-panel-flat` | Transparent, outline only. For sections that should blend into the page. |
| `.soj-well` | Recessed: code editors, example I/O blocks, logs. The only second surface allowed inside a panel. |
| `.soj-chip` | A single standalone reading. Not a grouping device — do not build metric grids out of it. |
| `.soj-metal` | The primary action. Vertical silver gradient + inner highlight + inner shadow. |
| `.soj-inset-light` | Top inner highlight for thin surfaces (inputs, selects, nav selection). |
| `.soj-gridlines` | Coordinate grid. Gives dense areas a spatial reference. |
| `.soj-hairline` | Fading divider for when a full-width 1px line would be too hard. |

Hierarchy comes from four moves, in this order of preference:

1. **Luminance step** — page `soj.bg` → panel `soj.bg-raised` → well `soj.bg`. Three steps are enough; a fourth reads as noise.
2. **Material** — top-lit gradient and inner highlight rather than another border.
3. **Hairline** — a 1px divider splits a panel into sections instead of stacking separate cards.
4. **Whitespace** — when two things are genuinely unrelated, separate them with space, not another box.

Hard rules:

- **One panel, many sections.** A reading page is one continuous panel with hairline-split sections, not five sibling cards.
- **Never repeat a metric.** If acceptance rate appears in the page header, it does not also appear in the side rail. Pick the one place where it is read.
- **No nested cards.** A card inside a card inside a card is the failure mode this contract exists to prevent.
- **No boxed metric rows.** Use `Stat` / `StatGroup` / `StatDivider`: borderless label + mono value, separated by vertical hairlines. A row of five bordered metric cells is dashboard noise.
- **Empty states are not hollow cards.** Use `EmptyState` so absence of data is stated rather than implied by a blank rectangle.
- **Panels are translucent on purpose.** They sit at 86% opacity over the app environment (see "Environment"). Opaque panels are the reason a page can look correct and still feel like it was pasted onto the background: below the first viewport every surface becomes a solid rectangle and the environment stops existing.

## Environment

The app has **one** background, and it belongs to the app rather than to any page.

`AppAtmosphere` (`components/fx/app-atmosphere.tsx`) is mounted **once, in the root layout**. It renders a fixed, `pointer-events: none`, `aria-hidden` layer at `z-0`; page content sits in a `relative z-10` sibling. No page opts in, and no page can forget it.

This is the fix for a specific failure. The first version of the motion layer put `ParticleField` *inside* the homepage hero component. The result was that exactly one screen in the product had an environment and every other screen had an empty fill behind its panels. **A background that exists on one route is not an environment; it is a decoration attached to that route, and it reads that way immediately.**

### Intensity is inversely proportional to attention

Presets are set by **how much of the user's attention a page must consume**, not by how important the page is. A page that asks the user to read and think gets a still background, because a moving field behind prose is competition for the same attention. A page that gets projected on a wall gets a livelier one, because nobody is reading it up close.

| Preset | Routes | Field | Grid | Bloom | Top light | Why |
| --- | --- | --- | --- | --- | --- | --- |
| `flow` | `/`, `/style-guide` | density 2.5, speed 1.0 | 0.8 | 1.0 | 1.0 | The only routes allowed to feel atmospheric. The homepage is the one screen where the visitor has nothing to read yet. |
| `drift` | list and overview routes (`/problems`, `/contests`, `/submissions`, `/me`) | density 1.05, speed 0.72 | 0.5 | 0.72 | 0.7 | Present, so scanning a table never happens on a dead surface; slow enough that it is not noticed while scanning. |
| `focus` | `/contests/*/arena`, `/contests/*/scoreboard` | density 1.4, speed 1.3 | 0.85 | 1.05 | 1.0 | Projection surfaces, viewed from a distance, so more movement is legible rather than distracting. |
| `still` | reading and working routes (`/problems/[id]`, `/submissions/[id]`, `/contests/[id]/problems/[id]`, `/auth/*`, `/settings`, `/manage/*`, `/admin/*`) | **none** | 0.3 | 0.5 | 0.45 | No canvas at all. Reading a statement or writing code with a flow field behind it is a usability defect, not a style choice. |

Rules:

- **Route matching is by path *shape*, not prefix.** `/problems` is a list (`drift`); `/problems/12` is a reading page (`still`). Same prefix, opposite requirements. A prefix-only rule would silently give the reading page a moving background.
- **The presets differ only in parameters.** All four share one canvas implementation, one grid layer, one bloom pair, one vignette, one top light. Four presets with their own imagery would read as four different products sharing a stylesheet.
- **`field: null` means no canvas is mounted at all** — not a paused one, not a transparent one. An idle canvas still spends frame budget for a page that gains nothing from it.
- **The grid mask anchors to the content, not the corner.** It is a masked ground plane that fades toward the reading area; anchored to a corner it becomes wallpaper, which is the thing that looks generated.
- On small screens the grid is dropped entirely and the secondary bloom is hidden. Two light sources plus a grid on a 380px viewport is not atmosphere, it is clutter.

## Data Visuals

**Every page header carries at most one data visual, or one stat group.** It gives the page a visual anchor in what is otherwise a column of text, and it answers a question the header's numbers cannot: "what is the shape of this?". A header with none is fine. A header with two is a dashboard.

The rule is one per header, not one per page — the header is the reader's entry point, and adding a second visual there turns it into a dashboard.

**A visual belongs where its decision is made, not where it looks best.** The difficulty composition used to sit in the problems-page header as a stacked bar plus a legend, while the actual difficulty filter sat below it as a plain dropdown and a separate "Apply" button. The chart answered "how are the problems distributed" and the control answered "show me the hard ones", and neither knew about the other. It is now a single object in the filter bar: the difficulty buttons themselves carry their counts. Moving it deleted a chart, a legend, an Apply button, and the reader's obligation to interpret two things that were always the same thing.

Three primitives, one per question type. All three live in `components/soj/`.

| Primitive | Answers | File |
| --- | --- | --- |
| `DifficultyBar` + `DifficultyLegend` | "what are the parts of this whole?" | `difficulty-composition.tsx` |
| `AcceptanceAxis` | "where does this value sit on a scale?" | `acceptance-axis.tsx` |
| `AcceptanceMeter` | "how do these rows compare?" | `acceptance-meter.tsx` |

Rules:

- **Ordered data uses a brightness ladder, not a rainbow.** Easy/medium/hard as green/yellow/red reads as a rainbow progress bar and destroys the ordering. Use three steps of one hue family: `soj.muted/45` → `soj.silver/75` → `soj.accent`. The hardest tier is the accent, because "hardest" is the data extreme.
- **Emit one definition.** Difficulty colours are defined once, in `difficulty-composition.tsx`, and difficulty *labels* once, in `lib/domain/problem.ts`. Two copies will drift, and one of them will be forgotten during the next palette change.
- **A track must be visible.** A meter whose track matches the background makes a 4.6% row read as "nothing was drawn" instead of "almost nobody passes" — those are different statements. Tracks use `soj.surface-2` against a panel background.
- **Bars go before the number, not under it.** A bar wider than its number pushes past it and the column reads as a set of unrelated underlines. Right-align the group in dense tables; the number sits in a fixed-width slot after the bar.
- **Do not encode the same datum twice in one row.** The acceptance meter is neutral silver, not semantic colour, because the difficulty badge in the same row already carries colour. Two signals in one row is harder to read than one.
- Do not use a bar to restate a number the reader can already compare column-wise. Bars earn their space where values differ by more than an order of magnitude.

## Information Architecture

Polish does not rescue a page that shows the wrong things. This section is the contract for **what belongs on a page**, and it exists because a previous revision shipped pages that were well-built and still wrong: every table exposed every column it had, every page opened with its own dashboard, and every row offered every action it could perform.

The working question is not "is this useful?" — almost everything is *useful*. It is **"who is looking at this, and what did they come here to do?"** A number only an operator wants is noise when a visitor is the one reading the page, whether or not it is accurate.

### Top navigation carries places, the account menu carries mine

- The top nav holds **destinations any visitor could go to**: 首页 / 题库 / 比赛. Nothing else, plus capability-gated operator entries for the roles that hold those capabilities.
- **"My submissions" is not a destination.** It is the current user's own data, and unauthenticated it renders as an empty page. Putting it in the top nav offers a visitor a link that leads nowhere. It lives in the account menu beside 我的主页 and 设置.
- The test is one line: **if the link is useless before login, it is not top-nav material.**

### A missing feature is smaller than a fake one

Every OJ's top nav has a global ranking. This one does not, and the gap is deliberate: the product has **no global rating model**. Its only leaderboard is per-contest, and the entry point for that lives inside each contest, where the data actually exists.

Building a global ranking page would mean inventing an across-the-board score. With only a handful of real scoreboard rows behind it, that page would be visibly fabricated the moment it loaded. It would have made the navigation look more complete and the product less credible — a trade worth refusing. When a real rating model exists, the nav item can be added.

### A page opens with an answer, not a dashboard

- A page opens with the thing the user came for. Submissions opens with the submissions table. The four-metric summary panel, the "latest submission" card, and the four-stage judge strip that used to sit above it were three separate renderings of the same run.
- **A page header carries at most one stat group, and it must describe the reader's relationship to the page.** The problems page shows *my* progress (warm-up / review / not-started), not the catalogue total. The catalogue total answers "what is this site?", which is not the question someone opening the problem set is asking.
- **A statistic must answer a question somebody actually asked.** "How many submissions does this platform have" is an operator's number; nobody reading a submission list came for it.

### Progressive disclosure beats total exposure

- **Lists show only the columns needed to answer "should I act on this row?"** Everything else is folded into the primary cell or dropped.
- **Derived or usually-empty data folds into the row's primary cell as a meta line**, and only when present. A column that is empty for most rows spends a full column's width saying nothing.
- **A row gets one primary action.** Secondary destinations become text links beside it, so actions of unequal weight stop looking equal.
- **A control and its chart should be the same object.** Where a distribution explains a filter, the filter carries the distribution.

### Column and surface pruning, as applied

| Surface | Before | After | Why |
| --- | --- | --- | --- |
| Problems table | 7 columns (id, title, tags, difficulty, acceptance, submissions, status) plus a row action | 4 (problem, difficulty, acceptance, status) | Tags became chips inside the title cell; per-problem submission counts answer a question the reader cannot act on; the row action duplicated the title link's destination. |
| Submissions table | 8 columns | 6 | Contest and score fold into the problem cell as a meta line, shown only when they exist. |
| Contest list | 3 buttons per row plus a standing "ACM vs OI rules" explainer panel | 1 primary action + 2 text links | The explainer repeated the same two rule sets on every visit; the three buttons gave equal visual weight to actions of very different weight. |
| Problems header | 4 progress numbers + a difficulty stacked bar + its legend | 3 progress numbers | The distribution moved to the filter bar, where it is used to make a decision. |
| Homepage | hero + 评测概览 (site totals, acceptance rate, difficulty mix, busiest-problem ranking) + 实时面板 + problem/verdict panels | hero + live contests + recommended problems + recent verdicts | The first two are operator dashboards. A visitor's first question is "what is this, and is anything happening", not "how many times has this site been submitted to". |

## Typography

Self-hosted via `next/font/local` — see `app/fonts/fonts.ts`:

- **Display — Space Grotesk** (`--font-soj-display`): brand wordmark and page titles.
- **Sans — IBM Plex Sans** (`--font-soj-sans`): product UI, reading, forms, navigation.
- **Mono — JetBrains Mono** (`--font-soj-mono`): numbers, verdicts, timers, scoreboard values, code-adjacent labels, micro-labels.

These replaced the Geist stack deliberately. Geist plus the default Vercel palette is the "generated by a template" signature; a display face with actual character is most of what separates a designed page from a generated one.

The CJK fallback chain is explicit in both `app/globals.css` and `tailwind.config.ts`. All three faces ship latin subsets only; without the chain, Chinese text falls back to a different weight and the mixed line looks loose.

Three classes carry all display type. Do not hand-roll `font-family` in a component:

| Class | Role |
| --- | --- |
| `.soj-display` | Page titles and brand. Tight tracking (`-0.035em`), `0.95` line-height. |
| `.soj-eyebrow` | Section names, units, axis annotations. Mono, 10px, uppercase, `0.22em`. |
| `.soj-num` | Digits that must align column by column. |

Rules:

- **Page titles live in `PageHeader`, outside the content container.** Do not sink a display-size title into a dense panel — it competes with the table for the same box.
- `PageHeader`'s eyebrow carries a short accent tick before it. It is not decoration: every page header has one, and it gives the reader a consistent left baseline that says "a new page starts here".
- Numbers use `soj-num` / mono with `font-variant-numeric: tabular-nums`, applied globally on `body`. A numeric column must never shift width between rows.
- Micro-labels are mono, 10–11px, uppercase, `letter-spacing: 0.14em`–`0.22em`.
- Display-size type (over 48px) needs a light-from-top gradient via `background-clip: text`. A flat large glyph reads as a placeholder. Keep an opaque fallback for browsers without `background-clip`.
- Never use em dashes in visible product copy.

## Motion

Motion explains state and depth. It never decorates. Every animation degrades to a static frame under `prefers-reduced-motion`.

Five devices, all in `components/fx/` and `app/globals.css`:

| Device | What it explains |
| --- | --- |
| `AppAtmosphere` | One environment for the whole app. Mounted in the root layout; selects the per-route preset. |
| `ParticleField` | Depth and "this system is running". Curl-noise flow field on canvas. |
| `useReveal` / `MotionBlock` | Section entry. Content arriving as you scroll to it, not all at once. |
| `CountUp` | A number is a measurement being taken. |
| `.soj-grow-x` | Data bars scaling in. A measurement landing. |

`ParticleField` design notes, all of which are load-bearing:

- The field is a **curl of a noise potential**, which makes it divergence-free. Particles therefore do not clump; they flow past each other like a fluid. A naive noise-following field clumps within seconds and reads as "grey snow", which is worse than no background at all.
- Speed is capped and normalised per particle (`MAX_SPEED`). Without normalisation, particles accumulate in low-potential regions and form visible blobs.
- It pauses when scrolled out of view (`IntersectionObserver`) and when the tab is hidden. It is a background, not a CPU tenant.
- Device pixel ratio is capped by the `maxDpr` prop (default 2). `AppAtmosphere` passes **1.25**, because a background layer is never read closely and the per-frame fill cost scales with the square of this number.
- **Trail length is the difference between "flowing grain" and "scratches".** `TRAIL_FADE` controls how fast the previous frame is erased. Too low and every particle leaves a long arc, so the whole field reads as thin scratches scored across the page; too high and the movement vanishes. It sits at `0.135`, and it is the single parameter most responsible for whether the field looks like a fluid.
- **Density and DPR trade against each other.** Raising `density` gives a richer field but costs per-particle work; lowering `maxDpr` cuts fill cost for every particle at once. The atmosphere pair (`density: 2.5`, `maxDpr: 1.25`) is simultaneously richer and cheaper than a full-DPR field at `density: 1.0`.
- **Only presets that declare a field mount a canvas.** `still` routes render nothing at all.
- The host element applies a **radial mask that fades toward the text**. Without it, particles cross the headline and the composition dies. The mask must be on the field element itself; put it on a full-bleed parent and the gradient lands outside the graphic and does nothing.
- Reduced motion draws a single static frame of streamlines rather than nothing. The composition still needs to exist without movement.

`useReveal` runs on a **safe-by-default** model: content is visible in the server-rendered HTML, and JavaScript only "arms" the animation once it is ready to drive it. If scripting fails, the page is fully readable. Never ship markup that starts at `opacity: 0` and depends on JS to become visible.

`CountUp` renders the **final value** server-side and only rewrites `textContent` during the animation. Tests, crawlers, and screenshots therefore never observe a `0`.

Rules:

- Do not animate layout properties.
- No hover animation that shifts rows or text horizontally — it interrupts horizontal scanning of a table. Hover feedback is a background-colour change.
- Motion is `cubic-bezier(0.16, 1, 0.3, 1)` for entry, `0.9s`–`1.6s` for data, `0.15s`–`0.2s` for interaction feedback.

## Shape And Density

Radius scale (`tailwind.config.ts`, `--radius-soj-*`):

- Small: `rounded-soj-sm`, 4px — chips, code samples, score cells.
- Medium: `rounded-soj-md`, 6px — buttons, inputs, selects, inner wells.
- Large: `rounded-soj-lg`, 8px — panels, tables.
- XL: `rounded-soj-xl`, 12px — full-page shells and the hero.

Rules:

- Do not use `rounded-2xl` or `rounded-3xl` (also enforced by `scripts/style-lint.mjs`).
- **Do not use asymmetric or multi-value radius.** `border-radius: 18px 6px 14px 6px` is a costume, not a system; it makes the radius scale meaningless and reads as noise at scale. Every corner on a surface uses one scale step.
- Table headers stick to the top of their scroll container (`TableHead sticky`) with a solid `soj.bg-raised` background, so long lists stay readable.
- Right-align numeric columns and set them in mono. Left-align everything else.
- Stable dimensions are required for counters, toolbars, tables, score cells, and verdict tiles.

## Mock Data Realism

Placeholder data is part of the interface. It is the first thing a reviewer looks at, and uniform fake data is more damaging than an ugly colour.

- **Vary every statistic.** Eight problems all at 43.x% acceptance is immediately legible as generated. Real problem sets span both orders of magnitude, so acceptance runs from roughly 4% to 75% with a plausible spread, and each problem's difficulty agrees with its acceptance.
- **Anchor times relative to now**, at hour granularity so server and client agree. A "running" contest must actually be running when the page loads; a static date turns into a lie the moment the clock passes it.
- **Give each record its own timestamp.** A submission list where all eight rows read the same time is the cheapest tell there is. Space them unevenly (`3 / 8 / 11 / 16 …` minutes) so the cadence looks human.
- **Do not invent product lore.** No acronym expansions, no named internal systems, no themed problem names. `Shortest Path`, `Cache Relay`, `Arena Clock` are fine. A "Signal Path" on a "directed signal network" is not, because it implies a product story that does not exist.

## Component Library Policy

Source-owned components, shadcn/ui style: the code lives in this repo and can be edited freely. This is **not** a ban on component libraries.

Allowed, already in use:

- `@radix-ui/*` — the unstyled primitive layer (dialog, popover, select, tabs, tooltip).
- `class-variance-authority` — variant definitions for `Button`, `Badge`.
- `lucide-react` — icons.
- `tailwind-merge` + `clsx` via `lib/ui/cn`.

Allowed to add when a real need appears: `sonner` (toasts), `cmdk` (command palette), `@base-ui/react` (adopt for **new** primitives only; do not migrate existing Radix components for its own sake).

Not allowed:

- `antd`, `element-plus`, `ant-design-vue`, `vue`, `vue-router`, `pinia` — wrong runtime or wrong design language; also blocked by `scripts/style-lint.mjs`.
- Any dependency whose components need a full theme override to shed their own visual identity.

Rule of thumb: a component library may supply **behaviour** (focus management, positioning, a11y) for free. It must not supply **appearance**.

### The lint's own blind spot

`npm run lint:style` screens for raw colour literals, but its original regex used a word boundary (`\brgb\(`). Tailwind's arbitrary-value syntax replaces spaces with underscores, so `shadow-[inset_0_1px_0_rgb(...)]` has an underscore before `rgb` — and `_` and `r` are both word characters, so no boundary exists and the rule was silently bypassed across a dozen files. The pattern is now a negative lookbehind for a letter. When adding a lint rule, test it against the escaped _and_ the escaped-in-an-arbitrary-value form.

## Shared Components

Low-level primitives live in `components/ui/**`:

- `Button` (`buttonVariants`: `primary` / `secondary` / `outline` / `ghost` / `danger` / `link`; sizes `xs`–`lg`; no coloured glow shadows)
- `Badge` (+ `badgeVariants`; tones `neutral` / `accent` / `success` / `warning` / `danger` / `info`; `emphasis="solid"` is for at most one element per screen)
- `Panel`, `PanelHeader`, `PanelBody`, `PanelFooter`
- `PageHeader`
- `EmptyState`
- `Stat`, `StatGroup`, `StatDivider`
- `Table`, `TableHead` (`sticky`), `TableRow`, `TableCell`, `TableHeaderCell`
- `Input`, `Textarea`, `Select`, `IconButton`, `Tabs`, `Dialog`, `Popover`, `Tooltip`, `Toast`, `Skeleton`

SOJ product components live in `components/soj/**`:

- `StatusPill` (thin wrapper over `Badge` — status colour is defined once, in `Badge`)
- `VerdictBadge`, `ProblemStatus`
- `ContestClock`
- `MetricFeed`
- `DifficultyBar`, `DifficultyLegend`, `tallyDifficulty`
- `AcceptanceAxis`, `AcceptanceMeter`
- `SubmissionTimeline`, `TestPointMatrix`, `ScoreboardGrid`, `RankMovement`
- `CodeWorkspace`
- `ProblemStatement` (the full reading panel; the title is owned by `PageHeader`)
- `AuthGate`

Motion components live in `components/fx/**`:

- `AppAtmosphere` (mounted in the root layout — the app-wide environment layer)
- `ParticleField`, `MotionBlock`, `useReveal`, `CountUp`

Domain enums map to label keys and tones in exactly one place: `lib/domain/problem.ts`. Do not re-declare a difficulty or status colour map inside a component.

Numeric formatting lives in exactly one place: `lib/ui/number.ts` (`formatNumber`, `formatDuration`, `formatMemory`). Server components and client components must call the same implementation, and the locale must be passed explicitly — otherwise the same figure renders as `13543` in one place and `13,543` in another, which is more damaging than either form on its own and is very hard to catch in review.

## Worker Rules

Do:

- Use `soj.*` colour classes, the radius scale, and the material primitives.
- Use shared `components/ui`, `components/soj`, and `components/fx` components.
- Put every user-visible string through `lib/i18n`. Hardcoded English in a Chinese interface is a bug, not a detail.
- Keep header stats to one group, and keep data visuals where their decision is made.
- Register a new route in the `AppAtmosphere` preset table when its attention requirement differs from `drift`, and justify the choice in the table's comment.
- Update this document when adding a shared token or shared component.
- Run `npm run lint:style`, `npm run lint`, and `npx tsc --noEmit` before every commit.

Do not:

- Add raw hex or rgb colours in `app`, `components`, or `features`.
- Add page-local button, input, badge, or panel styling.
- **Mount a `ParticleField` on a page.** The environment is global; a page-local field is how the background becomes a decoration again.
- **Add a page-level dashboard above the content the page is for** — metric blocks, summary cards, stage strips. If the data matters, it belongs in the table row or the header's single stat group.
- **Add an element to the top nav that is useless before login.** That belongs in the account menu.
- **Surface a number nobody acts on** because it happens to be available. Availability is not a reason to render.
- Fill a button with `soj.accent`, or put a coloured glow shadow on any element.
- Use purple, decorative gradients, or scanline/skew pseudo-elements.
- Build generic equal 3-card sections, or any grid of same-shaped cards where a table or a row list would carry the same data.
- Add decorative status dots unless they communicate real state.
- Use em dash characters in visible product copy.
