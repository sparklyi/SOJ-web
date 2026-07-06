# SOJ-web v2 Signal Arena Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild SOJ-web as a Next.js v2 application with a fixed Signal Arena design foundation, mockable contract-first data layer, and core pages for auth, problems, submissions, contests, scoreboards, and Arena.

**Architecture:** Archive the current Vue/Vite app under `archive/v1-vue/`, then build a new Next.js app at the repository root. Implementation is split into serial foundation chunks and parallel page chunks. Page workers must not invent styles; they consume the shared design tokens, layout primitives, components, mock adapters, and domain models produced by the foundation chunks.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS v4, Motion, Radix primitives where useful, Vitest, Testing Library, Playwright, npm, OpenAPI-derived types or a typed API boundary.

---

## Source Documents

- Spec: `docs/superpowers/specs/2026-07-07-soj-web-v2-signal-arena-design.md`
- Current app to archive: `src/**`, `vite.config.js`, current Vue `package.json`, current `package-lock.json`
- Backend contract reference: `../SOJ/api/openapi.yaml`

## Parallelization Rules

The work is intentionally split for subagent parallel development, with explicit gates before page work starts.

1. **Chunk 1: Foundation Gate** must finish first. It creates the Next.js app, CI, test harness, app shell skeleton, API boundary, mock mode wiring, and a lightweight OpenAPI inventory.
2. **Chunk 2: Style Foundation Gate** must finish before any page worker starts. It fixes tokens, fonts, global CSS, typography, layout primitives, core UI components, style linting, and a style guide page.
3. **Chunk 3: Domain Models And Mock Data** may run after Chunk 1, in parallel with Chunk 2, because it owns only nonvisual domain/data files. It must not edit `app/**`, `components/**`, or style files.
4. **No page worker may start before Chunks 2, 3, and 4 pass.** This prevents agents from creating separate palettes, spacing systems, cards, typography, route data contracts, or app-shell patterns.
5. After Chunks 2, 3, and 4, page chunks can run in parallel if each worker owns only its assigned routes and feature folders.
6. Any worker needing a new shared component must add it to `components/ui/` or `components/soj/` with tests and update `docs/design-system/signal-arena.md`. Do not create page-local variants of shared controls.

## Style Lock Contract

All workers must obey these constraints:

- Use CSS variables from `app/globals.css` and Tailwind tokens from `tailwind.config.ts`.
- Do not introduce hardcoded page palettes except temporary semantic states already mapped by tokens.
- Use off-black and metal-gray surfaces, not pure black.
- Use one primary accent token for sharp lime or acid green.
- Do not use generic equal card grids as the dominant page structure.
- Do not use Ant Design, Element Plus, or legacy Vue styling in v2.
- Do not hand-roll one-off buttons, inputs, tabs, dialogs, tables, badges, toasts, or score cells inside page files.
- Use `components/soj/` for product components and `components/ui/` for low-level primitives.
- Motion must represent state changes: judge lifecycle, rank movement, timers, panel transitions, or active signals.
- All motion must respect reduced-motion preferences.
- Every page must pass the `app/style-guide` visual baseline before it is considered reviewable.
- Every page worker must run `npm run lint:style` before committing. This style lint is created in Chunk 2 and blocks raw page palettes, forbidden legacy UI imports, arbitrary decorative effects, and page-local primitive duplicates.

## Worker Ownership Boundaries

| Worker | Allowed paths | Forbidden paths |
| --- | --- | --- |
| Foundation | `archive/v1-vue/**`, root config, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `lib/api/**`, `lib/mock/**`, `tests/**`, CI files | Final page implementations beyond a minimal placeholder |
| Style Foundation | `app/globals.css`, `tailwind.config.ts`, `components/ui/**`, `components/soj/**`, `app/style-guide/**`, `docs/design-system/**`, `scripts/style-lint.mjs`, style tests | Page route implementation under `app/(routes)` except style guide |
| Domain | `lib/domain/**`, `lib/mock/**`, `features/*/api.ts`, domain and API tests | `app/**`, `components/**`, style docs except API notes |
| App Shell/Auth | `components/layout/**`, `components/providers/**`, `lib/auth/**`, `app/auth/**`, `app/me/**`, `app/settings/**` | Problem, submission, contest, and Arena routes |
| Homepage | `app/page.tsx`, `features/home/**`, `tests/e2e/home.spec.ts` | Shared tokens/components without coordination |
| Problems | `app/problems/**`, `features/problems/**`, problem e2e tests | Contest and submission routes |
| Submissions | `app/submissions/**`, `features/submissions/**`, submission e2e tests | Problem and contest routes |
| Contest Detail | `app/contests/page.tsx`, `app/contests/[id]/page.tsx`, `features/contests/detail/**`, contest list/detail e2e tests | Contest workspace, scoreboard, Arena |
| Contest Workspace | `app/contests/[id]/problems/**`, `features/contests/workspace/**`, workspace e2e tests | Contest detail, scoreboard, Arena |
| Scoreboard | `app/contests/[id]/scoreboard/**`, `features/contests/scoreboard/**`, scoreboard tests | Contest detail, workspace, Arena |
| Arena | `app/contests/[id]/arena/**`, `features/arena/**`, Arena tests | Scoreboard internals except shared domain consumption |
| Real API | `lib/api/**`, `features/*/api.ts`, API adapter tests | Page layout and styling |

## Planned File Structure

Archive:

- Move current `src/**` to `archive/v1-vue/src/**`
- Move current `vite.config.js` to `archive/v1-vue/vite.config.js`
- Move current `package.json` to `archive/v1-vue/package.json`
- Move current `package-lock.json` to `archive/v1-vue/package-lock.json`
- Create `archive/v1-vue/README.md`

Root app:

