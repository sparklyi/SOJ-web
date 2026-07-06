# SOJ-web v2 Signal Arena Design

Date: 2026-07-07

## Status

Approved design direction. This document defines the frontend v2 rewrite design only. It does not authorize implementation until the written spec is reviewed and the implementation plan is approved.

## Goal

Rewrite SOJ-web as v2 with a new Next.js application, archive the current Vue/Vite application as v1, and ship a cohesive, high-end online judge product experience for students, contest participants, and operators.

The first v2 release focuses on the core user loop:

- Enter SOJ from a strong product homepage.
- Register, log in, restore session, and see permission-aware UI.
- Browse problems.
- Read a problem, write or submit code, and inspect results.
- View submissions and judge feedback.
- Join contests.
- Solve contest problems.
- Read contest details.
- Use ACM and OI/IOI scoreboards.
- Use an Arena view for live or big-screen contest display.

The first release does not include admin management, problem authoring, language management, contest management, or full backend operations screens.

## Chosen Direction

The selected visual and product direction is **Signal Arena**.

Signal Arena is a dark technical competition interface with a premium product feel. Its identity comes from live judge status, scoreboard movement, freeze countdowns, score deltas, and contest signal feeds. It should feel more ambitious than a standard OJ UI, without becoming a decorative marketing site.

Design dials:

- Design variance: 7
- Motion intensity: 6
- Visual density: 6

The page style must remain unified across the app. No page should fall back to legacy Ant Design, generic admin UI, or unrelated template styling.

## Product Architecture

v2 will be a new Next.js app at the repository root. The current Vue/Vite app will later be archived under `archive/v1-vue/`.

Routes are redesigned for v2. The project has not launched publicly, so v2 does not need to preserve old routes.

Core routes:

- `/`: Signal Arena homepage. Brand-first entry with live contest, problem, submission, and scoreboard signals.
- `/auth/login`: Login.
- `/auth/register`: Registration.
- `/problems`: Problem set, search, filters, status, difficulty, and tags.
- `/problems/[id]`: Public problem detail. Reading-first layout by default.
- `/submissions`: Submission list.
- `/submissions/[id]`: Single submission and judge timeline.
- `/contests`: Contest list.
- `/contests/[id]`: Contest detail, registration, rules, announcements, problems, and status.
- `/contests/[id]/problems/[problemId]`: Contest problem workspace.
- `/contests/[id]/scoreboard`: Professional scoreboard.
- `/contests/[id]/arena`: Live or big-screen contest Arena.
- `/me`: User profile, activity, submissions, contests, and progress.
- `/settings`: Account and preference settings.

Future routes can add admin, problem authoring, language management, contest management, and operator dashboards without changing the core route model.

## Visual System

The visual system is a custom SOJ Design System. It may use accessible headless primitives such as Radix for dialog, tooltip, popover, select, or tabs, but visual styling must be fully owned by SOJ.

Theme:

- Primary visual target is dark mode.
- Use off-black and metal-gray surfaces, not pure black.
- Use fine lines, density shifts, and data bands instead of heavy cards.
- Use one primary accent: sharp lime or acid green.
- Semantic warning and error colors are allowed, but should be controlled and lower saturation.
- Light mode can be planned later, but it must not compromise the first v2 dark-mode identity.

Typography:

- Use a modern sans face for product UI and reading.
- Use a mono face for numbers, code, verdicts, timers, and scoreboard values.
- Avoid system-font-only styling as the final v2 identity.
- Avoid typography that makes the app feel like a generic SaaS template.

Shape and layout:

- Avoid large rounded card grids as the dominant pattern.
- Use 8px or smaller radius for framed controls unless a component has a specific reason.
- Prefer data rows, split panes, cockpit layouts, tables, side rails, and timeline strips.
- Use stable dimensions for boards, grids, toolbars, counters, and verdict tiles so dynamic states do not shift layout.

Motion:

- Motion must communicate state, hierarchy, or feedback.
- Primary motion cases are judge lifecycle, verdict transition, scoreboard rank movement, freeze countdown, panel switching, and active contest signals.
- Motion must respect reduced-motion preferences.
- Avoid decorative loops that do not explain a product state.

## Component System

Core components:

- `Button`
- `IconButton`
- `Input`
- `Textarea`
- `Select`
- `Tabs`
- `Dialog`
- `Popover`
- `Tooltip`
- `Toast`
- `Table`
- `DataRow`
- `PageShell`
- `AppSidebar`
- `TopNav`
- `StatusPill`
- `VerdictBadge`
- `ProblemStatus`
- `ContestClock`
- `SignalFeed`
- `SubmissionTimeline`
- `TestPointMatrix`
- `ScoreboardGrid`
- `RankMovement`
- `CodeWorkspace`
- `ProblemStatement`
- `AuthGate`

