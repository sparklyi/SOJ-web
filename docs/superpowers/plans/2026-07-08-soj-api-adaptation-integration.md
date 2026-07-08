# SOJ API Adaptation Integration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make SOJ-web HTTP mode usable against the SOJ OpenAPI contract for auth, problems, languages, submissions/runs, contests, and local integration smoke testing.

**Architecture:** Keep `lib/api/types.ts` as the page-facing view-model contract. Add backend DTO types plus mapper/enricher helpers under `lib/api`, and implement `createHttpAdapter()` as the translation boundary from OpenAPI responses to existing v2 UI models. Client-only forms can use the same HTTP adapter; token storage stays lightweight for this pass and can be upgraded to cookie-backed SSR later.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, fetch, SOJ OpenAPI envelope responses.

---

## Chunk 1: API Contract And Transport Foundation

### Task 1: Backend DTOs, Request Helper, Auth Header, And Error Mapping

**Files:**
- Create: `lib/api/backend-types.ts`
- Create: `lib/api/http-client.ts`
- Modify: `lib/api/errors.ts`
- Modify: `lib/api/http-adapter.ts`
- Modify: `tests/unit/http-adapter.test.ts`

- [ ] **Step 1: Write failing tests for envelope parsing, errors, and auth headers**

Extend `tests/unit/http-adapter.test.ts` with tests that assert:
- successful envelope returns `data`
- backend `{ error: { code, message } }` throws `ApiError`
- non-JSON or missing `data` throws `ApiError`
- a provided access token adds `Authorization: Bearer <token>`

Run: `npm run test -- tests/unit/http-adapter.test.ts`

- [ ] **Step 2: Add backend DTO types**

Create `lib/api/backend-types.ts` with OpenAPI-shaped request/response types for:
- `Envelope<T>`
- `PageResponse<T>`
- `UserResponse`, `AuthResponse`
- `ProblemResponse`, `ProblemStatementResponse`, `ProblemStatsResponse`
- `LanguageResponse`
- `SubmissionResponse`, `RunResponse`
- `ContestResponse`, `ContestRegistrationResponse`
- `ScoreboardResponse`

Keep field names snake_case where the backend uses snake_case.

- [ ] **Step 3: Add HTTP request helper**

Create `lib/api/http-client.ts` exporting:
- `apiBaseUrl()`
- `request<T>(path, options)`
- `buildQuery(params)`

The helper must:
- default to `NEXT_PUBLIC_SOJ_API_BASE_URL ?? "http://localhost:8080"`
- use `cache: "no-store"`
- parse envelope responses
- preserve backend error code/message/status in `ApiError`
- accept optional `accessToken`

- [ ] **Step 4: Update the HTTP adapter to use the helper**

Keep `languages.list()` behavior working, but route it through `request()`.

- [ ] **Step 5: Verify and commit**

Run:
- `npm run test -- tests/unit/http-adapter.test.ts`
- `npm run typecheck`

Commit:

```bash
git add lib/api tests/unit/http-adapter.test.ts
git commit -m "feat: add http api transport foundation"
```

---

## Chunk 2: Auth And Session Boundary

### Task 2: Real Auth Methods And Client Form Wiring

**Files:**
- Modify: `lib/api/types.ts`
- Modify: `lib/api/http-adapter.ts`
- Modify: `lib/auth/session.ts`
- Create or replace: `features/auth/auth-form.tsx`
- Modify: `app/auth/login/page.tsx`
- Modify: `app/auth/register/page.tsx`
- Modify: `tests/unit/auth-session.test.ts`
- Modify: `tests/unit/http-adapter.test.ts`

- [ ] **Step 1: Write failing tests for auth mapping and session tokens**

Add tests that assert:
- `auth.login()` maps `AuthResponse.user.username` to `CurrentUser.handle/displayName`
- session stores `accessToken`, `refreshToken`, `user`, and `expiresAt`
- expired sessions are cleared

Run:
- `npm run test -- tests/unit/auth-session.test.ts tests/unit/http-adapter.test.ts`

- [ ] **Step 2: Extend page-facing auth API**

In `lib/api/types.ts`, extend `ApiClient.auth` with:
- `login(input: { email: string; password: string })`
- `register(input: { email: string; username: string; password: string })`
- `refresh(input: { refreshToken: string })`
- `logout(input?: { refreshToken?: string })`
- keep `me()`

Return the saved session shape from login/register/refresh.

- [ ] **Step 3: Implement HTTP auth methods**