- Create `app/layout.tsx`: root layout, fonts, providers
- Create `app/page.tsx`: homepage
- Create `app/globals.css`: design tokens and Tailwind import
- Create `app/not-found.tsx`
- Create `app/error.tsx`
- Create `app/loading.tsx`
- Create `app/style-guide/page.tsx`: locked visual contract reference
- Create `app/auth/login/page.tsx`
- Create `app/auth/register/page.tsx`
- Create `app/problems/page.tsx`
- Create `app/problems/[id]/page.tsx`
- Create `app/submissions/page.tsx`
- Create `app/submissions/[id]/page.tsx`
- Create `app/contests/page.tsx`
- Create `app/contests/[id]/page.tsx`
- Create `app/contests/[id]/problems/[problemId]/page.tsx`
- Create `app/contests/[id]/scoreboard/page.tsx`
- Create `app/contests/[id]/arena/page.tsx`
- Create `app/me/page.tsx`
- Create `app/settings/page.tsx`

Shared foundation:

- Create `components/providers/app-providers.tsx`
- Create `components/layout/page-shell.tsx`
- Create `components/layout/top-nav.tsx`
- Create `components/layout/app-sidebar.tsx`
- Create `components/layout/split-workspace.tsx`
- Create `components/ui/button.tsx`
- Create `components/ui/icon-button.tsx`
- Create `components/ui/input.tsx`
- Create `components/ui/textarea.tsx`
- Create `components/ui/select.tsx`
- Create `components/ui/tabs.tsx`
- Create `components/ui/dialog.tsx`
- Create `components/ui/popover.tsx`
- Create `components/ui/tooltip.tsx`
- Create `components/ui/toast.tsx`
- Create `components/ui/table.tsx`
- Create `components/ui/skeleton.tsx`
- Create `components/soj/status-pill.tsx`
- Create `components/soj/verdict-badge.tsx`
- Create `components/soj/problem-status.tsx`
- Create `components/soj/contest-clock.tsx`
- Create `components/soj/signal-feed.tsx`
- Create `components/soj/submission-timeline.tsx`
- Create `components/soj/test-point-matrix.tsx`
- Create `components/soj/scoreboard-grid.tsx`
- Create `components/soj/rank-movement.tsx`
- Create `components/soj/code-workspace.tsx`
- Create `components/soj/problem-statement.tsx`
- Create `components/soj/auth-gate.tsx`

Domain and data:

- Create `lib/api/client.ts`
- Create `lib/api/errors.ts`
- Create `lib/api/generated.ts` or `lib/api/types.ts`
- Create `lib/api/mode.ts`
- Create `lib/api/mock-adapter.ts`
- Create `lib/api/http-adapter.ts`
- Create `lib/auth/session.ts`
- Create `lib/domain/problem.ts`
- Create `lib/domain/submission.ts`
- Create `lib/domain/contest.ts`
- Create `lib/domain/scoreboard.ts`
- Create `lib/domain/arena.ts`
- Create `lib/mock/fixtures.ts`
- Create `lib/mock/builders.ts`
- Create `features/auth/api.ts`
- Create `features/problems/api.ts`
- Create `features/submissions/api.ts`
- Create `features/contests/api.ts`

Tests and tooling:

- Create `vitest.config.ts`
- Create `playwright.config.ts`
- Create `tests/unit/scoreboard.test.ts`
- Create `tests/unit/submission-lifecycle.test.ts`
- Create `tests/unit/mock-adapter.test.ts`
- Create `tests/unit/auth-session.test.ts`
- Create `tests/e2e/home.spec.ts`
- Create `tests/e2e/problems.spec.ts`
- Create `tests/e2e/submissions.spec.ts`
- Create `tests/e2e/scoreboard.spec.ts`
- Create `.github/workflows/ci.yml`
- Create `scripts/style-lint.mjs`
- Modify `.gitignore`
- Modify `package.json`
- Modify `tsconfig.json`
- Modify `next.config.ts`
- Modify `tailwind.config.ts`
- Modify `postcss.config.mjs`

Design docs:

- Create `docs/design-system/signal-arena.md`
- Create `docs/development/v2-parallel-agent-rules.md`
- Create `docs/development/openapi-inventory.md`

---

## Chunk 1: 基础工程底座

This chunk is serial. It must complete before style or page workers begin.

### Task 1: Archive v1 And Create Next.js Root

**Files:**
- Move: `src/**` to `archive/v1-vue/src/**`
- Move: `vite.config.js` to `archive/v1-vue/vite.config.js`
- Move: `package.json` to `archive/v1-vue/package.json`
- Move: `package-lock.json` to `archive/v1-vue/package-lock.json`
- Create: `archive/v1-vue/README.md`
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Modify: `.gitignore`

- [ ] **Step 1: Fetch remote and verify branch**

Run:

```bash
git fetch --all --prune
git branch --show-current
git status --short
```

Expected:

- Current branch is a non-default implementation branch, not `main` or `master`.
- Only known local `.superpowers/` may be untracked before implementation starts.
- Stop if unrelated dirty files exist.

- [ ] **Step 2: Verify clean staging scope**

Run: `git status --short`
Expected: only known local `.superpowers/` may be untracked before implementation starts.

- [ ] **Step 3: Archive the Vue app**

Run:

```bash
mkdir -p archive/v1-vue
git mv src archive/v1-vue/src
git mv vite.config.js archive/v1-vue/vite.config.js
git mv package.json archive/v1-vue/package.json
git mv package-lock.json archive/v1-vue/package-lock.json
```

Expected: Vue source and old package files move under `archive/v1-vue/`.

- [ ] **Step 4: Add archive README**

Create `archive/v1-vue/README.md`:

```markdown
# SOJ-web v1 Vue Archive

This directory contains the archived Vue/Vite frontend that existed before the v2 Signal Arena rewrite.

The active frontend application now lives at the repository root as a Next.js app.
Do not add new v2 code here.
```

- [ ] **Step 5: Create the new package manifest**

