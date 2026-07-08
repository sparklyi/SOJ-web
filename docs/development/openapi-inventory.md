# SOJ-web v2 OpenAPI Inventory

Source: `../SOJ/api/openapi.yaml`

This inventory is the frontend contract checkpoint for the v2 API adaptation. Mock mode may model fields that are not available yet, but every such field must be listed here as a backend contract gap.

## Integration Status

HTTP mode now adapts the SOJ OpenAPI contract through `lib/api/http-adapter.ts` and keeps the page-facing model in `lib/api/types.ts` stable.

Connected in HTTP mode:

- Auth login, register, refresh, logout, and current user.
- Problem list, detail, statement, stats, and language selection.
- Submission list, detail, create, self-run create, and self-run detail.
- Contest list, detail, registration, and ACM scoreboard.

Browser-origin requests should use the same-origin `/soj-api/*` proxy configured in `next.config.ts`; server-side requests can use `SOJ_API_INTERNAL_BASE_URL` or `NEXT_PUBLIC_SOJ_API_BASE_URL` when an absolute backend URL is required.

## Auth

Used by v2:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/me`

Available schemas:

- `RegisterRequest`
- `LoginRequest`
- `RefreshRequest`
- `AuthEnvelope`
- `UserEnvelope`

## Problems

Used by v2:

- `GET /api/v1/problems`
- `GET /api/v1/problems/{id}`
- `GET /api/v1/problems/{id}/statement`
- `GET /api/v1/problems/{id}/stats`

Available schemas:

- `ProblemPageEnvelope`
- `ProblemEnvelope`
- `ProblemStatementEnvelope`
- `ProblemStatsEnvelope`

First release does not consume problem create/update/testcase admin endpoints.

## Submissions And Runs

Used by v2:

- `POST /api/v1/submissions`
- `GET /api/v1/submissions`
- `GET /api/v1/submissions/{id}`
- `POST /api/v1/runs`
- `GET /api/v1/runs/{id}`

Available schemas:

- `SubmissionCreateRequest`
- `SubmissionEnvelope`
- `SubmissionPageEnvelope`
- `SubmissionResponse`
- `SubmissionResultSummary`
- `SubmissionCaseSummary`
- `RunEnvelope`

Available submission fields support queued, running, judged, score, time, memory, case summaries, and safe error summaries.

Frontend notes:

- Submission list requires a user token in HTTP mode.
- Detail visibility remains enforced by backend owner/admin/root/contest rules.
- Page-level browser clients read the local session token before calling protected detail or create endpoints.

## Contests

Used by v2:

- `GET /api/v1/contests`
- `GET /api/v1/contests/{id}`
- `POST /api/v1/contests/{id}/registrations`
- `GET /api/v1/contests/{id}/scoreboard`

Available schemas:

- `ContestPageEnvelope`
- `ContestEnvelope`
- `ContestRegistrationEnvelope`
- `ScoreboardEnvelope`

First release does not consume contest create/update/delete endpoints.

Frontend notes:

- `ContestSummary.type` defaults to `acm` until the backend exposes contest scoring mode.
- `ContestSummary.registered` defaults to false from the backend payload. The frontend uses a user-scoped local registration bridge after a successful registration so the v2 workspace can transition immediately.
- Contest problem titles are rendered from alias/problem id until the backend returns enriched problem titles in contest payloads.

## ACM Scoreboard

Available:

- `ScoreboardResponse.view`
- `ScoreboardResponse.problems`
- `ScoreboardRow.rank`
- `ScoreboardRow.display_name`
- `ScoreboardRow.accepted_count`
- `ScoreboardRow.penalty_minutes`
- `ScoreboardCell.status`
- `ScoreboardCell.attempts`
- `ScoreboardCell.frozen_attempts`
- `ScoreboardCell.penalty_minutes`
- `ScoreboardCell.accepted_at`
- `ScoreboardCell.last_submission_id`

This is enough for ACM live, frozen, and final table views.

## OI/IOI Scoreboard Gaps

Not available in the current OpenAPI contract:

- Contest type or scoring mode field.
- Per-row total score for OI/IOI.
- Per-cell partial score.
- Per-cell max score.
- Highest scoring submission metadata.
- Score delta event stream.
- Subtask or group breakdown in scoreboard cells.

Mock mode must model these fields separately until the backend contract is extended.

## Arena Event Gaps

Not available in the current OpenAPI contract:

- Arena event feed endpoint.
- Rank movement event type.
- First accepted event type.
- Freeze countdown event projection.
- Score delta event projection.
- Public display-safe participant metadata for big-screen mode.

Mock mode must model Arena events separately until the backend contract is extended.

## Known Follow-Up

Backend contract follow-ups before removing frontend bridges:

- Add a public language list endpoint for regular users. Current OpenAPI exposes `/api/v1/admin/languages`, which is not the right long-term public contract.
- Add current-user contest registration state to contest list/detail responses.
- Add contest scoring mode to contest list/detail responses.
- Add enriched contest problem titles or a documented frontend enrichment endpoint.
- Add OI/IOI scoreboard fields listed above if those modes remain product scope.
- Add Arena event feed fields listed above if the live signal surface remains product scope.