Component requirements:

- Every interactive control has default, hover, active, focus, disabled, loading, and error states where applicable.
- Controls use icons for common commands when an icon is clearer than text.
- Forms use labels above inputs, helper text where useful, and inline error messages.
- Tables and scoreboards are accessible, keyboard navigable where relevant, and readable at dense data sizes.
- No visible copy should explain the design itself. UI text must be product text.

## Core Page Design

### Homepage

The homepage is a hybrid product gateway. It should be high-end and brand-forward, but immediately useful.

First viewport:

- SOJ as the main first-viewport signal.
- Live contest status.
- Active scoreboard or submission signal.
- Fast entry to problems, contests, login, or continue-solving action.

Below the first viewport:

- Active contests.
- Recommended or recent problems.
- Recent judge activity.
- A concise product confidence section only if it supports app entry.

The homepage should not become a generic marketing landing page.

### Problem Set

The problem list is a training hall:

- Search.
- Tags.
- Difficulty.
- Solved and attempted status.
- Recent submission state.
- Fast navigation into the problem detail.

Use dense, polished data rows instead of large repeated cards.

### Problem Detail

Public problem detail uses a reading-first layout:

- Statement, input, output, examples, constraints, notes, tags, and stats are readable without fighting the editor.
- Submit controls can live in a side panel, sticky rail, or drawer.
- The layout should make long statements comfortable.

Contest problem detail switches to workspace mode:

- Problem statement, code workspace, and judge feedback can be shown together.
- Contest clock, registration state, permission state, freeze state, and submit risk hints stay visible.
- The workspace prioritizes fast solve and submit loops.

### Submission Feedback

Submission feedback uses the competitive signal model:

- Queued.
- Compiling.
- Running.
- Test point progress.
- Verdict.
- Time and memory.
- Compile errors, runtime errors, and system errors.
- Contest impact where applicable.

For ACM contests, contest impact can include accepted state, penalty implications, and rank movement. For OI/IOI contests, contest impact can include score delta, subtask score, highest score, and rank movement.

### Contests

Contest detail includes:

- Contest lifecycle state.
- Registration or participation action.
- Rules.
- Announcements.
- Problem list.
- Scoreboard entry.
- Arena entry.
- Access or submit permission hints.

The first release supports ACM and OI/IOI contest UI. Later IO-style contests should fit the model without rewriting the core app.

### Scoreboard And Arena

The scoreboard page is professional and accurate:

- ACM view supports solved count, penalty, problem status, attempts, first blood where supported, freeze states, and rank movement.
- OI/IOI view supports total score, per-problem score, subtask or partial scoring where supported, highest score, and score delta.
- Sorting, sticky headers, and dense readability matter more than decorative motion.

The Arena page is for live viewing and big screens:

- Rank movement.
- Freeze countdown.
- Key submissions.
- Accepted events.
- Score deltas.
- Contest status and time.

Arena should use the same design system as the rest of the app, but with larger scale and stronger motion.

### User Space

`/me` is lightweight in the first release:

- Recent submissions.
- Contest participation.
- Problem progress.
- Account state.
- Useful shortcuts.

Social features are out of scope.

## API And Data Flow

v2 is contract-first.

The backend OpenAPI contract is the source of truth. In local development, the frontend should reference the backend OpenAPI file at `../SOJ/api/openapi.yaml` or a generated artifact derived from it.

Expected API areas:

- Auth: register, login, refresh, logout, current user.
- Problems: list, detail, statement, testcase sets, stats.
- Submissions and runs: create, list, detail, judge status.
- Contests: list, detail, registration, scoreboard.
- Admin APIs are not first-release UI scope.

Data access rules:

- Pages do not call `fetch` directly.
- API clients live under shared API utilities or feature-specific API modules.
- Generated types should be used where practical.
- Server data uses a query/cache model.
- Local state remains local unless it is session, theme, or workspace preference.

Important domain models:

- `Session`
- `CurrentUser`
- `Problem`
- `ProblemStatement`
- `Submission`
- `SubmissionLifecycle`
- `Contest`
- `ContestLifecycle`
- `ContestRegistration`
- `ScoreboardModel`
- `ScoreboardRow`
- `ScoreboardProblemCell`
- `ArenaEvent`

## Mock And Dev Mode

The first release needs a full mock/dev mode.

