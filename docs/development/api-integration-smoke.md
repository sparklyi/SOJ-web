# SOJ API Integration Smoke

This smoke path validates SOJ-web v2 against the SOJ backend OpenAPI contract.

## Environment

Frontend defaults:

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SOJ_API_MODE` | `mock` | Use `http` for backend integration. |
| `NEXT_PUBLIC_SOJ_API_BASE_URL` | browser: `/soj-api`, server/test: `http://localhost:8080` | Public API base. Keep unset for the built-in same-origin proxy. |
| `SOJ_API_INTERNAL_BASE_URL` | `http://localhost:8080` | Server-side and rewrite target for local backend calls. |

The Next.js rewrite maps:

```text
/soj-api/:path* -> ${SOJ_API_INTERNAL_BASE_URL}/:path*
```

This avoids browser CORS failures while the backend keeps its default noop CORS middleware.

## Backend Baseline

From the sibling backend repository:

```bash
cd ../SOJ
make down
make up
make smoke
```

The smoke script creates a user, problem, statement, testcase set, submission, contest, registration, contest submission, and scoreboard entry through the backend API.

## Frontend Commands

From `SOJ-web`:

```bash
npm run test
npm run lint
npm run lint:style
npm run typecheck
npm run build
```

Run the frontend against the backend:

```bash
NEXT_PUBLIC_SOJ_API_MODE=http npm run dev
```

Run the repeatable authoring-to-judge browser integration, which starts and cleans up the sibling SOJ Compose stack:

```bash
npm run test:e2e:http
```

Set `SOJ_BACKEND_DIR=/path/to/SOJ` when the repositories are not siblings. Set `SOJ_HTTP_REUSE_BACKEND=1` to reuse an already-running backend stack during local iteration.

Open `http://localhost:3000` and use these flows:

1. Register or login from `/auth/register` or `/auth/login`.
2. Open `/problems`, then a problem detail page.
3. Open a problem detail page and confirm the statement renders.
4. Select any enabled language from the public backend language catalog and submit source from the problem workspace.
5. Follow the success link to `/submissions/{id}`.
6. Open `/contests`, register for a contest, then enter its workspace.
7. Submit from the contest workspace and open the contest scoreboard.
8. Open `/manage/problems`, create a draft, save its statement, upload a testcase zip, run validation, and submit it for review.
9. Sign in as a reviewer (different account from the author) and open `/manage/reviews`. Approve the submitted problem, then reopen its detail page and confirm it is published. Repeat the flow with "Request changes" and confirm the author can edit it again.
10. Open `/manage/rejudge` as an operator, create a batch for the published problem, open the batch detail, and cancel its queued items while it is still queued or running.
11. Open `/admin/users` as an admin, search for a user, grant a global role with a reason, then revoke it. Confirm the form is disabled for the signed-in account itself.
12. Open a contest you own or manage and use the "Contest roles" entry to grant a contest role to another user, then revoke it.
13. Sign in as a user who only holds a contest-scoped role (no global `submission.rejudge`). Open that contest's detail page and confirm the "Rejudge contest" entry appears only for a manager or judge, then create a batch from `/contests/{id}/rejudge` and confirm the target is pinned to that contest.

## Expected Behavior

- Auth stores the access token in the browser session and `/me` loads with that token.
- Problem list/detail render backend problem, statement, stats, and limits.
- Language selection loads enabled backend judge language rows from the public language endpoint.
- Practice and contest submissions call backend create endpoints with `problem_id`, `contest_id`, `language_id`, and `source_code`.
- Submission detail loads from the browser session so protected backend visibility rules apply.
- Contest registration posts display name, email, and optional invite code.
- ACM scoreboard renders backend rows in HTTP mode.
- Direct publication before a valid current-testcase check returns `422 problem.check_required`.
- The authoring browser smoke submits only after validation; publication remains a separate reviewer decision.
- The review workbench, rejudge console, and role managers render a permission state instead of firing requests the session cannot make, so a signed-in account without the capability sees an explicit denial.
- Contest role administration is resolved from the contest owner, an existing contest-manager assignment, or an admin/root session, because contest roles never appear in the global permission list.

## RBAC Smoke Checklist

Run this against a backend that has the role seeds applied:

1. `user` can read problems and submit, but `/manage/problems`, `/manage/reviews`, `/manage/rejudge`, and `/admin/users` all show the permission state.
2. `author` reaches `/manage/problems`, can create a draft and submit it for review, and cannot decide a review.
3. `reviewer` reaches `/manage/reviews`, is refused when deciding a problem they own (`problem.self_review_forbidden`), and can approve another author's problem.
4. `operator` reaches `/manage/rejudge` and can create a problem-target batch; a non-operator gets `auth.forbidden`.
5. A user holding only `contest_judge` in one contest reaches that contest's rejudge entry but not `/manage/rejudge`, and is refused a contest target in a contest where they hold no role.
6. `admin` reaches every surface, including `/admin/users` and the contest role manager, and holds every entry in the 22-permission set.
7. `root` behaves like `admin`; the difference is operational, not a difference in permission set.

## Known Backend Contract Gaps

- OI/IOI scoreboard fields and Arena event feed fields are not available in OpenAPI yet.

These gaps are also tracked in `docs/development/openapi-inventory.md`.
