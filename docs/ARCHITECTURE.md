# CareerLaunch Architecture and Integration Decisions

## Sprint 1 baseline

CareerLaunch is an npm-workspaces monorepo with two independently buildable TypeScript applications:

- `apps/web`: React client built with Vite. During local development, Vite proxies `/api` requests to port 4000.
- `apps/api`: Express REST API. It owns HTTP validation, authentication, authorization, and access to application data.

The browser communicates only with the API. The web application must not connect directly to PostgreSQL or contain server secrets.

## Agreed technology stack

- Client: React, TypeScript, and Vite
- API: Node.js, Express, and TypeScript
- Database: PostgreSQL with the Prisma data contract
- Authentication: bcrypt password hashes and signed JSON Web Tokens
- Testing: Vitest and Supertest for the API; Node test runner for web helpers
- Continuous integration: GitHub Actions on pull requests and pushes to `main`

## Integration contract

- API routes use the `/api` prefix and return JSON.
- Successful responses use the most specific standard HTTP status code.
- Failed requests return a JSON object containing a `message` field.
- Protected requests send `Authorization: Bearer <token>`.
- Shared status values must match `apps/web/src/types.ts` until a shared package is introduced.
- Database and API changes should preserve the current client response shapes or update the client in the same pull request.
Current route foundations:

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/applications` (authenticated, PostgreSQL-backed)
- `GET /api/applications/:id` (authenticated, owner-scoped)
- `POST /api/applications` (authenticated; ownership comes from the JWT)
- `PATCH /api/applications/:id` (authenticated, owner-scoped)
- `DELETE /api/applications/:id` (authenticated, owner-scoped)
- `GET /api/tasks` (authenticated, owner-scoped follow-ups and application tasks)
- `GET /api/informational-interviews`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/profile`
- `GET /api/employers` & `POST /api/employers` (authenticated, owner-scoped validation)
- `PATCH /api/employers/:id` & `DELETE /api/employers/:id` (authenticated, owner-scoped)
- `GET /api/contacts` & `POST /api/contacts` (authenticated, owner-scoped, follow-up validation)
- `PATCH /api/contacts/:id` & `DELETE /api/contacts/:id` (authenticated, owner-scoped)

Employer and contact list routes accept an optional case-insensitive `search` query. Employer ownership is stored as `Employer.userId`; existing unowned rows remain inaccessible, while all API-created and seeded employers receive the authenticated owner. Contact requests may reference only an employer owned by the same user. Create and update routes construct allow-listed payloads, so clients cannot override `userId` or write unknown fields.

## Team ownership

- Olakunle: architecture, CI, pull-request review, and cross-branch integration
- Saleh: PostgreSQL/Prisma schema, migrations, seed data, and repositories
- Alex: React application shell, account screens, responsive behavior, and accessibility
- Samar: authentication endpoints, API tests, setup documentation, and sprint-board maintenance

Ownership identifies the primary implementer. Changes that affect another area require that owner's review.

## Definition of done

A change is ready to merge when:

1. It is implemented on a focused feature branch.
2. Relevant tests are added or updated.
3. `npm test` and `npm run build` pass locally and in GitHub Actions.
4. Setup or behavior changes are documented.
5. The pull request explains what changed, how it was tested, and any follow-up work.
6. At least one teammate reviews the pull request.

## Sprint 1 integration status and risks

The React and Express applications build successfully, and the automated API and web tests pass. Authentication is integrated at the route level.

Open items for later feature work:

- Authentication currently stores users in memory; Saleh and Samar must connect it to PostgreSQL.
- The JWT fallback secret is for local development only and must not be used in deployment.
- Environment-file loading and the production secret configuration still need to be finalized.
- Application, dashboard, and informational-interview routes currently expose sample data without ownership checks.
- The web account screens still need to be connected to the authentication API.
- Deployment and managed file storage choices are intentionally deferred to later sprints.

These risks do not block the Sprint 1 baseline, but the security items block a public production release.

## Sprint 2 application integration contract

The application pipeline now uses `/api/applications` as its canonical endpoint. The temporary
`/api/applications-db` path and the sample-data application route have been removed.

- Every application request requires `Authorization: Bearer <token>`.
- The API derives `userId` only from the verified JWT. A `userId` supplied in the query string or
  request body is ignored and cannot be used to access another user's records.
- Database statuses (`SAVED`, `PREPARING`, `APPLIED`, `INTERVIEW`, `OFFER`, `CLOSED`) are returned
  in the title-case values already used by the web pipeline.
- `deadline` and `appliedAt` are returned as `YYYY-MM-DD` strings or `null` so the client can render
  dates consistently without timezone shifts.
- Create and update requests accept the title-case client statuses or their uppercase database
  equivalents. Invalid statuses, dates, identifiers, and missing required fields return HTTP 400
  with a JSON `message`.
- Reads, updates, and deletes that do not match both the requested record and authenticated owner
  return HTTP 404.
- The web query client attaches the stored bearer token automatically. Application query and CRUD
  mutation hooks share one cache key, so successful changes invalidate and refresh the pipeline.
- The dashboard reads the same authenticated application query as the application page and derives
  active, interview, and offer totals from that dataset.
- The application page provides create, edit, status/deadline update, and delete controls backed by
  the authenticated CRUD endpoints. Successful mutations invalidate the shared application cache.
- Follow-up and application tasks come from the PostgreSQL `Task` model through `/api/tasks`; the
  dashboard no longer relies on sample task data for its upcoming-work list.
- When `DATABASE_URL` is configured, registration, login, and profile lookup use PostgreSQL users,
  so the JWT `userId` is the same foreign-key identity used by applications, contacts, and tasks.
  The in-memory user store remains available only for isolated development and automated tests that
  intentionally run without a database.
- Seeded development accounts use the password `password123`; production environments must use
  separately registered accounts and a strong `JWT_SECRET`.