In `lib/api/http-adapter.ts`, call:
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/me`

Map backend user to `CurrentUser`.

- [ ] **Step 4: Replace mock auth form with real-mode aware form**

Create `features/auth/auth-form.tsx` or replace the mock form. The form should:
- work in mock mode without a backend
- in HTTP mode call `auth.login()` or `auth.register()`
- save session to `localStorage`
- redirect to `/me` on success
- show validation/API errors inline

- [ ] **Step 5: Verify and commit**

Run:
- `npm run test -- tests/unit/auth-session.test.ts tests/unit/http-adapter.test.ts`
- `npm run lint`

Commit:

```bash
git add lib/api lib/auth features/auth app/auth tests/unit
git commit -m "feat: connect auth to backend api"
```

---

## Chunk 3: Problems And Languages

### Task 3: Problem And Language HTTP Mapping

**Files:**
- Modify: `lib/api/types.ts`
- Modify: `lib/api/http-adapter.ts`
- Create: `lib/api/problem-mappers.ts`
- Modify: `features/problems/api.ts`
- Modify: `tests/unit/http-adapter.test.ts`
- Modify: `tests/unit/feature-api.test.ts`

- [ ] **Step 1: Write failing tests for problem mapping**

Add HTTP adapter tests for:
- `problems.list()` maps backend problem page to `ProblemSummary`
- `problems.get(id)` combines problem, statement, and stats into `ProblemDetail`
- missing stats or statement errors remain typed API errors
- language listing still maps `LanguageResponse` to `JudgeLanguage`

Run: `npm run test -- tests/unit/http-adapter.test.ts`

- [ ] **Step 2: Implement problem mappers**

Create `lib/api/problem-mappers.ts` with:
- `mapProblemSummary(problem, stats?)`
- `mapProblemDetail(problem, statement, stats)`

Rules:
- use backend `limits.time_limit_ms` and `limits.memory_limit_kb`
- use statement `description`, `input_description`, `output_description`, and `samples`
- set HTTP-mode solve status to `"todo"` until backend exposes user progress
- use stats totals for acceptance counts

- [ ] **Step 3: Implement problem HTTP methods**

In `createHttpAdapter()`:
- `problems.list()` calls `GET /api/v1/problems?page=1&page_size=100`
- optionally fetch stats per item only if needed for display; keep this bounded
- `problems.get(id)` calls problem, statement, and stats endpoints

- [ ] **Step 4: Confirm language endpoint behavior**

Keep current admin language endpoint for now, but isolate the path in one place so it can be swapped to `/api/v1/languages` once backend exposes it.

- [ ] **Step 5: Verify and commit**

Run:
- `npm run test -- tests/unit/http-adapter.test.ts tests/unit/feature-api.test.ts`
- `npm run typecheck`

Commit:

```bash
git add lib/api features/problems tests/unit
git commit -m "feat: map backend problems into v2 views"
```

---

## Chunk 4: Submissions, Runs, And Workspace Actions

### Task 4: Submission/Run APIs And Submit UI

**Files:**
- Modify: `lib/api/types.ts`
- Modify: `lib/api/http-adapter.ts`
- Create: `lib/api/submission-mappers.ts`
- Modify: `lib/domain/submission.ts`
- Modify: `components/soj/code-workspace.tsx`
- Modify: `features/problems/problem-submit-panel.tsx`
- Modify: `features/contests/workspace/contest-workspace-page.tsx`
- Modify: `tests/unit/submission-lifecycle.test.ts`
- Modify: `tests/unit/http-adapter.test.ts`

- [ ] **Step 1: Write failing tests for judge statuses and submit APIs**

Add tests that assert:
- `time_limit`, `memory_limit`, and `canceled` have display states
- `submissions.list()` maps backend submissions to `SubmissionSummary`
- `submissions.create()` posts `problem_id`, `contest_id`, `language_id`, `source_code`
- `runs.create()` posts `problem_id`, `language_id`, `source_code`, and optional `stdin`

Run:
- `npm run test -- tests/unit/submission-lifecycle.test.ts tests/unit/http-adapter.test.ts`

- [ ] **Step 2: Extend API types**

In `lib/api/types.ts`:
- add backend judge statuses to `JudgeStatus`
- add `submissions.create(input)`
- add `runs.create(input)` and `runs.get(id)`

- [ ] **Step 3: Implement submission mappers and HTTP methods**

Create `lib/api/submission-mappers.ts`.

Mapping rules:
- `submitted_at -> submittedAt`
- `time_ms -> timeMs`
- `memory_kb -> memoryKb`
- `contest_id ?? undefined`
- `problemTitle` should be `"Problem #<problem_id>"` unless enriched by a known problem list

- [ ] **Step 4: Make workspace code editable and submittable**

Update `CodeWorkspace` so callers can receive:
- selected `languageId`
- current `sourceCode`

Update standalone and contest submit panels to:
- call `submissions.create()`
- include `contestId` when in contest workspace
- show pending/success/error state
- link to `/submissions/{id}` on success

- [ ] **Step 5: Verify and commit**

Run:
- `npm run test -- tests/unit/submission-lifecycle.test.ts tests/unit/http-adapter.test.ts`
- `npm run lint`
- `npm run typecheck`

Commit:

```bash
git add lib/api lib/domain components/soj features/problems features/contests tests/unit
git commit -m "feat: connect submissions and runs"
```

---

## Chunk 5: Contests, Registration, And Scoreboard

### Task 5: Contest HTTP Mapping And Scoreboard Data

**Files:**
- Modify: `lib/api/types.ts`
- Modify: `lib/api/http-adapter.ts`
- Create: `lib/api/contest-mappers.ts`
- Modify: `features/contests/api.ts`
- Modify: `lib/domain/contest.ts`
- Modify: `tests/unit/scoreboard.test.ts`
- Modify: `tests/unit/http-adapter.test.ts`
- Modify: `tests/unit/feature-api.test.ts`

- [ ] **Step 1: Write failing tests for contest and scoreboard mapping**

Add tests that assert:
- backend contest status maps into frontend lifecycle safely
- contest problems map alias/problem IDs
- `contests.scoreboard(id)` maps backend ACM rows into the existing scoreboard model path
- registration posts display name, email, and optional invite code

Run:
- `npm run test -- tests/unit/http-adapter.test.ts tests/unit/scoreboard.test.ts`

- [ ] **Step 2: Extend contest API contract**

In `lib/api/types.ts`, add:
- `contests.register(id, input)`
- `contests.scoreboard(id)`

Keep `ContestSummary.type` defaulted to `"acm"` in HTTP mode until backend exposes scoring mode.

- [ ] **Step 3: Implement contest mappers and HTTP methods**

Create `lib/api/contest-mappers.ts`.

Rules:
- backend `published` before start maps to `scheduled`
- backend `running` with `freeze_at <= now < end_at` maps to `frozen`
- backend `ended` maps to `ended`
- backend `archived` maps to `unsealed`
- `registered` defaults to `false` until backend exposes current-user registration state

- [ ] **Step 4: Use backend scoreboard in feature API**

Update `features/contests/api.ts` so:
- HTTP adapter scoreboard is used when available
- mock OI/IOI fallback stays only for mock contests
- Arena remains derived from submissions/scoreboard

- [ ] **Step 5: Verify and commit**

Run:
- `npm run test -- tests/unit/http-adapter.test.ts tests/unit/scoreboard.test.ts tests/unit/feature-api.test.ts`
- `npm run typecheck`

Commit:

```bash
git add lib/api lib/domain features/contests tests/unit
git commit -m "feat: connect contests and scoreboard"
```

---

## Chunk 6: Full Local Flow And Documentation

### Task 6: Integration Smoke Flow

**Files:**
- Modify: `docs/development/openapi-inventory.md`
- Create: `docs/development/api-integration-smoke.md`
- Modify tests only if needed to reflect final API contract.

- [ ] **Step 1: Run focused automated checks**

Run:
- `npm run test`
- `npm run lint`
- `npm run lint:style`
- `npm run typecheck`
- `npm run build`

- [ ] **Step 2: Run backend availability smoke**

If the backend can be started locally, use:
- SOJ backend on `http://localhost:8080`
- SOJ-web with `NEXT_PUBLIC_SOJ_API_MODE=http`

Smoke the following browser-visible flow:
- login or register
- problem list
- problem detail
- language list
- submission create
- submission detail
- contest list/detail
- scoreboard

If backend seed data or services are missing, document the exact blocker and keep automated adapter tests as the source of verification.

- [ ] **Step 3: Update integration docs**

Update the OpenAPI inventory with resolved and still-open gaps.

Create `docs/development/api-integration-smoke.md` with:
- environment variables
- commands
- expected smoke flow
- known backend gaps

- [ ] **Step 4: Final commit**

Commit:

```bash
git add docs tests lib features components app
git commit -m "docs: document api integration smoke flow"
```

---

## Completion Criteria

- HTTP mode no longer throws `api.not_connected` for auth, problems, submissions, contests, or languages.
- Mock mode still passes existing tests.
- Submit UI can create a backend submission when a valid token and backend data exist.
- Contest scoreboard uses backend ACM data in HTTP mode.
- Remaining backend gaps are documented, not hidden behind mock-only assumptions.
- Relevant checks pass or any external backend blocker is documented with exact command output.