Create root `package.json` with scripts for dev, build, lint, type check, unit tests, e2e tests, and CI.

Required dependencies:

- `next`
- `react`
- `react-dom`
- `@radix-ui/react-dialog`
- `@radix-ui/react-popover`
- `@radix-ui/react-select`
- `@radix-ui/react-tabs`
- `@radix-ui/react-toast`
- `@radix-ui/react-tooltip`
- `motion`
- `clsx`
- `tailwind-merge`
- `zod`

Required dev dependencies:

- `typescript`
- `@types/node`
- `@types/react`
- `@types/react-dom`
- `tailwindcss`
- `@tailwindcss/postcss`
- `eslint`
- `eslint-config-next`
- `vitest`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `jsdom`
- `@playwright/test`

- [ ] **Step 6: Install dependencies**

Run: `npm install`
Expected: new root `package-lock.json` is generated for the Next.js app.

- [ ] **Step 7: Create minimal Next.js files**

`app/layout.tsx` should import `./globals.css`, render `children`, and include correct metadata for SOJ.

`app/page.tsx` should render a minimal placeholder using only token classes, not final page design.

`app/globals.css` should contain Tailwind import and temporary root tokens. Full tokens are owned by Chunk 2.

- [ ] **Step 8: Update gitignore**

`.gitignore` must include:

```gitignore
.next/
playwright-report/
test-results/
.superpowers/
```

- [ ] **Step 9: Verify scaffold**

Run:

```bash
npm run typecheck
npm run lint
npm run build
```

Expected: all pass.

- [ ] **Step 10: Commit**

```bash
git add archive/v1-vue package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs tailwind.config.ts app .gitignore
git commit -m "chore: archive v1 and scaffold v2 app"
```

### Task 2: Add CI And Test Harness

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `playwright.config.ts`
- Create: `tests/e2e/smoke.spec.ts`
- Create: `scripts/style-lint.mjs`
- Create: `.github/workflows/ci.yml`
- Modify: `package.json`

- [ ] **Step 1: Add Vitest setup**

Create `vitest.config.ts` using `jsdom` and `tests/setup.ts`.

Create `tests/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 2: Add Playwright smoke test**

Create `tests/e2e/smoke.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("main")).toBeVisible();
});
```

- [ ] **Step 3: Add baseline style lint script**

Create `scripts/style-lint.mjs` as a baseline script. Chunk 2 will expand the forbidden-pattern checks after tokens and components exist.

```js
import { existsSync } from "node:fs";

if (!existsSync("app")) {
  console.error("Expected Next.js app directory to exist.");
  process.exit(1);
}
```

- [ ] **Step 4: Add scripts**

Ensure `package.json` includes:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --max-warnings=0",
    "lint:style": "node scripts/style-lint.mjs",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "ci:fast": "npm run typecheck && npm run lint && npm run lint:style && npm run test && npm run build",
    "ci:e2e": "npm run test:e2e",
    "ci": "npm run ci:fast && npm run ci:e2e"
  }
}
```

- [ ] **Step 5: Add CI workflow**

Create `.github/workflows/ci.yml`. The current remote is GitHub, so use GitHub Actions. The CI must run install, type check, lint, style lint, unit tests, build, and smoke Playwright E2E.

- [ ] **Step 6: Verify**

Run:

```bash
npm run ci
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts tests/setup.ts playwright.config.ts tests/e2e/smoke.spec.ts scripts/style-lint.mjs package.json .github/workflows/ci.yml
git commit -m "ci: add v2 quality gates"
```

### Task 3: Create API Boundary And Mock Mode Switch

**Files:**
- Create: `lib/api/mode.ts`
- Create: `lib/api/client.ts`
- Create: `lib/api/errors.ts`
- Create: `lib/api/http-adapter.ts`
- Create: `lib/api/mock-adapter.ts`
- Create: `lib/api/types.ts`
- Create: `lib/mock/fixtures.ts`
- Create: `lib/mock/builders.ts`
- Create: `docs/development/openapi-inventory.md`
- Create: `tests/unit/mock-adapter.test.ts`
- Modify: `.env.example`

- [ ] **Step 1: Inventory OpenAPI contract**

Create `docs/development/openapi-inventory.md` before writing feature pages. Inventory the backend contract from `../SOJ/api/openapi.yaml` and list:

- Auth endpoints used by v2.
- Problem endpoints used by v2.
- Submission and run endpoints used by v2.
- Contest endpoints used by v2.
- Scoreboard fields available for ACM.
- Scoreboard fields available or missing for OI/IOI.
- Arena event fields available or missing.
- Known gaps that mock mode must model explicitly.

Run: `test -f ../SOJ/api/openapi.yaml && rg -n "^  /api|scoreboard|submission|contest|problem|auth|schema" ../SOJ/api/openapi.yaml`

Expected: OpenAPI file exists and inventory is documented. Stop and ask if required endpoints are absent.

- [ ] **Step 2: Write failing mock mode tests**

