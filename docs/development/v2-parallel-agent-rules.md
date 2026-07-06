# SOJ-web v2 Parallel Agent Rules

Use these rules when assigning page work after the foundation gates are complete.

## Required Gates

Page workers must not start until these chunks are complete:

- Foundation app and CI.
- Signal Arena tokens, fonts, primitives, product components, style guide, and style lint.
- Domain models and mock fixtures.
- App shell and auth boundary.

## Ownership

Workers own only their assigned route and feature folder.

- Homepage: `app/page.tsx`, `features/home/**`
- Problems: `app/problems/**`, `features/problems/**`
- Submissions: `app/submissions/**`, `features/submissions/**`
- Contest detail: `app/contests/page.tsx`, `app/contests/[id]/page.tsx`, `features/contests/detail/**`
- Contest workspace: `app/contests/[id]/problems/**`, `features/contests/workspace/**`
- Scoreboard: `app/contests/[id]/scoreboard/**`, `features/contests/scoreboard/**`
- Arena: `app/contests/[id]/arena/**`, `features/arena/**`

Shared component edits require coordination, tests, and an update to `docs/design-system/signal-arena.md`.

## Style Rules

Workers must:

- Use `components/ui/**` and `components/soj/**`.
- Use `soj.*` tokens only.
- Check `/style-guide` before implementing a page.
- Run `npm run lint:style` before committing.

Workers must not:

- Create page-local buttons, inputs, tabs, tables, badges, dialogs, or score cells.
- Add raw hex, raw rgb, purple utilities, arbitrary gradients, or large radii.
- Import Ant Design, Element Plus, Vue, Pinia, or legacy v1 code.
- Create generic equal card grids as a page default.
- Use em dash characters in visible product copy.

## Verification

Every page worker runs:

```bash
npm run typecheck
npm run lint
npm run lint:style
npm run test
```

Run the relevant Playwright spec when the route has one. Browser-check desktop and mobile before marking the task done.