Mock mode should run without the backend and cover:

- Homepage signals.
- Authenticated and anonymous states.
- Problem list.
- Problem detail.
- Submission lifecycle.
- Submission detail.
- Contest list.
- Contest detail.
- ACM scoreboard.
- OI/IOI scoreboard.
- Arena event feed.
- Permission and access states.

The app should switch between mock and real API through environment configuration. Mock data should be realistic enough for UI review and CI, but clearly isolated from production API code.

## Authentication And Permissions

The first release uses contest-aware authentication:

- Registration.
- Login.
- Token refresh.
- Logout.
- Session restoration.
- Current user fetch.
- Anonymous state.
- Authenticated state.
- Role and permission display.
- Unauthenticated route guards.
- Contest registration state.
- Contest participation state.
- Submit permission hints.
- Scoreboard visibility hints.
- Freeze or contest-state restrictions.

Auth errors should be inline in forms or shown as contextual page state. Avoid generic modal errors.

Session and token handling must follow the backend security model. The frontend must not hardcode credentials, expose private tokens in logs, or spread session storage concerns across pages. Refresh and logout behavior should live behind the shared auth boundary.

## Error, Empty, And Loading States

Every core page needs designed states:

- Loading skeletons that match the final layout.
- Empty problem list.
- Empty submissions.
- No active contests.
- Not registered for contest.
- Contest not started.
- Contest frozen.
- Submission still judging.
- Submission failed due to compile/runtime/system error.
- Network or API failure.
- Permission denied.
- Not found.

Errors should preserve the Signal Arena style and should tell the user what action is available.

## Testing And Verification

Initial CI should include:

- Install.
- Type check.
- Lint.
- Unit tests.
- Production build.

Unit test targets:

- Scoreboard model transforms.
- ACM ranking and display helpers.
- OI/IOI ranking and score display helpers.
- Submission lifecycle state transitions.
- Auth guard behavior.
- Mock adapter behavior.

Browser or E2E targets:

- Homepage renders in mock mode.
- Register or login path.
- Problem list filtering.
- Problem detail reading-first layout.
- Contest problem workspace.
- Submission lifecycle display.
- ACM scoreboard.
- OI/IOI scoreboard.
- Arena view.

Visual verification:

- Core pages must be checked on desktop and mobile.
- Text must not overlap or overflow controls.
- Dynamic judge and scoreboard states must not cause layout shifts.
- The style must remain unified across all routes.

## Acceptance Criteria

The v2 first release design is considered satisfied when:

- The Vue/Vite v1 app is archived and not mixed with v2 source paths.
- The Next.js app can run in mock mode without the backend.
- The core routes listed in this spec render with unified Signal Arena styling.
- Authenticated, anonymous, denied, loading, empty, and error states are represented in the UI.
- Problem reading mode and contest workspace mode are distinct but visually consistent.
- Submission lifecycle states are visible without layout jumps.
- ACM and OI/IOI scoreboards use different scoring displays behind a shared scoreboard model.
- Arena mode highlights contest signals without replacing the professional scoreboard.
- CI verifies install, type check, lint, tests, and build.
- Desktop and mobile browser checks pass for core pages.

## Delivery Sequence

Implementation should be planned separately after this spec is reviewed.

Recommended sequence:

1. Archive v1 and scaffold v2 at the root.
2. Establish Next.js, TypeScript, Tailwind, lint, tests, and CI.
3. Add OpenAPI-derived types or a typed client boundary.
4. Build SOJ Design System foundations.
5. Build mock/dev mode.
6. Build app shell, navigation, auth shell, and route structure.
7. Build homepage.
8. Build problems and problem detail.
9. Build submissions and judge lifecycle.
10. Build contests, contest detail, scoreboards, and Arena.
11. Connect real APIs.
12. Run browser verification and polish.

## Open Follow-Ups

These items are intentionally deferred to implementation planning:

- Exact Next.js version and package manager choice.
- Exact font choices and licensing.
- Whether to use Radix primitives directly or through a thin SOJ wrapper.
- Whether to include Storybook in the first implementation slice.
- How to structure generated OpenAPI artifacts.
- Exact CI provider details.
- Later admin and problem-authoring scope.

## Risks To Manage During Planning

- Scope creep from admin, authoring, or full operator workflows.
- Visual drift if pages are built independently without shared tokens and components.
- Backend contract gaps around OI/IOI scoring, contest freeze behavior, or Arena events.
- Mock data becoming a parallel API instead of a testable adapter.
- Scoreboard performance on large contests.
- Overusing motion in dense work surfaces.