Create `tests/unit/mock-adapter.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getApiMode } from "@/lib/api/mode";
import { createApiClient } from "@/lib/api/client";

describe("api mode", () => {
  it("defaults to mock mode for local review", () => {
    expect(getApiMode({})).toBe("mock");
  });

  it("returns fixture problems in mock mode", async () => {
    const client = createApiClient({ mode: "mock" });
    const problems = await client.problems.list();
    expect(problems.items.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Run test and verify failure**

Run: `npm run test -- tests/unit/mock-adapter.test.ts`
Expected: FAIL because API modules do not exist.

- [ ] **Step 4: Implement minimal typed API boundary**

Define `ApiMode = "mock" | "http"`.

Define the first version of types in `lib/api/types.ts`:

- `ProblemSummary`
- `ProblemDetail`
- `ContestSummary`
- `SubmissionSummary`
- `ApiClient`

Implement `createApiClient({ mode })` that returns mock or HTTP adapter.

HTTP adapter can throw a typed "not implemented" error until real API integration chunk.

- [ ] **Step 5: Add realistic fixtures**

`lib/mock/fixtures.ts` must include:

- At least 8 problems.
- At least 2 contests: one ACM, one OI/IOI.
- At least 8 submissions across multiple states.
- At least one current user.

- [ ] **Step 6: Verify**

Run:

```bash
npm run test -- tests/unit/mock-adapter.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/api lib/mock docs/development/openapi-inventory.md tests/unit/mock-adapter.test.ts .env.example
git commit -m "feat: add api boundary and mock mode"
```

---

## Chunk 2: 基础风格底座

This chunk is serial and blocks all page workers. It locks the visual system before parallel page development begins.

### Task 4: Lock Signal Arena Tokens And Global Style

**Files:**
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`
- Modify: `scripts/style-lint.mjs`
- Modify: `package.json`
- Create: `docs/design-system/signal-arena.md`

- [ ] **Step 1: Define token inventory**

`docs/design-system/signal-arena.md` must define:

- Background tokens.
- Surface tokens.
- Border tokens.
- Text tokens.
- Accent token.
- Semantic success, warning, danger, and info tokens.
- Radius scale.
- Motion durations.
- Data density rules.
- Font choices, source/licensing, and usage rules for sans, mono, numeric, and code surfaces.
- Do and do-not examples for page workers.

- [ ] **Step 2: Choose and document fonts**

Pick one sans and one mono font. Prefer `next/font` or self-hosted fonts with clear licensing. Document:

- Display/product UI font.
- Mono/numeric/code font.
- Where each font is used.
- Fallback stack.
- Licensing/source.

The final v2 identity must not rely on default system fonts only.

- [ ] **Step 3: Implement CSS variables**

In `app/globals.css`, define semantic CSS variables such as:

```css
:root {
  --soj-bg: 16 18 17;
  --soj-bg-raised: 23 26 24;
  --soj-surface: 28 32 30;
  --soj-surface-2: 36 41 38;
  --soj-line: 68 76 70;
  --soj-text: 236 241 235;
  --soj-text-muted: 154 164 154;
  --soj-accent: 179 255 67;
  --soj-success: 117 217 122;
  --soj-warning: 226 181 83;
  --soj-danger: 231 102 92;
}
```

Adjust values during visual review, but keep one accent system.

- [ ] **Step 4: Map Tailwind theme**

Expose semantic colors in `tailwind.config.ts` as `soj.bg`, `soj.surface`, `soj.line`, `soj.text`, `soj.muted`, `soj.accent`, and semantic states.

- [ ] **Step 5: Add global base rules**

Global styles must set:

- App background.
- Text color.
- Selection color.
- Focus-visible ring.
- Reduced-motion behavior.
- Scrollbar style.

- [ ] **Step 6: Expand style lint**

Update `scripts/style-lint.mjs` so `npm run lint:style` fails on:

- Raw hex colors in `app/**`, `components/**`, or `features/**` outside token files.
- Raw `rgb(` or `rgba(` color usage outside token files.
- `bg-purple`, `from-purple`, `to-purple`, or similar AI-purple utilities.
- Arbitrary decorative gradients, shadows, and large radii such as `rounded-2xl` or `rounded-3xl`.
- Imports from `antd`, `ant-design-vue`, `element-plus`, or legacy Vue packages.
- Page-local primitive names such as `LocalButton`, `CustomInput`, `PageTabs`, or duplicated `button` styling in route files.

Allowlist only documented exceptions in `docs/design-system/signal-arena.md`.

- [ ] **Step 7: Verify**

Run:

```bash
npm run typecheck
npm run lint:style
npm run build
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add app/globals.css tailwind.config.ts scripts/style-lint.mjs package.json docs/design-system/signal-arena.md
git commit -m "style: lock signal arena tokens"
```

### Task 5: Build Core UI Primitives

**Files:**
- Create: `lib/ui/cn.ts`
- Create: `components/ui/button.tsx`
- Create: `components/ui/icon-button.tsx`
- Create: `components/ui/input.tsx`
- Create: `components/ui/textarea.tsx`
- Create: `components/ui/select.tsx`
- Create: `components/ui/tabs.tsx`
- Create: `components/ui/dialog.tsx`
- Create: `components/ui/popover.tsx`
- Create: `components/ui/tooltip.tsx`
- Create: `components/ui/toast.tsx`
- Create: `components/ui/table.tsx`
- Create: `components/ui/skeleton.tsx`
- Create: `tests/unit/ui-primitives.test.tsx`

- [ ] **Step 1: Write failing primitive tests**

Create `tests/unit/ui-primitives.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

describe("ui primitives", () => {
  it("renders a branded button with accessible name", () => {
    render(<Button>Submit</Button>);
    expect(screen.getByRole("button", { name: "Submit" })).toBeVisible();
  });

  it("renders input with label association", () => {
    render(<Input id="handle" label="Handle" />);
    expect(screen.getByLabelText("Handle")).toBeVisible();
  });
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm run test -- tests/unit/ui-primitives.test.tsx`
Expected: FAIL because primitives do not exist.

- [ ] **Step 3: Implement primitives**

Each primitive must:

- Use tokenized classes.
- Support `className` extension without overriding style identity.
- Support focus-visible.
- Support disabled state.
- Avoid page-specific colors.

- [ ] **Step 4: Verify**

Run:

```bash
npm run test -- tests/unit/ui-primitives.test.tsx
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ui components/ui tests/unit/ui-primitives.test.tsx
git commit -m "feat: add signal arena ui primitives"
```

### Task 6: Build SOJ Product Components

