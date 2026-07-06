# Signal Arena Design System

Signal Arena is the visual contract for SOJ-web v2. Page workers must consume these tokens and shared components instead of creating page-local styles.

## Design Read

SOJ-web v2 is a full product-app rewrite for students, contest participants, and operators. The visual language is a premium dark technical contest cockpit built with Tailwind v4, Motion, Radix primitives, and owned SOJ components.

Dial values:

- Design variance: 7
- Motion intensity: 6
- Visual density: 6

## Theme Tokens

All colors are semantic CSS variables in `app/globals.css` and Tailwind tokens in `tailwind.config.ts`.

| Token | Use |
| --- | --- |
| `soj.bg` | App background |
| `soj.bg-raised` | Raised navigation and shell surfaces |
| `soj.surface` | Dense panels and interactive groups |
| `soj.surface-2` | Active rows, selected tabs, elevated data regions |
| `soj.line` | Hairlines, row dividers, table borders |
| `soj.text` | Primary copy |
| `soj.muted` | Secondary labels and helper copy |
| `soj.accent` | Primary action, live state, accepted state, rank movement |
| `soj.success` | Accepted and successful outcomes |
| `soj.warning` | Pending, frozen, risky, or partial outcomes |
| `soj.danger` | Rejected, failed, destructive, or blocked outcomes |
| `soj.info` | Neutral informational state |

Rules:

- One accent: acid lime.
- Do not introduce page-local hex, rgb, purple utilities, or decorative gradients.
- Keep surfaces dark and metallic. Do not use pure black.
- Use semantic warning and danger sparingly so they do not compete with the accent.

## Typography

Fonts are loaded with `next/font`:

- Sans: Geist, used for product UI, reading, headings, forms, and navigation.
- Mono: Geist Mono, used for numbers, verdicts, timers, scoreboard values, and code-adjacent labels.
- Fallbacks: standard sans and mono stacks only after the primary font variables.
- Licensing/source: Google Fonts through `next/font`, self-hosted by Next at build time.

Usage:

- Headings should be direct and product-oriented.
- Numbers and contest state values use mono.
- Avoid decorative serif type in v2.
- Avoid oversized headings inside dense panels.

## Shape And Density

Radius scale:

- Small: `rounded-soj-sm`, 4px.
- Medium: `rounded-soj-md`, 6px.
- Large: `rounded-soj-lg`, 8px.

Rules:

- Do not use `rounded-2xl` or `rounded-3xl`.
- Avoid nested cards.
- Prefer rows, rails, split panes, hairlines, and data bands over card grids.
- Stable dimensions are required for counters, toolbars, tables, score cells, and verdict tiles.

## Motion

Motion exists to communicate state:

- Judge lifecycle.
- Verdict transition.
- Scoreboard rank movement.
- Freeze countdown.
- Workspace panel changes.
- Live contest signals.

Every motion path must degrade under reduced motion. Do not animate layout properties.

## Worker Rules

Do:

- Use `soj.*` color classes.
- Use shared `components/ui` and `components/soj` components.
- Update this document when adding a new shared token or shared component.
- Run `npm run lint:style` before every page commit.

Do not:

- Add Ant Design, Element Plus, Vue, Pinia, or page-local UI primitives.
- Add raw hex or rgb colors in app, components, or features.
- Use purple gradients.
- Build generic equal 3-card sections.
- Add decorative status dots unless they communicate real state.
- Use em dash characters in visible product copy.
