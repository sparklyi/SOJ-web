# SOJ-web

[![CI](https://github.com/sparklyi/SOJ-web/actions/workflows/ci.yml/badge.svg)](https://github.com/sparklyi/SOJ-web/actions/workflows/ci.yml)

English | [简体中文](README.zh-CN.md)

The v2 frontend for **Sundial**, an online judge for practice, contests, submissions, scoreboards, and live contest broadcast: a Next.js app with a mockable API boundary.

> Renamed from SOJ on 2026-09-23. The product calls itself `Sundial` in both locales; the repository name, the `soj-*` design tokens, and the `SOJ_*` environment variables deliberately keep the old name — none of them are visible to a reader.
>
> The legacy Vue app is preserved on the `archive/vue-v1` branch.

## Quick start

Node.js 22 or newer, plus npm.

```bash
git clone git@github.com:sparklyi/SOJ-web.git
cd SOJ-web
npm ci
cp .env.example .env.local   # defaults to mock data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SOJ_API_MODE` | local `mock`, production `http` | Selects the API adapter. |
| `NEXT_PUBLIC_SOJ_API_BASE_URL` | `/soj-api` in the browser | Public API base in `http` mode. Leave unset to use the same-origin proxy. |
| `SOJ_API_INTERNAL_BASE_URL` | `http://localhost:8080` | Backend URL for server-side requests and the `/soj-api/*` rewrite. |

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server. |
| `npm run build` / `npm run start` | Production build, then serve it. |
| `npm run typecheck` | TypeScript, no emit. |
| `npm run lint` | ESLint, zero warnings allowed. |
| `npm run lint:style` | Visual system style rules. |
| `npm run test` / `npm run test:e2e` | Vitest unit tests / Playwright browser tests. |
| `npm run ci:fast` | typecheck → lint → style lint → unit tests → build. |
| `npm run ci` | The full suite, E2E included. |

## API mode

- `mock` (the local default) serves deterministic fixtures from `lib/mock`.
- `http` calls the backend through `lib/api/http-adapter.ts`.
- Production builds default to `http`; mock has to be selected explicitly.
- Browser calls go through the same-origin `/soj-api/*` proxy, so local CORS needs no setup.

## Project structure

```text
app/                  Routes, layout, global styles
components/layout/    App shell and navigation
components/soj/       Product components
components/ui/        Low-level primitives
features/             Page and domain modules
lib/api/              API client, adapters, types, errors
lib/domain/           Domain mapping and view models
lib/mock/             Mock fixtures and builders
tests/unit/           Vitest unit tests
tests/e2e/            Playwright browser tests
docs/                 Design system and development notes
```

## Contributing

```bash
npm run ci
```

runs the same steps as `.github/workflows/ci.yml`: install, Playwright browsers, typecheck, ESLint, style lint, unit tests, production build, E2E. Branch from `main`, keep commits focused and Conventional-Commit style, and use `sparkyi@foxmail.com` as the commit email.

## Deployment

Tag-driven, and the server never builds:

```bash
git tag web-v1.2.0 && git push origin web-v1.2.0
```

Actions builds the standalone output and attaches it to a release; the server polls for new `web-v*` tags, swaps versions behind an atomic symlink, health-checks, and rolls back on failure. See [`scripts/deploy/README.md`](scripts/deploy/README.md).

## Documentation

- Visual language: [`docs/design-system/soj-visual-language.md`](docs/design-system/soj-visual-language.md)
- OpenAPI inventory: [`docs/development/openapi-inventory.md`](docs/development/openapi-inventory.md)
- API integration smoke: [`docs/development/api-integration-smoke.md`](docs/development/api-integration-smoke.md)