**Files:**
- Create: `components/soj/status-pill.tsx`
- Create: `components/soj/verdict-badge.tsx`
- Create: `components/soj/problem-status.tsx`
- Create: `components/soj/contest-clock.tsx`
- Create: `components/soj/signal-feed.tsx`
- Create: `components/soj/submission-timeline.tsx`
- Create: `components/soj/test-point-matrix.tsx`
- Create: `components/soj/scoreboard-grid.tsx`
- Create: `components/soj/rank-movement.tsx`
- Create: `components/soj/code-workspace.tsx`
- Create: `components/soj/problem-statement.tsx`
- Create: `components/soj/auth-gate.tsx`
- Create: `tests/unit/soj-components.test.tsx`

- [ ] **Step 1: Write failing product component tests**

Create tests for at least:

- `VerdictBadge` renders accepted, wrong answer, compile error, and judging.
- `SubmissionTimeline` renders ordered lifecycle events.
- `ScoreboardGrid` renders ACM and OI/IOI rows without throwing.

- [ ] **Step 2: Implement components using only UI primitives and tokens**

Do not add page-specific styling. If a component needs a new token, update Chunk 2 docs and token files.

- [ ] **Step 3: Add reduced-motion handling**

Components with motion must use Motion and degrade when reduced motion is enabled.

- [ ] **Step 4: Verify**

Run:

```bash
npm run test -- tests/unit/soj-components.test.tsx
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/soj tests/unit/soj-components.test.tsx docs/design-system/signal-arena.md
git commit -m "feat: add soj product components"
```

### Task 7: Build Style Guide And Agent Rules

**Files:**
- Create: `app/style-guide/page.tsx`
- Create: `docs/development/v2-parallel-agent-rules.md`
- Modify: `docs/design-system/signal-arena.md`

- [ ] **Step 1: Create style guide page**

The page must show:

- Token swatches.
- Font scale, sans usage, mono usage, numeric examples, and code examples.
- Button variants.
- Inputs and form states.
- Tabs, dialog, popover, tooltip.
- Status pills and verdict badges.
- Submission timeline.
- Test point matrix.
- Scoreboard grid in ACM and OI/IOI modes.
- Empty, loading, error, permission denied states.

- [ ] **Step 2: Write agent rules document**

`docs/development/v2-parallel-agent-rules.md` must state:

- Page agents cannot create new palettes.
- Page agents cannot duplicate primitives.
- Page agents own only their route and feature folder.
- Shared component changes require updating the style guide.
- Every page worker must run type check, relevant unit tests, and a browser check.

- [ ] **Step 3: Browser verify style guide**

Run:

```bash
npm run dev
```

Open `/style-guide` in desktop and mobile viewport. Verify no overlaps, unreadable text, or obvious style drift.

- [ ] **Step 4: Commit**

```bash
git add app/style-guide docs/design-system/signal-arena.md docs/development/v2-parallel-agent-rules.md
git commit -m "docs: add v2 style guide and agent rules"
```

---

## Chunk 3: Domain Models And Mock Data

This chunk can run after Chunk 1, but should be integrated before page chunks depend on full fixtures. It should not change visual primitives.

### Task 8: Implement Contest, Scoreboard, Submission Domain Logic

**Files:**
- Create: `lib/domain/problem.ts`
- Create: `lib/domain/submission.ts`
- Create: `lib/domain/contest.ts`
- Create: `lib/domain/scoreboard.ts`
- Create: `lib/domain/arena.ts`
- Create: `tests/unit/scoreboard.test.ts`
- Create: `tests/unit/submission-lifecycle.test.ts`

- [ ] **Step 1: Write failing scoreboard tests**

`tests/unit/scoreboard.test.ts` must cover:

```ts
import { describe, expect, it } from "vitest";
import { buildScoreboardModel } from "@/lib/domain/scoreboard";

describe("scoreboard model", () => {
  it("ranks ACM rows by solved count then penalty", () => {
    const model = buildScoreboardModel({
      type: "acm",
      rows: [
        { id: "a", handle: "alpha", solved: 2, penalty: 180, problems: [] },
        { id: "b", handle: "beta", solved: 2, penalty: 120, problems: [] }
      ]
    });
    expect(model.rows.map((row) => row.handle)).toEqual(["beta", "alpha"]);
  });

  it("ranks OI/IOI rows by score then latest improvement", () => {
    const model = buildScoreboardModel({
      type: "oi",
      rows: [
        { id: "a", handle: "alpha", score: 240, lastImprovedAt: "2026-07-07T10:03:00Z", problems: [] },
        { id: "b", handle: "beta", score: 260, lastImprovedAt: "2026-07-07T10:01:00Z", problems: [] }
      ]
    });
    expect(model.rows[0]?.handle).toBe("beta");
  });
});
```

- [ ] **Step 2: Write failing submission lifecycle tests**

Cover queued, compiling, running, accepted, wrong answer, compile error, runtime error, and system error display states.

- [ ] **Step 3: Implement domain logic**

Keep domain files pure and free of React.

- [ ] **Step 4: Verify**

Run:

```bash
npm run test -- tests/unit/scoreboard.test.ts tests/unit/submission-lifecycle.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/domain tests/unit/scoreboard.test.ts tests/unit/submission-lifecycle.test.ts
git commit -m "feat: add contest domain models"
```

### Task 9: Expand Mock Fixtures And Feature API Modules

**Files:**
- Modify: `lib/mock/fixtures.ts`
- Modify: `lib/mock/builders.ts`
- Create: `features/auth/api.ts`
- Create: `features/problems/api.ts`
- Create: `features/submissions/api.ts`
- Create: `features/contests/api.ts`
- Create: `tests/unit/feature-api.test.ts`

- [ ] **Step 1: Write feature API tests**

Test each feature API returns realistic mock data and propagates not-found errors.

- [ ] **Step 2: Implement feature API modules**

Each page imports from `features/*/api.ts`, not directly from `lib/mock`.

- [ ] **Step 3: Verify**

Run:

```bash
npm run test -- tests/unit/feature-api.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add features lib/mock tests/unit/feature-api.test.ts
git commit -m "feat: add feature api modules"
```

---

## Chunk 4: Shared App Shell And Auth

This chunk can start after Chunk 2. It owns navigation and session UI. Page workers should not edit layout files while this chunk is active.

### Task 10: App Shell, Navigation, Providers

**Files:**
- Create: `components/providers/app-providers.tsx`
- Create: `components/layout/page-shell.tsx`
- Create: `components/layout/top-nav.tsx`
- Create: `components/layout/app-sidebar.tsx`
- Create: `components/layout/split-workspace.tsx`
- Modify: `app/layout.tsx`
- Create: `tests/unit/app-shell.test.tsx`

- [ ] **Step 1: Write shell tests**

Verify nav landmarks, main landmark, and route links exist.

- [ ] **Step 2: Implement shell**

Navigation links:

- Home.
- Problems.
- Contests.
- Submissions.
- Me.
- Settings.

Use compact, high-end product UI. No marketing nav bloat.

- [ ] **Step 3: Verify**

Run:

```bash
npm run test -- tests/unit/app-shell.test.tsx
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/providers components/layout app/layout.tsx tests/unit/app-shell.test.tsx
git commit -m "feat: add v2 app shell"
```

### Task 11: Auth Pages And Session Boundary

**Files:**
- Create: `lib/auth/session.ts`
- Create: `app/auth/login/page.tsx`
- Create: `app/auth/register/page.tsx`
- Create: `app/me/page.tsx`
- Create: `app/settings/page.tsx`
- Create: `tests/unit/auth-session.test.ts`
- Create: `tests/e2e/auth.spec.ts`

- [ ] **Step 1: Write auth tests**

Test session restoration, anonymous state, authenticated state, and logout behavior at the boundary.

- [ ] **Step 2: Implement session boundary**

Keep token handling behind `lib/auth/session.ts`. Do not read or write session state directly in pages.

- [ ] **Step 3: Implement login and register pages**

Use shared form primitives. Show inline errors. Include mock mode success path.

- [ ] **Step 4: Implement `/me` and `/settings` lightweight pages**

Use mock current user and shared status components.

- [ ] **Step 5: Verify**

Run:

```bash
npm run test -- tests/unit/auth-session.test.ts
npm run test:e2e -- tests/e2e/auth.spec.ts
npm run lint:style
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/auth app/auth app/me app/settings tests/unit/auth-session.test.ts tests/e2e/auth.spec.ts
git commit -m "feat: add auth and account surfaces"
```

---

## Chunk 5: Parallel Page Pack A - Homepage

Can run after Chunks 2, 3, and 4. Ownership is limited to homepage route and homepage-specific components.

### Task 12: Signal Arena Homepage

**Files:**
- Modify: `app/page.tsx`
- Create: `features/home/home-hero.tsx`
- Create: `features/home/live-signal-panel.tsx`
- Create: `features/home/active-contests.tsx`
- Create: `features/home/recommended-problems.tsx`
- Create: `features/home/recent-judge-feed.tsx`
- Create: `tests/e2e/home.spec.ts`

- [ ] **Step 1: Write homepage e2e test**

Verify homepage renders:

- SOJ first-viewport signal.
- Problems link.
- Contests link.
- Live signal panel.
- At least one active contest.

- [ ] **Step 2: Implement homepage components**

Use shared components only. Do not create new button, badge, card, or timeline styling.

- [ ] **Step 3: Browser verify**

Check desktop and mobile. Ensure first viewport feels high-end, not a generic dashboard or empty marketing hero.

- [ ] **Step 4: Verify**

Run:

```bash
npm run test:e2e -- tests/e2e/home.spec.ts
npm run lint:style
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx features/home tests/e2e/home.spec.ts
git commit -m "feat: build signal arena homepage"
```

---

## Chunk 6: Parallel Page Pack B - Problems And Problem Detail

Can run after Chunks 2, 3, and 4. This worker owns problem routes and problem feature components.

### Task 13: Problem List

**Files:**
- Create: `app/problems/page.tsx`
- Create: `features/problems/problem-filter-bar.tsx`
- Create: `features/problems/problem-list.tsx`
- Create: `features/problems/problem-row.tsx`
- Create: `tests/e2e/problems.spec.ts`

- [ ] **Step 1: Write problem list e2e test**

Test search/filter controls and at least one problem row.

- [ ] **Step 2: Implement dense training hall layout**

Use data rows and shared status components. Avoid repeated large cards.

- [ ] **Step 3: Verify**

Run:

```bash
npm run test:e2e -- tests/e2e/problems.spec.ts
npm run lint:style
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/problems features/problems tests/e2e/problems.spec.ts
git commit -m "feat: add problem list"
```

### Task 14: Reading-First Problem Detail

**Files:**
- Create: `app/problems/[id]/page.tsx`
- Create: `features/problems/problem-detail-view.tsx`
- Create: `features/problems/problem-submit-panel.tsx`
- Create: `tests/e2e/problem-detail.spec.ts`

- [ ] **Step 1: Write problem detail e2e test**

Verify statement, examples, constraints, and submit action render in mock mode.

- [ ] **Step 2: Implement detail view**

Use `ProblemStatement`, `CodeWorkspace`, and shared submit panel. Public problem detail is reading-first.

- [ ] **Step 3: Browser verify**

Check long statement behavior on desktop and mobile.

- [ ] **Step 4: Verify and commit**

```bash
npm run test:e2e -- tests/e2e/problem-detail.spec.ts
npm run lint:style
npm run typecheck
git add app/problems/[id] features/problems tests/e2e/problem-detail.spec.ts
git commit -m "feat: add problem detail"
```

---

## Chunk 7: Parallel Page Pack C - Submissions

Can run after Chunks 2, 3, and 4. This worker owns submission routes and feature components.

### Task 15: Submission List And Detail

