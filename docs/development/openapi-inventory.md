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
- Owner problem listing, problem creation/editing, statement versions, testcase archive upload, validation checks, authoring state, and publication.
- Problem review queue, review decision, and review event history.
- Contest-scoped role assignments: list, grant, and revoke.
- Rejudge batches: list, create, detail, and cancel.
- Global role administration: user listing/search, user update, and role grant/revoke.

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
- `GET /api/v1/problems?mine=true`
- `POST /api/v1/problems`
- `PATCH /api/v1/problems/{id}`
- `POST /api/v1/problems/{id}/statement`
- `POST /api/v1/problems/{id}/testcase-sets`
- `POST /api/v1/problems/{id}/checks`
- `GET /api/v1/problems/{id}/authoring`

Available schemas:

- `ProblemPageEnvelope`
- `ProblemEnvelope`
- `ProblemStatementEnvelope`
- `ProblemStatsEnvelope`

The author console consumes owner-scoped problem create/update, statement, testcase, check, and review-submission endpoints. Publication remains controlled by the backend review workflow after the current testcase set passes its readiness gate.

## Problem Review

Used by v2:

- `GET /api/v1/problems/review-queue`
- `POST /api/v1/problems/{id}/review`
- `POST /api/v1/problems/{id}/review/decision`
- `GET /api/v1/problems/{id}/review/events`

Available schemas:

- `ProblemReviewQueueEnvelope`
- `ProblemReviewDecisionRequest`
- `ProblemReviewEventPageEnvelope`

Frontend notes:

- The review workbench at `/manage/reviews` is gated on `problem.review` or `problem.manage_all`, mirroring `CanViewReviewQueue`.
- `x-auth` differs between create and update: `POST /problems` is `author-admin-root` (any authoring role may open a draft) while `PATCH /problems/{id}` is `owner-admin-root`. The authoring console relies on create for new drafts and on ownership for edits of existing ones.
- The decision endpoint requires `problem.review` plus `problem.publish` and refuses a reviewer who owns the problem, which keeps approval a two-person decision. Full-access roles bypass both gates (`CanDecideReview`).

## Rejudge

Used by v2:

- `GET /api/v1/rejudge-batches`
- `POST /api/v1/rejudge-batches`
- `GET /api/v1/rejudge-batches/{id}`
- `POST /api/v1/rejudge-batches/{id}/cancel`

Available schemas:

- `RejudgeBatchPageEnvelope`
- `RejudgeBatchEnvelope`
- `RejudgeBatchDetailEnvelope`

Frontend notes:

- The global rejudge console at `/manage/rejudge` is gated on `submission.rejudge` or `problem.manage_all`, which covers the operator and admin/root sessions that can create a problem-target batch.
- The contest-scoped console at `/contests/{id}/rejudge` is reachable only from the contest detail page, which resolves its own access from the contest payload. It pins the target to that one contest so a judge never types a foreign ID.
- Batch listing is open to any authenticated caller (`x-auth: user`) but the backend scopes non-admin callers to the batches they requested; the console therefore renders only what the caller may see without a client-side filter.
- Exactly one target (problem or contest) is accepted. A problem target needs `submission.rejudge` (`CanRejudge`); a contest target is a contest-judge decision (admin/root, contest owner, contest manager, or contest judge, per `requireContestJudge`) and the backend re-validates that the contest has ended.
- The target picker offers only the kinds the viewer may actually submit: `submission.rejudge` for a problem target, and admin/root, `contest.manage`, or `contest.judge` for a contest target. The two lists are derived from the same predicates as `requireContestJudge`, so a judge without `submission.rejudge` sees a contest-only console instead of a form that fails on submit.

## Contest Roles

Used by v2:

- `GET /api/v1/contests/{id}/roles`
- `POST /api/v1/contests/{id}/roles`
- `DELETE /api/v1/contests/{id}/roles/{role}/users/{user_id}`

Available schemas:

- `ContestRoleAssignmentPageEnvelope`
- `ContestResponse.current_user_roles`

Frontend notes:

- `ContestSummary.currentUserRoles` maps from `current_user_roles`, which the backend fills for the requesting session and always returns as an array.
- Contest roles are not part of the global permission set, so the UI resolves access to `/contests/{id}/roles` from the contest owner, an existing `contest_manager` assignment, or an admin/root session. The shared hook lives at `lib/auth/contest-access.ts` and mirrors the backend predicates `requireContestManager` and `requireContestJudge`.
- The contest detail page only links to the role manager for viewers who pass that check, and the manager route re-checks independently, so a direct URL visit cannot bypass the gate.
- `ContestRoleManager` keeps the per-contest assignments in one place; the global role endpoint rejects a contest role with `role.invalid_role`, so the two surfaces must stay separate.

## Global Roles

Used by v2:

- `GET /api/v1/admin/users`
- `PATCH /api/v1/admin/users/{id}`
- `POST /api/v1/admin/users/{id}/roles`
- `DELETE /api/v1/admin/users/{id}/roles/{role}`

Available schemas:

- `UserPageEnvelope`
- `UserEnvelope`
- `RoleAssignmentResponse`

Frontend notes:

- The role manager at `/admin/users` is gated on `user.manage`; grant and revoke actions additionally check `role.grant` and `role.revoke`.
- The signed-in account cannot change its own global roles; the backend rejects the request and the UI disables the form.
- `system.manage` is reserved in the backend permission set and no HTTP endpoint consumes it yet, so no frontend surface offers it.

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

## Languages

Used by v2:

- `GET /api/v1/languages`

Available schemas:

- `LanguagePageEnvelope`
- `LanguageResponse`

Frontend notes:

- HTTP mode requests enabled SOJ agent languages for regular users without admin permissions.

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

- `ContestSummary.type` maps from backend `scoring_mode`.
- `ContestSummary.ownerUserId` maps from backend `owner_user_id` and backs the owner check in the contest role access hook.
- `ContestSummary.registered` maps from backend current-user registration state. The frontend still keeps a user-scoped local registration bridge immediately after a successful registration so the workspace can transition before the next fetch.
- Contest problem titles use backend-enriched `problems[].title` with an alias fallback.

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

- Non-ACM scoring mode values.
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

- Add OI/IOI scoreboard fields listed above if those modes remain product scope.
- Add Arena event feed fields listed above if the live signal surface remains product scope.
- `system.manage` is carried by full-access roles but has no HTTP endpoint yet; either attach it to a system administration surface or drop it from `AllPermissions`.
- The `x-auth` hints for the admin and rejudge endpoints were corrected to match the handlers: admin user/role/language administration is `admin-root` (the handlers authorize `user.manage`, `role.grant`, `role.revoke`, and `actor.Admin()`), and rejudge is `operator-contest-judge-owner-admin-root`.
