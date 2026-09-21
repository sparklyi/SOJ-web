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
| `soj.faint` | `124 136 154` | Eyebrows, column labels, placeholders, footnotes. Measured 5.51:1 — see below. |
| `soj.silver` | `205 216 231` | The material colour. Metres, bars, non-primary emphasis. |
| `soj.accent` | `108 152 255` | Obsidian blue. See "Accent budget". |
| `soj.success` | `74 214 158` | Accepted and successful outcomes. |
| `soj.warning` | `240 178 88` | Pending, frozen, risky, partial outcomes. |
| `soj.danger` | `246 106 118` | Rejected, failed, destructive, blocked outcomes. |

Two editorial rules that were learned the hard way:

- **The background steps must lean blue, not neutral grey.** A neutral grey base makes obsidian blue look grey; a green-grey base kills it outright. The base has a deliberate blue cast for this reason — do not "clean it up" to neutral.
- **A ladder must start brighter than its track.** The first attempt at the difficulty ladder used `soj.line-strong` for the easiest tier, which is roughly the same value as the track it sits in. The easiest tier vanished and the whole chart read as a single blue bar. Any ordered ladder needs its lowest step to be clearly lighter than its own track. The composition bar is now the only ladder left on the site (difficulty everywhere else is encoded by length), and its lowest step is `soj.silver/35` against a `soj.bg/75` track for exactly this reason.

And one measured rule about the label tier:

- **A label needs *more* contrast than body copy, not less.** The first palette shipped `soj.faint` at `96 106 122`, which is **3.62:1** on the base — under the 4.5:1 AA line. It carried every micro-label on the site (section names, units, axis annotations), so the labels were the least readable text on the page while the numbers sitting next to them were the brightest thing on it. The verdict from the reader was 「只能看到数字」 — only the numbers are visible. A label is not "less important content"; it is the *only* thing telling the reader what the number means, and unlike body copy it has no surrounding sentence to be reconstructed from. Raising it to `124 136 154` (5.51:1) costs nothing: it is still the lightest of the three text steps.

  Two habits follow from this, both now scripted:

  - `.visual-check/a11y-contrast.mjs` walks every text node on a page, resolves its real computed colour **and its effective background** (walking up through translucent layers), and prints whatever falls under the line for its size. Known blind spot, deliberately reported separately rather than as a failure: it reads `background-color`, not `background-image`, so anything sitting on a gradient (the metal button) comes out as a false 1:1 — it is flagged as "cannot judge" instead of being counted as a defect.
  - The homepage labels are locked by an e2e guard that recomputes the WCAG ratio **from computed styles** rather than asserting a token name. Renaming a token must not break the guard; genuinely dimming a colour must.

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
4. **Data extreme** — the filled portion of a scale (the acceptance axis on a problem header).

A fifth use — the **my-progress row tint** on the problem list — shares slot 4's logic: it is large-area but extremely faint (`accent/12`), so it reads as "the same hue, deepened" rather than a second colour. The row tint was once success green; green is the complementary temperature to the blue-leaning base, so a full row of it reads as a foreign patch bolted onto the page. Large areas of colour must share the base's temperature; small marks (a few characters of feedback text, test-point cells) may keep the semantic green.

There is no "primary action" slot in this list, and that is the point. **The primary action is metallic silver, not blue.** A silver button is the brightest object on a dark page, so hierarchy is established by luminance instead of saturation — which is what makes a dark UI look expensive rather than loud.

Consequences:

| Wrong | Right |
| --- | --- |
| Solid accent-filled button with a coloured glow shadow | `Button` (default variant `solid`, `.soj-metal-flat`) |
| A beveled button (vertical gradient + top white edge + bottom dark edge) | flat silver. The beveled `.soj-metal` was retired site-wide — see Material. |
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
| `.soj-metal-flat` | The primary action, and the **only** metal there is. Flat silver: a single fill, no gradient, no inner edges. `Button`'s default variant (`solid`). |
| ~~`.soj-metal`~~ | **Retired.** It was the same silver with the depth cues put back (vertical gradient, `inset 0 1px` white top edge, `inset 0 -1px` dark bottom edge). The distinction it was invented for — "bevel on dense application screens, flat inside typographic compositions" — did not survive contact with the site: once every page was pulled onto one language, the beveled variant had no screen left where it was the right answer, and a page could hold two buttons of the same rank in two different materials. The variant and the `--soj-metal-to` token are gone; do not reintroduce them without retiring this paragraph. |
| `.soj-sheet` | A modal sheet: surface colour + outline + shadow (outer drop + top inner highlight), set as one class. They are set together on purpose — split across utilities, a change to one half-updates the panel. |
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
| `plinth` | `/` | motes only — dust in the light, no flow field | 0.62 | 1.0 | 1.25 | The homepage is an exhibit, so the atmosphere is carried by **material** and the motion by **the reader's scroll**. It also switches off the two self-playing animations (grid drift, bloom breathing) — see below. The one thing that does move on its own is a layer of dust in the light, which is air, not room. |
| `flow` | `/style-guide` | density 2.5, speed 1.0 | 0.8 | 1.0 | 1.0 | Kept as the reference route for the opposite approach: atmosphere carried by a live field. It exists so the two can be compared side by side. |
| `drift` | list and overview routes (`/problems`, `/contests`, `/submissions`, `/me`) | density 1.05, speed 0.72 | 0.5 | 0.72 | 0.7 | Present, so scanning a table never happens on a dead surface; slow enough that it is not noticed while scanning. |
| `focus` | `/contests/*/arena`, `/contests/*/scoreboard` | density 1.4, speed 1.3 | 0.85 | 1.05 | 1.0 | Projection surfaces, viewed from a distance, so more movement is legible rather than distracting. |
| `still` | reading and working routes (`/problems/[id]`, `/submissions/[id]`, `/contests/[id]/problems/[id]`, `/auth/*`, `/settings`, `/manage/*`, `/admin/*`) | **none** | 0.3 | 0.5 | 0.45 | No canvas at all. Reading a statement or writing code with a flow field behind it is a usability defect, not a style choice. |

Rules:

- **Route matching is by path *shape*, not prefix.** `/problems` is a list (`drift`); `/problems/12` is a reading page (`still`). Same prefix, opposite requirements. A prefix-only rule would silently give the reading page a moving background.
- **The presets differ only in parameters.** All five share one canvas implementation, one grid layer, one bloom pair, one vignette, one top light. Five presets with their own imagery would read as five different products sharing a stylesheet.
- **`field: null` means no canvas is mounted at all** — not a paused one, not a transparent one. An idle canvas still spends frame budget for a page that gains nothing from it.
- **The grid mask anchors to the content, not the corner.** It is a masked ground plane that fades toward the reading area; anchored to a corner it becomes wallpaper, which is the thing that looks generated.
- On small screens the grid is dropped entirely and the secondary bloom is hidden. Two light sources plus a grid on a 380px viewport is not atmosphere, it is clutter.

### Motion must come from the reader, not from the clock

Three separate revisions made the same mistake with different pixels: a particle field inside the hero, then the same field for the whole app, then a grid that drifted and two blooms that breathed on their own. Every one of them was *moving while nobody was doing anything*. That is the whole defect, and it is not fixed by making the movement smaller or prettier — **an ambient animation is a decoration, and it reads as one no matter how subtle it is.**

The rule that replaced it, with one deliberate exception added later:

- **Self-playing ambient motion is not atmosphere — for the room.** Atmosphere comes from material: a still cold-silver grid, a single directional light, a vignette, and a top light. Those are *rendered*, not *animated*. A drifting grid or a breathing bloom means the wall is moving and the lamp is breathing, and a room that moves is exactly the cheapness this rule exists to prevent.
- **The one exception is the air.** `plinth` mounts `MoteField` (`components/fx/mote-field.tsx`): sparse, tiny, extremely slow dust, whose brightness is modulated by its distance from the light source and whose position is tuned to sit inside the primary bloom. Dust drifting through a beam is not the room moving — it is the reason the beam reads as a beam at all, and it only appears where the lamp explains it. The line, in short: **the air may move; the wall and the lamp may not.** (The user's word for the homepage background before this layer existed was 单调. Material alone was correct but not sufficient; the exhibit needed air in the light to feel like a room rather than a render.)
- **All other motion comes from the reader's own actions** — scrolling, revealing, pressing. If the page is idle, the wall is still.
- `plinth` therefore stops two global animations, scoped to itself (`[data-atmo="plinth"]` in `globals.css`): the 72s grid drift and the 34s/52s bloom breathing. Other presets keep them, because on those routes the background is an *environment* rather than an *exhibit*.
- **One light, not two.** `plinth` drops the secondary bloom. An exhibit has one lamp on it; two light sources make the picture read as a gradient wallpaper.
- The scroll-linked motion that replaces it is deliberately **out of the reader's notice**: over one viewport of scrolling the wordmark recedes 30px and scales to 97.4%. It is written in longhand (`animation-duration: auto`) because the `animation` shorthand resets `duration` to `0s`, and a zero-duration scroll animation jumps straight to its final frame — a bug that looks like "the title is permanently shrunk".
- It is wrapped in `@supports (animation-timeline: scroll())`. Browsers without scroll timelines get a still frame, which **is** the default state of this preset, so this is not a degraded fallback.

## Data Visuals

**Every page header carries at most one data visual, or one stat group.** It gives the page a visual anchor in what is otherwise a column of text, and it answers a question the header's numbers cannot: "what is the shape of this?". A header with none is fine. A header with two is a dashboard.

The rule is one per header, not one per page — the header is the reader's entry point, and adding a second visual there turns it into a dashboard.

**A visual belongs where its decision is made, not where it looks best.** The difficulty composition used to sit in the problems-page header as a stacked bar plus a legend, while the actual difficulty filter sat below it as a plain dropdown and a separate "Apply" button. The chart answered "how are the problems distributed" and the control answered "show me the hard ones", and neither knew about the other. It is now a single object in the filter bar: the difficulty buttons themselves carry their counts. Moving it deleted a chart, a legend, an Apply button, and the reader's obligation to interpret two things that were always the same thing.

Three primitives, one per question type. All three live in `components/soj/`.

| Primitive | Answers | File |
| --- | --- | --- |
| `DifficultyScale` / `DifficultyLabel` | "how hard is this one?" — long form, everywhere difficulty is shown | `difficulty-composition.tsx` |
| `DifficultyBar` + `DifficultyLegend` | "what are the parts of this whole?" — aggregate only | `difficulty-composition.tsx` |
| `AcceptanceAxis` | "where does this value sit on a scale?" | `acceptance-axis.tsx` |
| `AcceptanceMeter` | "how do these rows compare?" | `acceptance-meter.tsx` |

Rules:

- **Difficulty is a sequence; encode it with length, not colour.** Two attempts failed before this one. Green/yellow/red read as a rainbow and stole the semantic palette, so "hard" was red in the list and blue in the filter bar. The fix after that — three steps of one hue (`muted/45` → `silver/75` → `accent`) — was internally consistent but still asked the reader to learn a lookup table, and three dark values on a near-black page are hard to tell apart at all. Both versions shared one mistake: they encoded an **order** as a **category**. Hue expresses category and lightness expresses strength; neither says "more than". Three bars at 1 / 2 / 3 height say it with nothing to memorise, and spend no colour at all. So difficulty carries **no colour anywhere**: list rows, detail header and filter chips all render `DifficultyScale` plus a neutral word.
- **The one exception is the composition bar**, which must fill continuously and so cannot use bars: it uses three steps of a *single* hue (`soj.silver/35` → `/65` → `/100`) — the weakest possible form of the ladder, with no hue to learn. Its legend uses `DifficultyScale`, not swatches, so the bar and the legend share one mark.
- **Emit one definition per concern.** Difficulty *labels* live once in `lib/domain/problem.ts`; the difficulty *visual* (scale levels, bar fill) lives once in `difficulty-composition.tsx`; the problem-*status* icon, tone and row tint live once in `problem-status.tsx`. When labels and tones shared one file, the domain map and the bar ladder each believed they were the definition, and drifted.
- **A track must be visible.** A meter whose track matches the background makes a 4.6% row read as "nothing was drawn" instead of "almost nobody passes" — those are different statements. Tracks use `soj.surface-2` against a panel background.
- **Bars go before the number, not under it.** A bar wider than its number pushes past it and the column reads as a set of unrelated underlines. Right-align the group in dense tables; the number sits in a fixed-width slot after the bar.
- **Do not encode the same datum twice in one row.** The acceptance meter is neutral silver, not semantic colour — the row tint already carries my progress, and two colour signals in one row is harder to read than one.
- Do not use a bar to restate a number the reader can already compare column-wise. Bars earn their space where values differ by more than an order of magnitude.

## Information Architecture

Polish does not rescue a page that shows the wrong things. This section is the contract for **what belongs on a page**, and it exists because a previous revision shipped pages that were well-built and still wrong: every table exposed every column it had, every page opened with its own dashboard, and every row offered every action it could perform.

The working question is not "is this useful?" — almost everything is *useful*. It is **"who is looking at this, and what did they come here to do?"** A number only an operator wants is noise when a visitor is the one reading the page, whether or not it is accurate.

### Top navigation carries places, the account menu carries mine

- The top nav holds **destinations any visitor could go to**: 首页 / 题库 / 比赛. Nothing else, plus capability-gated operator entries for the roles that hold those capabilities.
- **"My submissions" is not a destination.** It is the current user's own data, and unauthenticated it renders as an empty page. Putting it in the top nav offers a visitor a link that leads nowhere. It lives in the account menu beside 我的主页 and 设置.
- The test is one line: **if the link is useless before login, it is not top-nav material.**

### The footer is site-wide, and carries only real destinations

- `SiteFooter` (`components/layout/site-footer.tsx`) is mounted in the root layout, after `children`, for the same reason `AppAtmosphere` is mounted there: a footer each page has to remember is a footer some page will forget. Every route gets it, in the document flow, below the content — verified per-route with a hit-test probe, because the atmosphere layer is `fixed` and *paints over* ordinary flow content; "it is in the DOM" and "the reader can see it" are different claims.
- It carries three things: copyright, the source repository, and an issue tracker. The homepage originally shipped **without** a footer because the only candidates were fake ones — 文档 / 状态 / 关于 pages that did not exist. The corrected rule is not "no footer"; it is **no link without a destination**. A fake entry is worse than a missing footer; a real footer is not an entry, it is a colophon.

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

### One page shell, one page header

Every page is `TopNav` + `<main>` at the same width + `PageHeader`. There used to be three shells and they were all load-bearing:

- `PageShell` carried a `text-3xl md:text-5xl` title of its own, so a page using it and a page using `PageHeader` had two different h1 sizes.
- `AccountSurface` (me / settings / auth) carried a third: a hero panel, a pill-shaped eyebrow, and `text-4xl md:text-6xl`.
- Contests, submission detail, workspace and the style guide each hand-rolled the same `TopNav` + `main` wrapper again.

The cost was not visual inconsistency in the abstract — it was that **changing one typographic decision required four edits**, and any page that missed one fell out of the family silently. `AccountSurface` and `PageShell` are now thin wrappers over `PageHeader`; the hand-rolled wrappers were deleted.

Two follow-on rules, both enforced by `tests/e2e/design-language.spec.ts`:

- **A display-size title is not a way to make a page feel important.** The oversized `text-5xl/7xl` titles on contest detail and workspace were folded into `.soj-display` at the header scale. A title competes with the content beneath it for the same box, and above a data table it always wins.
- **A detail page's "back" is a typographic exit, not a pill.** Two pills side by side (back, badge) on a detail page gave a navigation affordance and a status the same visual weight.

### Column and surface pruning, as applied

| Surface | Before | After | Why |
| --- | --- | --- | --- |
| Problems table | 7 columns (id, title, tags, difficulty, acceptance, submissions, status) plus a row action | 4 (problem, difficulty, acceptance, status) | Tags became chips inside the title cell; per-problem submission counts answer a question the reader cannot act on; the row action duplicated the title link's destination. |
| Submissions table | 8 columns | 6 | Contest and score fold into the problem cell as a meta line, shown only when they exist. |
| Contest list | 3 buttons per row plus a standing "ACM vs OI rules" explainer panel | 1 primary action + 2 text links | The explainer repeated the same two rule sets on every visit; the three buttons gave equal visual weight to actions of very different weight. |
| Problems header | 4 progress numbers + a difficulty stacked bar + its legend | 3 progress numbers | The distribution moved to the filter bar, where it is used to make a decision. |
| Homepage | hero + 评测概览 (site totals, acceptance rate, difficulty mix, busiest-problem ranking) + 实时面板 + problem/verdict panels | 展台 (wordmark + one positioning line + four site-level numbers + one exit) → 构成铭牌 → 加入我们 | The first two are operator dashboards. A visitor's first question is "what is this, and is anything happening", not "how many times has this site been submitted to". |
| Homepage, second pass | 展台 + 核心能力 (3 explanatory rows) + 题库样张 (3 problems) + 评测流程 (4 stages) + 焦点比赛 + 三步开始 | 展台 + 构成铭牌 + 加入我们 | The middle four sections were all **either a copy of another page or a tutorial** — see below. |
| Homepage, third pass | 展台 (wordmark + four numbers) + 构成铭牌 (three cells of tag pills) + 加入我们 (two buttons) | 展台 (wordmark fills the column, 14px labels) + 构成铭牌 (no pills) + 加入我们 (one block → dialog) | The numbers were legible and their labels were not: 3.62:1 at 10px, i.e. 「只能看到数字」. And two side-by-side buttons split a first-time visitor into "register / login" before he had decided anything. |
| Homepage, fourth pass | 展台 (drawn wordmark filling the column + four numbers + a chrome exit button) + 构成铭牌 (difficulty mix / language list / topic list) + 加入我们 (left-aligned, dialog with tabs) | 展台 (typeset lockup + three numbers + a typographic exit) → 加入我们 (centred, uppercase, dialog with a footer switch) | Three separate judgements, all from the reader: the drawn wordmark was **ugly and 400px tall**; the plate listed *which* languages and *which* tags, which is the problem set's job; and the exit button was the **only beveled object on a flat page**. |
| Contest list | featured card with a coloured glow, an inner outlined box, and a divided panel inside it — three stacked visual layers around one row of content | one panel: status line, title, one stat group, one action column | Each layer was added to separate the card from the page. Three layers in the same place do not read as separation, they read as a rendering fault. The glow was also the second of the two page-level light sources the site allows, spent on a list row. |
| Submission detail | dead `soj-*` stage classes, two pills, a `text-4xl/6xl` title, a decoration strip with no definition, and three outlined metric boxes | one panel: typographic back exit, `Badge`, `StatGroup` | The metric boxes cut one row of numbers into three objects. Readings do not need boxes — `StatGroup` already gives them a shared baseline and dividers. |
| Problems header stats | three numbers labelled 热身 / 复习 / 未开始, coloured green / yellow / grey | three numbers labelled 已解决 / 已尝试 / 未开始 under one 「我的进度」 label, all in text colour | The problems are public; the *status* is mine. The old labels mixed action suggestions (warm up, review) with a progress state (not started) on one axis, so they read as categories of problem, and solved problems were called "warm-up". The colours spent semantic tones on numbers that carry no state. |
| Problems status column | text pills in three vocabularies (row: 待完成/已尝试/已解决, filter: same, header: 热身/复习/未开始), "attempted" in warning yellow | one vocabulary everywhere (已解决 / 已尝试 / 未开始), icon + text: check / dashed circle / minus, only "solved" keeps colour | One state, three sets of words, is three states. Yellow for "attempted" was a semantics lie — trying and failing is not a warning. The icon leads the scan; the word confirms it and keeps the strings testable. |
| Problems difficulty column | green/yellow/red beads, then a 3px-wide tallening bar whose tiers 1 and 2 were indistinguishable | `DifficultyScale` — three square segments, filled count = tier, no colour | Both earlier versions asked the reader to learn a mapping; the bar version asked and then failed anyway, because its two smallest tiers differed by under 4px of visible area. See "Encode an order with length". |
| Problems status, second pass | a coloured pill inside the status cell; eight rows carried eight small coloured boxes | the whole row is tinted (`problemRowTone`), the cell keeps only icon + word | "Which of these have I done?" is a question about the *row*, not about a 40px chip inside it. Scanning a column of chips means reading eight separate signals; a tinted row is one glance. The marker also loses its capsule, so the row now has a single coloured thing in it rather than two. |

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
| `.soj-eyebrow` | Section names, units, axis annotations. Mono, 12px, uppercase, `0.15em`. |
| `.soj-num` | Digits that must align column by column. |

### The size floor

**No visible text is smaller than 12px.** Not a guideline — a contract, recomputed from computed styles on twelve routes by `tests/e2e/design-language.spec.ts`.

The floor took three passes to land, and the intermediate versions are the instructive part. It started at 10px, which produced the original complaint ("I can only see the numbers"). The first fix took it to 11px and left a carve-out: *eyebrows are section markers, a step below body copy is a typographic convention.* That carve-out was the bug. Eyebrows are the most numerous label on the site, and they sit exactly where a reader scans — section names, units, axis ticks, table column headers. Sizing them a step below reading size means sizing the thing people read a step below readable. The carve-out is gone, and so is the exception clause in the test.

`.soj-eyebrow` still differs from body copy by **shape** — uppercase, `0.15em` tracking, mono — not by size. That is enough to make it read as a marker.

Rules:

- **Page titles live in `PageHeader`, outside the content container.** Do not sink a display-size title into a dense panel — it competes with the table for the same box.
- `PageHeader`'s eyebrow carries a short accent tick before it. It is not decoration: every page header has one, and it gives the reader a consistent left baseline that says "a new page starts here".
- Numbers use `soj-num` / mono with `font-variant-numeric: tabular-nums`, applied globally on `body`. A numeric column must never shift width between rows.
- Micro-labels are mono, 11px, uppercase, `letter-spacing: 0.15em`. 10px with `0.22em` was tried and dropped: uppercase latin at that size and tracking stops reading as one word, and it was shipped alongside the old 3.62:1 grey.
- **Never fade display type to transparent.** The previous wordmark ended its top-light gradient at 46% alpha, which erased the lower half of every glyph. A vertical light on a large glyph has to *stay a colour* — the falloff is a shift in value, not a shift in opacity.
- Never use em dashes in visible product copy.

### The wordmark is typeset, and the hero is centred

`components/soj/soj-wordmark.tsx` used to exist: an SVG of three hand-authored glyphs (cap height 100, stroke 11.5, round caps). It was deleted, and the reason matters more than the component did.

It failed twice over:

- **It was ugly.** Hand-authored glyph curves have no font metrics behind them, so their tension is guesswork. Compared with a real typeface at the same size, the S read as a pair of bowls with no spine and the J's hook as a stub. Design-review verdict: 太丑了.
- **It ate the first screen.** `width: 100%` over a `272×100` viewBox means height follows column width — 400px of wordmark at 1440. The reader had to scroll past three letters to find out what the site was. A brand mark must never be bigger than the sentence that explains it.

The fix is not a different font. It is to treat the station's name as **typesetting rather than as artwork**:

- **A lockup, not a logotype.** `SOJ` set in Space Grotesk, followed by a category word (在线测评平台 / Online judge), baseline-aligned. Name + category is the standard company lockup, and it answers "what is this" without a scroll.
- **Size and colour carry the hierarchy; no divider.** A rule or a dot between the two turns "name + category" into "two fields". The gap and the type scale already say they belong together.
- **The lockup is a wrap-tolerant flex row.** On narrow viewports the category drops to its own line, centred, with no breakpoint and no hand-set type size.
- **Display-size type still gets a vertical light — but never to transparent** (see the rule above). The gradient ends at a 72% mix with the background, not at 0 alpha. A flat `color` declaration is the opaque fallback for browsers without `background-clip: text`.

Two composition rules came out of the same pass:

- **The exit is a link, not a button.** On a page with no boxes, a beveled pill is the only object with depth, and it reads as belonging to a different era. The exit is text + a rule that lights up on hover + an arrow that shifts. (`buttonVariants` is exported for links, but "it is a link" is not by itself a reason to dress it as a button.)
- **With only two blocks left, the hero is centred.** Left alignment over a two-block page leaves half the screen empty, and empty is read as unfinished, not as whitespace. Centring also means the scroll-linked recede uses the default `transform-origin` — a left-aligned hero has to pin it to `left center` or the mark drifts out of the column as it scales.

## Motion

Motion explains state and depth. It never decorates. Every animation degrades to a static frame under `prefers-reduced-motion`.

Five devices, all in `components/fx/` and `app/globals.css`:

| Device | What it explains |
| --- | --- |
| `AppAtmosphere` | One environment for the whole app. Mounted in the root layout; selects the per-route preset. |
| `ParticleField` | Depth and "this system is running". Curl-noise flow field on canvas. |
| `MoteField` | The light is on. Dust drifting through the beam; homepage only, brightness gated by distance from the light. |
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
- **Do not use asymmetric or multi-value radius.** `border-radius: 18px 6px 14px 6px` is a costume, not a system; it makes the radius scale meaningless and reads as noise at scale. Every corner on a surface uses one scale step. Directional rounding is still fine — "round the top two corners only" yields two distinct values; the cut-corner idiom yields three or more, and that is what `tests/e2e/design-language.spec.ts` flags.
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

- `Button` (`buttonVariants`: `solid` / `secondary` / `outline` / `ghost` / `danger` / `link` / `bare`; sizes `xs`–`lg`; no coloured glow shadows; **default is `solid`**) — the beveled `primary` variant was removed, see Material
- `Badge` (+ `badgeVariants`; tones `neutral` / `accent` / `success` / `warning` / `danger` / `info`; `emphasis="solid"` is for at most one element per screen)
- `Panel`, `PanelHeader`, `PanelBody`, `PanelFooter`
- `PageHeader`
- `EmptyState`
- `Stat`, `StatGroup`, `StatDivider`
- `Table`, `TableHead` (`sticky`), `TableRow`, `TableCell`, `TableHeaderCell`
- `Input`, `Textarea`, `Select`, `IconButton`, `Tabs`, `Dialog`, `Popover`, `Tooltip`, `Toast`, `Skeleton`

SOJ product components live in `components/soj/**`:

- `StatusPill` (thin wrapper over `Badge` — status colour is defined once, in `Badge`)
- `TypeExit` — the typographic exit. It began inside the homepage's CSS module and moved here the moment a second page needed it; "what an exit looks like" is a site-level contract, not one page's private style.
- `VerdictBadge`, `ProblemStatus`
- `ContestClock`
- `MetricFeed`
- `DifficultyScale`, `DifficultyLabel`, `DifficultyBar`, `DifficultyLegend`, `tallyDifficulty`
- `AcceptanceAxis`, `AcceptanceMeter`
- `SubmissionTimeline`, `TestPointMatrix`, `ScoreboardGrid`, `RankMovement`
- `CodeWorkspace`
- `ProblemStatement` (the full reading panel; the title is owned by `PageHeader`)
- *(deleted)* `SojWordmark` — the hand-authored SVG brand wordmark. Removed after review: hand-drawn curves read as amateur next to a real typeface, and at `width: 100%` the mark alone was 400px tall. The homepage typesets a lockup instead — see "The wordmark is typeset, and the hero is centred". **Do not reintroduce a drawn brand mark.**
- *(deleted)* `AuthGate` — the bare `user ? children : fallback` switch. Removed when the walls themselves were unified; `PermissionGate` supersedes it. The unguarded conditional is what let two different login walls exist side by side.

Access components live in `components/auth/**`:

- `AuthWall` — the **only** shape a login or permission wall takes: a centred panel, one sentence of state, one line of scope, one exit. It carries `my-auto`, so inside the `min-h-dvh` shell it absorbs the leftover height instead of stacking 400px of blank above the footer. A second, hand-rolled wall (left-aligned strip plus a bare text link, no body copy) used to live in the authoring page; one product gets one wall. Do not hand-roll another.
- `PermissionGate` (`usePermissions`, `roleMessageKey`, `rejudgeStatusMessageKey`) — the route-level block. All three states (checking / anonymous / denied) render `AuthWall`.

Motion components live in `components/fx/**`:

- `AppAtmosphere` (mounted in the root layout — the app-wide environment layer)
- `ParticleField`, `MotionBlock`, `useReveal`, `CountUp`

Domain enums map to **label keys** in exactly one place: `lib/domain/problem.ts`. Their **visual form** lives one level up, with the component that renders it: the difficulty scale and the composition-bar fill in `difficulty-composition.tsx`, the problem-status icon, tone and row tint in `problem-status.tsx`. Never re-declare a difficulty or status colour map inside a feature component — and never let a domain module carry classes.

Numeric formatting lives in exactly one place: `lib/ui/number.ts` (`formatNumber`, `formatDuration`, `formatMemory`). Server components and client components must call the same implementation, and the locale must be passed explicitly — otherwise the same figure renders as `13543` in one place and `13,543` in another, which is more damaging than either form on its own and is very hard to catch in review.

## Worker Rules

Do:

- Use `soj.*` colour classes, the radius scale, and the material primitives.
- Use shared `components/ui`, `components/soj`, and `components/fx` components.
- Put every user-visible string through `lib/i18n`. Hardcoded English in a Chinese interface is a bug, not a detail.
- Keep header stats to one group, and keep data visuals where their decision is made.
- Register a new route in the `AppAtmosphere` preset table when its attention requirement differs from `drift`, and justify the choice in the table's comment.
- Reach for `Button`'s `variant="bare"` + `size="bare"` when an element has to be clickable but must **not look like a button** — a full-bleed block, for example. It is the difference between "a button with no fill" (`ghost`, still sized and padded like a button, for a toolbar row) and "not a button" (bare, layout owned by the caller).
- Give every dialog a visible way out. `DialogContent` renders one, and it is not optional: Radix guarantees only Esc and the overlay, and a touch device has no Esc.
- Give a modal its own surface step. A sheet on `soj.surface` with inputs on `soj.bg-raised` reads as *fields pressed into a panel*; a sheet and its inputs on the same colour read as *a table stuck on a wall*.
- Keep every visible string at 12px or above. Sizing a label below reading size to make a layout fit is the trade this document exists to forbid.
- Problems are public; progress is personal. Label per-problem stats and filters as **mine** (「我的进度」/「我的状态」), keep the status vocabulary to one set (已解决 / 已尝试 / 未开始), and let `ProblemStatus` render it — check / dashed circle / minus. **Colour belongs to the whole row, not to the marker**: `problemRowTone` tints a solved row faintly **accent blue** (`accent/12` — same temperature as the base, so a row of it reads as deepening, not as a foreign colour), an attempted row one step lighter than the panel, and leaves an untouched row un-painted. A tinted row is the signal ("I have done something here"), so painting the default state too would erase it. Never present a status as if it were a property of the problem, and never re-introduce a coloured status pill — eight pills in a column is what the row tint replaces.
- **Encode an order with length, a category with hue.** Difficulty is the reference case: it was first green/yellow/red, then three lightness steps, and both read badly because each asked the reader to learn a mapping. It is now the `DifficultyScale` signal bar — three square segments, filled count = tier, no colour. The first scale was three tallening bars 3px wide: tier 1 vs tier 2 differed by less than four pixels of visible area and was unreadable on the dark base. Segments must be **square and large enough that one segment is a chunk, not a line**. Reach for this whenever a scale is *ordered*; hue is for genuine categories, and on this site there are almost none by design.
- Reach for `TypeExit` (`components/soj/type-exit`) for a secondary destination that sits **next to typesetting** — the "back to list" on a detail page, "go to login" under a state message, the single exit on the homepage. `direction="back"` flips the arrow. It is a line of mono text plus an arrow that moves: no fill, no outline, no radius, no depth. Not for a toolbar row that needs alignment (use `ghost`) and not for a link inside a sentence (use an accent text link).
- Update this document when adding a shared token or shared component.
- Run `npm run lint:style`, `npm run lint`, and `npx tsc --noEmit` before every commit.

Do not:

- Add raw hex or rgb colours in `app`, `components`, or `features`.
- Add page-local button, input, badge, or panel styling.
- **Hand-draw brand glyphs.** A drawn mark has no font metrics behind it, so its curves are guesswork, and it always ends up oversized. Typeset a lockup (name + category word) instead.
- **List *which* languages, tags, or difficulties exist on the homepage.** That is the problem set's job. The homepage carries the scale (how many), never the inventory (which ones).
- **Put a beveled `primary` button on the homepage.** On a page with no boxes it becomes the only object with depth, i.e. the only object from a different era.
- Put a brand mark, a hero graphic, or a background field above the fold that makes the reader scroll before learning what the product is.
- **Mount a `ParticleField` on a page.** The environment is global; a page-local field is how the background becomes a decoration again.
- **Add a page-level dashboard above the content the page is for** — metric blocks, summary cards, stage strips. If the data matters, it belongs in the table row or the header's single stat group.
- **Add an element to the top nav that is useless before login.** That belongs in the account menu.
- **Surface a number nobody acts on** because it happens to be available. Availability is not a reason to render.
- Fill a button with `soj.accent`, or put a coloured glow shadow on any element.
- Use purple, decorative gradients, or scanline/skew pseudo-elements.
- Build generic equal 3-card sections, or any grid of same-shaped cards where a table or a row list would carry the same data.
- Add decorative status dots unless they communicate real state.
- Use em dash characters in visible product copy.
