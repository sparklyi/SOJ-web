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

Open `http://localhost:3000` and use these flows:

1. Register or login from `/auth/register` or `/auth/login`.
2. Open `/problems`, then a problem detail page.
3. Open a problem detail page and confirm the statement renders.
4. Select any enabled language from the public backend language catalog and submit source from the problem workspace.
5. Follow the success link to `/submissions/{id}`.
6. Open `/contests`, register for a contest, then enter its workspace.
7. Submit from the contest workspace and open the contest scoreboard.

## Expected Behavior

- Auth stores the access token in the browser session and `/me` loads with that token.
- Problem list/detail render backend problem, statement, stats, and limits.
- Language selection loads enabled backend judge language rows from the public language endpoint.
- Practice and contest submissions call backend create endpoints with `problem_id`, `contest_id`, `language_id`, and `source_code`.
- Submission detail loads from the browser session so protected backend visibility rules apply.
- Contest registration posts display name, email, and optional invite code.
- ACM scoreboard renders backend rows in HTTP mode.

## Known Backend Contract Gaps

- OI/IOI scoreboard fields and Arena event feed fields are not available in OpenAPI yet.

These gaps are also tracked in `docs/development/openapi-inventory.md`.
