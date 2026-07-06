# SOJ-web v2 OpenAPI Inventory

Source: `../SOJ/api/openapi.yaml`

This inventory is the frontend contract checkpoint before page work starts. Mock mode may model fields that are not available yet, but every such field must be listed here as a backend contract gap.

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

Before real API integration, update this inventory and reconcile frontend mock fields with backend schema changes.
