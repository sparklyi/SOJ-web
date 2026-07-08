# SOJ-web

[![CI](https://github.com/sparklyi/SOJ-web/actions/workflows/ci.yml/badge.svg)](https://github.com/sparklyi/SOJ-web/actions/workflows/ci.yml)

English | [简体中文](README.zh-CN.md)

SOJ-web is the v2 frontend for SOJ, an online judge product for practice, contests, submissions, scoreboards, and live contest broadcast views. The current application is a Next.js rewrite with the Signal Arena design system, a mockable API boundary, and page-level experiences for both regular users and contest participants.

> The legacy Vue application is preserved on the `archive/vue-v1` branch. Active development happens in the Next.js v2 app at the repository root.

## Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [API Mode](#api-mode)
- [Quality Checks](#quality-checks)
- [Development Workflow](#development-workflow)
- [Project Status](#project-status)
- [Documentation](#documentation)

## Features

- Next.js v2 product shell with a single top navigation model.
- Signal Arena visual system for a dark, technical contest cockpit.
- Problem set, problem detail, and code workspace surfaces.
- Contest lobby, contest detail, contest workspace, scoreboard, and Arena broadcast views.
- Submission queue and submission detail lifecycle views.
- Mock API mode for fast frontend iteration before full backend integration.
- HTTP adapter boundary for connecting to the SOJ backend contract.
- Unit tests, browser E2E tests, linting, style checks, and production build checks in CI.

## Tech Stack

- Next.js 16 with the App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Radix UI primitives
- Motion
- Vitest
- Playwright
- GitHub Actions

## Getting Started

### Prerequisites

- Node.js 22 or newer
- npm

### Install

```bash
git clone git@github.com:sparklyi/SOJ-web.git
cd SOJ-web
npm ci
```

### Configure

```bash
cp .env.example .env.local
```

The default configuration uses mock data:

```bash
NEXT_PUBLIC_SOJ_API_MODE=mock
# NEXT_PUBLIC_SOJ_API_BASE_URL=http://localhost:8080
SOJ_API_INTERNAL_BASE_URL=http://localhost:8080
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SOJ_API_MODE` | `mock` | Selects the frontend API adapter. Use `mock` for local review or `http` for backend integration. |
| `NEXT_PUBLIC_SOJ_API_BASE_URL` | browser: `/soj-api`, server/test: `http://localhost:8080` | Public API base when `NEXT_PUBLIC_SOJ_API_MODE=http`. Leave unset to use the same-origin Next.js proxy. |
| `SOJ_API_INTERNAL_BASE_URL` | `http://localhost:8080` | Backend URL used by server-side requests and the `/soj-api/*` rewrite target. |

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Next.js development server. |
| `npm run build` | Create a production build. |
| `npm run start` | Start the production server after `npm run build`. |
| `npm run typecheck` | Run TypeScript without emitting files. |
| `npm run lint` | Run ESLint with zero warnings allowed. |
| `npm run lint:style` | Enforce SOJ visual system style rules. |
| `npm run test` | Run unit tests with Vitest. |
| `npm run test:e2e` | Run Playwright browser tests. |
| `npm run ci:fast` | Run typecheck, lint, style lint, unit tests, and build. |
| `npm run ci` | Run the full local CI suite, including E2E tests. |

## Project Structure

```text
app/                  Next.js routes, layout, and global styles
components/layout/    Shared application shell and navigation
components/soj/       SOJ product components
components/ui/        Low-level UI primitives
features/             Page and domain feature modules
lib/api/              API client, adapters, types, and errors
lib/domain/           Domain mapping and view-model helpers
lib/mock/             Mock fixtures and builders
tests/unit/           Vitest unit tests
tests/e2e/            Playwright browser tests
docs/                 Design, planning, and API inventory notes
```

## API Mode

SOJ-web uses an adapter-based API boundary:

- `mock` mode serves deterministic frontend fixtures from `lib/mock`.
- `http` mode calls the backend through `lib/api/http-adapter.ts`.
- Browser calls use the `/soj-api/*` same-origin proxy by default to avoid local CORS issues.

Language selection in the code workspace is driven by the judge language catalog. In HTTP mode, enabled SOJ agent languages are read from the backend language endpoint. In mock mode, the same contract is represented by mock fixtures.

## Quality Checks

Run the full local suite before opening a pull request:

```bash
npm run ci
```

The GitHub Actions workflow runs:

1. `npm ci`
2. Playwright browser installation
3. TypeScript checks
4. ESLint
5. SOJ style lint
6. Unit tests
7. Production build
8. E2E tests

## Development Workflow

1. Create a branch from `main`.
2. Keep commits focused and use clear Conventional Commit-style messages.
3. Use `sparkyi@foxmail.com` as the commit email for project work.
4. Run the relevant local checks before pushing.
5. Open a pull request to `main`.
6. Wait for GitHub Actions to pass.
7. Merge after the branch is clean and checks pass.

## Project Status

SOJ-web v2 is under active development. The current frontend can run independently in mock mode, while HTTP mode is intended for backend integration work. Some v2 surfaces model future backend contract fields with mock data until the SOJ API is extended.

## Documentation

- Signal Arena design system: [`docs/design-system/signal-arena.md`](docs/design-system/signal-arena.md)
- OpenAPI inventory: [`docs/development/openapi-inventory.md`](docs/development/openapi-inventory.md)
- Legacy Vue archive branch: [`archive/vue-v1`](https://github.com/sparklyi/SOJ-web/tree/archive/vue-v1)