**Files:**
- Create: `app/submissions/page.tsx`
- Create: `app/submissions/[id]/page.tsx`
- Create: `features/submissions/submission-list.tsx`
- Create: `features/submissions/submission-detail.tsx`
- Create: `features/submissions/submission-impact.tsx`
- Create: `tests/e2e/submissions.spec.ts`

- [ ] **Step 1: Write submission e2e tests**

Verify list renders multiple verdict states and detail renders lifecycle timeline.

- [ ] **Step 2: Implement list and detail**

Use `SubmissionTimeline`, `TestPointMatrix`, `VerdictBadge`, and `SignalFeed`. Do not implement local variants.

- [ ] **Step 3: Verify state coverage**

Check queued, compiling, running, AC, WA, CE, RE, and system error fixtures.

- [ ] **Step 4: Verify and commit**

```bash
npm run test:e2e -- tests/e2e/submissions.spec.ts
npm run lint:style
npm run typecheck
git add app/submissions features/submissions tests/e2e/submissions.spec.ts
git commit -m "feat: add submission surfaces"
```

---

## Chunk 8: Parallel Page Pack D - Contests And Scoreboards

Can run after Chunks 2, 3, and 4. This worker owns contest routes except Arena-specific big-screen presentation if split with Chunk 9.

### Task 16: Contest List And Detail

**Files:**
- Create: `app/contests/page.tsx`
- Create: `app/contests/[id]/page.tsx`
- Create: `features/contests/detail/contest-list.tsx`
- Create: `features/contests/detail/contest-detail.tsx`
- Create: `features/contests/detail/contest-registration.tsx`
- Create: `features/contests/detail/contest-problem-table.tsx`
- Create: `tests/e2e/contests.spec.ts`

- [ ] **Step 1: Write contest e2e test**

Verify contest list, contest detail, registration state, and problem list render.

- [ ] **Step 2: Implement contest surfaces**

Support not started, running, frozen, ended, and unsealed states.

- [ ] **Step 3: Verify and commit**

```bash
npm run test:e2e -- tests/e2e/contests.spec.ts
npm run lint:style
npm run typecheck
git add app/contests/page.tsx app/contests/[id]/page.tsx features/contests/detail tests/e2e/contests.spec.ts
git commit -m "feat: add contest detail surfaces"
```

### Task 17: Contest Problem Workspace

**Files:**
- Create: `app/contests/[id]/problems/[problemId]/page.tsx`
- Create: `features/contests/workspace/contest-problem-workspace.tsx`
- Create: `features/contests/workspace/contest-submit-rail.tsx`
- Create: `tests/e2e/contest-workspace.spec.ts`

- [ ] **Step 1: Write workspace e2e test**

Verify statement, editor workspace placeholder, contest clock, permission hint, and submit panel render.

- [ ] **Step 2: Implement split workspace**

Use `SplitWorkspace`, `ProblemStatement`, `CodeWorkspace`, and submission components.

- [ ] **Step 3: Browser verify**

Check desktop split panes and mobile stacked mode.

- [ ] **Step 4: Verify and commit**

```bash
npm run test:e2e -- tests/e2e/contest-workspace.spec.ts
npm run lint:style
npm run typecheck
git add app/contests/[id]/problems features/contests/workspace tests/e2e/contest-workspace.spec.ts
git commit -m "feat: add contest problem workspace"
```

### Task 18: ACM And OI/IOI Scoreboards

**Files:**
- Create: `app/contests/[id]/scoreboard/page.tsx`
- Create: `features/contests/scoreboard/scoreboard-page.tsx`
- Create: `features/contests/scoreboard/acm-scoreboard.tsx`
- Create: `features/contests/scoreboard/oi-scoreboard.tsx`
- Create: `tests/e2e/scoreboard.spec.ts`

- [ ] **Step 1: Write scoreboard e2e tests**

Verify ACM scoreboard shows solved and penalty. Verify OI/IOI scoreboard shows score and per-problem score.

- [ ] **Step 2: Implement scoreboards**

Both scoreboards must use `ScoreboardGrid` and shared domain model. Do not fork unrelated table systems.

- [ ] **Step 3: Large data smoke check**

Use mock builder to render at least 100 rows locally and verify no obvious performance collapse.

- [ ] **Step 4: Verify and commit**

```bash
npm run test:e2e -- tests/e2e/scoreboard.spec.ts
npm run test -- tests/unit/scoreboard.test.ts
npm run lint:style
npm run typecheck
git add app/contests/[id]/scoreboard features/contests/scoreboard tests/e2e/scoreboard.spec.ts
git commit -m "feat: add contest scoreboards"
```

---

## Chunk 9: Parallel Page Pack E - Arena

Can run after Chunks 2, 3, and 4. It may run in parallel with Chunk 8 if it only consumes contest and scoreboard APIs.

### Task 19: Live Arena View

**Files:**
- Create: `app/contests/[id]/arena/page.tsx`
- Create: `features/arena/arena-stage.tsx`
- Create: `features/arena/arena-rank-strip.tsx`
- Create: `features/arena/arena-event-feed.tsx`
- Create: `features/arena/arena-freeze-clock.tsx`
- Create: `tests/e2e/arena.spec.ts`

- [ ] **Step 1: Write Arena e2e test**

Verify Arena renders contest title, timer, rank movement, and event feed.

- [ ] **Step 2: Implement Arena components**

Arena can use larger scale and stronger motion, but must use the same tokens and components. Do not create a separate visual theme.

- [ ] **Step 3: Reduced-motion verification**

Set reduced motion in browser context and verify Arena still communicates state without animation dependency.

- [ ] **Step 4: Browser verify**

Check desktop 1440px, wide 1920px, and mobile fallback.

- [ ] **Step 5: Verify and commit**

