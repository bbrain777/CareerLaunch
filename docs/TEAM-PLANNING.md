# CareerLaunch Team Planning

## Meeting

- Schedule: Tuesdays at 6:00 PM UK time (BST) / 8:00 PM Uganda time (EAT), beginning September 22, 2026, so the team can stay aligned with course-required deadlines.
- Participants: Olakunle Obademi, Saleh Ntege, Alex Koje Okhitoya, and Samar Mohammed Walakabouh Salah Mahmoud Abbas

## Decisions for the first meeting

### 1. Minimum viable product

- Confirm the features required for the four-week MVP.
- Separate required features from optional enhancements.
- Confirm the features that are intentionally outside the project scope.

### 2. Technology stack

The Sprint 1 implementation uses the following agreed baseline:

- Frontend: React, TypeScript, and Vite
- Backend: Node.js, Express, and TypeScript
- Database and data access: PostgreSQL and Prisma
- Authentication: bcrypt password hashing and JSON Web Tokens
- File storage: managed cloud storage, to be selected in a later sprint
- Testing: Vitest, Supertest, and the Node test runner
- Deployment: cloud provider to be selected after the MVP workflows are integrated

### 3. Responsibilities

Each member owns implementation and reviews work that affects their area:

- Olakunle: architecture, CI, pull-request review, and integration
- Saleh: PostgreSQL/Prisma schema, migrations, seed data, and repositories
- Alex: React shell, account screens, responsive behavior, and accessibility
- Samar: authentication, API tests, setup documentation, and Trello maintenance

Each member should own meaningful implementation work while also reviewing teammates' pull requests.

### 4. Working agreements

- Communication channel: Microsoft Teams CareerLaunch channel and the Trello sprint board
- Expected response time: acknowledge team questions within one working day
- Pull-request reviewer: Olakunle coordinates review; the relevant feature owner also reviews cross-area changes
- Definition of done: tests and production builds pass, documentation is updated, and a teammate approves the pull request
- How blockers will be raised: post the blocker in Teams and on the relevant Trello card as soon as it is known

### 5. Sprint 1 tasks

- Repository and development setup: npm workspaces with separate React and Express applications
- Data model: Prisma/PostgreSQL foundation owned by Saleh
- Authentication and roles: authentication foundations owned by Samar; authorization continues in Sprint 2
- Application navigation: responsive shell and account screens owned by Alex
- Testing baseline: root test/build commands enforced by GitHub Actions
- Documentation: README, contribution workflow, architecture decisions, and sprint risks recorded

See `ARCHITECTURE.md` for the system boundaries, integration contract, definition of done, and current risks.

### Sprint 2 status

- Olakunle: integrated the authenticated application pipeline, owner-scoped application CRUD, dashboard metrics, and database-backed task data through PR #10.
- Samar: authenticated, owner-scoped employer and contact CRUD; input and follow-up validation; search; API tests; and setup/API documentation.
- Database integration: employers now carry an optional migration-safe `userId`; all newly created and seeded employers are owned, and legacy unowned rows are not returned by authenticated routes.
- Alex: completed the responsive application, employer, and contact screens; React Query integration; accessible delete-confirmation dialogs; authentication-screen refinements; and the Tailwind/Kumo design-system migration through PR #14. The root session loader includes a screen-reader status announcement.

### Sprint 2 remaining work

- Review and integrate Saleh's employer-ownership migration contract in PR #13, resolving any overlap with the employer ownership already used by the API before merging.
- Add browser or component tests for the application, employer, and contact create/edit/delete flows, validation errors, dialogs, and responsive navigation. Current automated web coverage verifies routing and status helpers but not the new interactive screens.
- Revisit frontend bundle size. The verified production build succeeds, but the main JavaScript bundle exceeds Vite's 500 kB warning threshold; route-based code splitting is the recommended next optimization.
- Confirm production `JWT_SECRET`, environment loading, deployment provider, and managed file-storage choice before a public release.
- Keep pull-request descriptions current with actual test commands, screenshots for interface changes, and clearly recorded follow-up work. Cross-area changes still require review from the relevant feature owner.

## Preserved prototype

The **prototype/dashboard** branch contains the runnable dashboard prototype created before responsibilities were assigned. It is a reference only. The team may reuse, revise, or reject its implementation after agreeing on the architecture.
