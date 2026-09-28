# Sprint 3 Olakunle Demo

## Goal

Show that the CareerLaunch dashboard now gives each signed-in user a live, private summary of their pipeline and the next work that needs attention.

## Demo flow

1. Sign in and open the dashboard.
2. Confirm the active-application, interview, response-rate, and offer metrics match the user's application records.
3. Point out the total, overdue, and due-this-week reminder indicators.
4. Show reminders for an application deadline and a recruiter or contact follow-up.
5. Open a reminder and confirm it routes to the related application, contact, or informational-interview workflow.
6. Create or edit an application or contact, return to the dashboard, and confirm the dashboard refreshes.
7. Sign in as another user and confirm the dashboard does not expose the first user's applications, contacts, or tasks.

## Acceptance checks

- Unauthenticated dashboard requests return `401`.
- Repository queries always use the user ID from the verified JWT, not a query-string value.
- Completed tasks are excluded from reminders.
- Overdue reminders sort before soon, upcoming, and undated reminders.
- Response rate is calculated from submitted applications that have reached a response stage.
- `npm.cmd test` passes.
- `npm.cmd run build` passes.

## Known follow-up

The production build still reports the existing JavaScript bundle-size warning. Route-based code splitting remains planned Sprint 4 work and does not block this feature.