```bash
npm run test:e2e -- tests/e2e/arena.spec.ts
npm run lint:style
npm run typecheck
git add app/contests/[id]/arena features/arena tests/e2e/arena.spec.ts
git commit -m "feat: add contest arena view"
```

---

## Chunk 10: Real API Integration And Contract Alignment

This chunk should start after mock-mode pages are green. It owns API adapters and generated types, not page styling.

### Task 20: Align With OpenAPI Contract

**Files:**
- Modify: `lib/api/types.ts` or create `lib/api/generated.ts`
- Modify: `lib/api/http-adapter.ts`
- Modify: `features/auth/api.ts`
- Modify: `features/problems/api.ts`
- Modify: `features/submissions/api.ts`
- Modify: `features/contests/api.ts`
- Create: `tests/unit/http-adapter.test.ts`

- [ ] **Step 1: Reconcile backend OpenAPI inventory**

Run:

```bash
test -f ../SOJ/api/openapi.yaml
rg -n "^  /api|scoreboard|submission|contest|problem|auth|schema" ../SOJ/api/openapi.yaml
sed -n '1,260p' docs/development/openapi-inventory.md
```

Expected: OpenAPI file exists and the existing inventory is current. Update `docs/development/openapi-inventory.md` if backend endpoints or schemas changed.

- [ ] **Step 2: Decide generated vs handwritten boundary**

If using generation, add the generator command to `package.json`. If not, document why in `docs/development/v2-parallel-agent-rules.md`.

- [ ] **Step 3: Write adapter tests**

Mock `fetch` and verify:

- Auth login maps request and response.
- Problems list maps response.
- Contest scoreboard maps ACM and OI/IOI data.
- API errors become typed frontend errors.

- [ ] **Step 4: Implement HTTP adapter**

Pages remain unchanged. Only feature API and adapter modules should change.

- [ ] **Step 5: Verify**

Run:

```bash
npm run test -- tests/unit/http-adapter.test.ts
npm run ci
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/api features tests/unit/http-adapter.test.ts package.json package-lock.json docs/development/v2-parallel-agent-rules.md
git commit -m "feat: connect v2 api boundary"
```

---

## Chunk 11: Final Integration, Visual Review, And PR Readiness

This chunk runs after all page packs are merged.

### Task 21: Full Verification Pass

**Files:**
- Modify only files needed for integration fixes.
- Update: `docs/design-system/signal-arena.md` if any shared style rules changed.
- Update: `docs/development/v2-parallel-agent-rules.md` if any agent rules changed.

- [ ] **Step 1: Pull latest branch state**

Run: `git fetch --all --prune`

- [ ] **Step 2: Run complete local checks**

Run:

```bash
npm run typecheck
npm run lint
npm run lint:style
npm run test
npm run build
npm run test:e2e
```

Expected: PASS.

- [ ] **Step 3: Browser visual check**

Check these routes in desktop and mobile:

- `/style-guide`
- `/`
- `/auth/login`
- `/problems`
- `/problems/1`
- `/submissions`
- `/submissions/1`
- `/contests`
- `/contests/1`
- `/contests/1/problems/1`
- `/contests/1/scoreboard`
- `/contests/1/arena`
- `/me`
- `/settings`

Fix only clear issues:

- Text overflow.
- Incoherent overlap.
- Broken responsive layout.
- Token drift.
- Page-local duplicate controls.
- Unreadable contrast.

- [ ] **Step 4: Style drift audit**

Run:

```bash
rg -n "#[0-9a-fA-F]{3,8}|rgb\\(|rgba\\(|bg-purple|from-|to-|shadow-\\[|rounded-2xl|rounded-3xl" app components features
```

Review every match. Keep only justified token usage and documented exceptions.

- [ ] **Step 5: Commit final fixes**

```bash
git add app components features lib tests docs package.json package-lock.json
git commit -m "fix: polish v2 integration"
```

### Task 22: Push And PR

**Files:**
- No source files unless CI requires fixes.

- [ ] **Step 1: Push branch**

Run: `git push -u origin <branch-name>`

- [ ] **Step 2: Create pull request**

Pull request description must include:

- Summary.
- Design direction.
- Routes implemented.
- Test results.
- Screenshots or short visual notes.
- Known follow-ups.

Do not include local absolute paths.

- [ ] **Step 3: Monitor pipeline**

After every push, monitor GitHub Actions until type check, lint, style lint, unit, build, and E2E checks pass.

- [ ] **Step 4: Fix failures and repeat**

If pipeline fails, diagnose, fix, push again, and keep monitoring.

- [ ] **Step 5: Merge after green**

Merge only after PR checks are green and review is acceptable.

---

## Recommended Agent Assignment

Use these as separate worker ownership boundaries according to the dependency gates above:

- Worker 1: Chunk 3 domain models and mock fixtures.
- Worker 2: Chunk 4 app shell and auth.
- Worker 3: Chunk 5 homepage.
- Worker 4: Chunk 6 problems and problem detail.
- Worker 5: Chunk 7 submissions.
- Worker 6: Chunk 8 Task 16 contest list/detail, owning `features/contests/detail/**`.
- Worker 7: Chunk 8 Task 17 contest workspace, owning `features/contests/workspace/**`.
- Worker 8: Chunk 8 Task 18 scoreboards, owning `features/contests/scoreboard/**`.
- Worker 9: Chunk 9 Arena.
- Worker 10: Chunk 10 real API integration after page mocks are stable.

Workers must not edit another worker's route or feature folder without coordination. Shared components require style guide updates and focused tests.

## Stop Conditions

Pause implementation and ask for direction if:

- OpenAPI lacks fields needed for ACM or OI/IOI scoreboard display.
- Backend auth storage model conflicts with the planned frontend session boundary.
- Large scoreboard rendering is too slow without virtualization.
- A page cannot satisfy Signal Arena style without adding new shared tokens or components.
- CI provider changes away from GitHub Actions, requiring a different pipeline setup.
