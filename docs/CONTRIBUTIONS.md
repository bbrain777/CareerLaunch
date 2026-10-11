# CareerLaunch Contribution and Ownership Record

## Purpose and attribution method

This document records work that was actually delivered, rather than only the responsibilities proposed at the start of the project. It is based on the Git history through 9 October 2026, pull-request merges, and the files changed by the cited commits.

Authorship, review, integration, and release ownership are recorded separately. A merge or corrective integration does not transfer authorship of a teammate's original feature. Likewise, integration work is a substantial contribution when it resolves conflicts, completes missing cross-layer behavior, restores tests, produces a safe migration, or delivers the feature to production.

## Olakunle Tayo Obademi — team lead and principal integrator

Olakunle contributed across product definition, frontend, backend, database, testing, documentation, security, and deployment. His verified work includes:

- Originated the CareerLaunch project, organized the team, maintained the project plan, and established the repository and contribution workflow.
- Created the first runnable React, Express, and TypeScript monorepo, including the initial dashboard, API, shared types, styling, tests, and root workspace commands ([`96a9b96`](https://github.com/bbrain777/CareerLaunch/commit/96a9b96)).
- Established the architecture record and GitHub Actions CI workflow and repaired the web test command for CI ([`5a87190`](https://github.com/bbrain777/CareerLaunch/commit/5a87190), [`f832283`](https://github.com/bbrain777/CareerLaunch/commit/f832283)).
- Integrated authentication with the PostgreSQL application pipeline, completed owner-scoped application CRUD, connected dashboard metrics, added database-backed task routes, and completed the application create/edit/delete workflow ([`ba70f4c`](https://github.com/bbrain777/CareerLaunch/commit/ba70f4c), [`3c6b585`](https://github.com/bbrain777/CareerLaunch/commit/3c6b585)).
- Corrected and completed owner-scoped employer and contact workflows, including schema/migration integration, repositories, validation, security tests, and documentation ([`b5057e4`](https://github.com/bbrain777/CareerLaunch/commit/b5057e4)).
- Built the authenticated dashboard aggregation and reminder system, with metrics, urgency ordering, cache refreshes, and acceptance tests ([`9ef0f36`](https://github.com/bbrain777/CareerLaunch/commit/9ef0f36)).
- Implemented the end-to-end informational-interview workflow across schema, migration, repository, API, tests, queries, UI, and dashboard integration ([`c982508`](https://github.com/bbrain777/CareerLaunch/commit/c982508)).
- Added PostgreSQL-backed profile fields and profile update persistence ([`bce892c`](https://github.com/bbrain777/CareerLaunch/commit/bce892c)).
- Added the safe user-specific demonstration seed and the private, owner-scoped resume and cover-letter storage workflow using Vercel Blob ([`9aea0a7`](https://github.com/bbrain777/CareerLaunch/commit/9aea0a7), [`e1af483`](https://github.com/bbrain777/CareerLaunch/commit/e1af483)).
- Integrated expense tracking across the database contract, migration, repository, API, tests, dashboard, and web page; Samar later completed and hardened the R7 feature branch ([`06c0626`](https://github.com/bbrain777/CareerLaunch/commit/06c0626), [PR #21](https://github.com/bbrain777/CareerLaunch/pull/21)).
- Added application sorting and deadline filters with automated tests and restricted production CORS origins with API coverage ([`850bdb9`](https://github.com/bbrain777/CareerLaunch/commit/850bdb9), [`b01fcaa`](https://github.com/bbrain777/CareerLaunch/commit/b01fcaa)).
- Configured the Vercel production architecture, serverless API routing, environment handling, and shared Neon configuration; connected `main` to automatic production deployments ([`12e9800`](https://github.com/bbrain777/CareerLaunch/commit/12e9800), [`37041e6`](https://github.com/bbrain777/CareerLaunch/commit/37041e6)).
- Led pull-request review and cross-branch integration throughout the project. This included restoring the complete test suite after generated tooling polluted a branch and correcting Saleh's R6 integration by preserving the current schema, regenerating an additive migration, adding storage ownership validation, running the production migration, and deploying the result ([`376e0a0`](https://github.com/bbrain777/CareerLaunch/commit/376e0a0), [`4666499`](https://github.com/bbrain777/CareerLaunch/commit/4666499)).

These contributions make “architecture and integration” alone an incomplete description of Olakunle's role. He was also a major feature implementer and the release/deployment owner.

## Saleh Ntege — backend and data-contract contributor

- Implemented the initial PostgreSQL application repository, application routes, and repository tests ([`28e251b`](https://github.com/bbrain777/CareerLaunch/commit/28e251b), [`8241bb9`](https://github.com/bbrain777/CareerLaunch/commit/8241bb9)).
- Added the employer-ownership contract changes and contributed dashboard application aggregations ([`8cbf092`](https://github.com/bbrain777/CareerLaunch/commit/8cbf092), [`38b27e4`](https://github.com/bbrain777/CareerLaunch/commit/38b27e4)).
- Implemented the original R6 career-document metadata and job-interview-preparation repositories, routes, and tests. Olakunle later corrected and integrated this work into the current schema and production migration ([`eb74558`](https://github.com/bbrain777/CareerLaunch/commit/eb74558), [`4666499`](https://github.com/bbrain777/CareerLaunch/commit/4666499)).

## Alex Koje Okhitoya — frontend application and interaction contributor

- Built the TanStack Router and React Query application shell, authentication flow, protected routes, and polished account experience ([`f692f60`](https://github.com/bbrain777/CareerLaunch/commit/f692f60)).
- Migrated the interface to Tailwind and Kumo design tokens; implemented responsive navigation, reusable UI components, dialogs, accessibility refinements, query handling, and application/employer/contact screens ([PR #14](https://github.com/bbrain777/CareerLaunch/pull/14)).
- Added entity detail views, informational-interview validation and helpers, dashboard readiness summaries, reminder presentation, and related web tests ([`debd560`](https://github.com/bbrain777/CareerLaunch/commit/debd560)).

## Samar Mohammed Walakabouh Salah Mahmoud Abbas — authentication, API, security, and R7 contributor

- Implemented the initial authentication endpoints, JWT middleware, authentication tests, and setup documentation ([`d66ddd7`](https://github.com/bbrain777/CareerLaunch/commit/d66ddd7)).
- Implemented and refined authenticated employer/contact authorization, validation, follow-up behavior, tests, and API documentation. Olakunle later completed the cross-layer owner-scoped integration ([`1e7177d`](https://github.com/bbrain777/CareerLaunch/commit/1e7177d), [`1c2a457`](https://github.com/bbrain777/CareerLaunch/commit/1c2a457), [`b5057e4`](https://github.com/bbrain777/CareerLaunch/commit/b5057e4)).
- Expanded Sprint 3 security and authorization coverage ([`56b0406`](https://github.com/bbrain777/CareerLaunch/commit/56b0406)).
- Completed the R7 expense-tracking migration, owner-scoped expense API, React expense page, refresh-token endpoint, minimum administrator authorization, CORS/error hardening, component-test configuration, and release documentation ([PR #21](https://github.com/bbrain777/CareerLaunch/pull/21)).

## Shared ownership principle

CareerLaunch contains several jointly delivered areas. The application pipeline, employer/contact security, expense tracking, and R6 career-readiness backend each contain original work from one teammate and substantial integration or completion work from another. Project documentation should name both kinds of contribution instead of assigning an entire feature to only one person.
