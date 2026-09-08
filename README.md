# CareerLaunch

CareerLaunch is a responsive web application for students and recent graduates to organize job opportunities, track applications from discovery through decision, and prepare for interviews.

The project combines Olakunle Obademi's CareerLaunch proposal with selected ideas from Saleh Ntege's BizTrack proposal. BizTrack-inspired features include employer and professional-contact records, business-style dashboard reporting, search and filtering, and job-search expense tracking.

## Team

- Olakunle Obademi (team lead) — [@bbrain777](https://github.com/bbrain777)
- Saleh Ntege — [@salehish](https://github.com/salehish)
- Alex Koje Okhitoya — [@lexmanthefirst](https://github.com/lexmanthefirst)
- Samar Mohammed Walakabouh Salah Mahmoud Abbas — [@sameljawabryBYUI](https://github.com/sameljawabryBYUI)

Synchronous meeting time: Saturdays at 6:00 PM UK time (BST) / 8:00 PM Uganda time (EAT).

## Local development

Requirements: Node.js 20 or newer.

From the repository root:

~~~powershell
npm.cmd install
npm.cmd run dev
~~~

Open **http://localhost:5173**. The web application runs on port 5173 and proxies API requests to the Express server on port 4000.

Run the automated tests:

~~~powershell
npm.cmd test
~~~

Create production builds:

~~~powershell
npm.cmd run build
~~~

### Project structure

- **apps/web** - React and TypeScript interface built with Vite
- **apps/api** - Express and TypeScript REST API

The current starter uses sample in-memory data so the team can run it immediately. PostgreSQL, Prisma, authentication, and persistent CRUD workflows will be added during the implementation sprints.

## Four-week MVP

- Secure registration, authentication, profiles, and authorization
- Job-application records and visual status pipeline
- Employer, recruiter, and professional-contact records
- Search, filtering, sorting, deadlines, follow-ups, and reminders
- Resume and cover-letter document organization
- Interview preparation and career-readiness resources
- Job-search expense tracking
- Dashboard analytics and basic administration
- Automated tests, accessibility review, documentation, and deployment

The MVP intentionally excludes a complete customer, inventory, product, sales, or accounting system, as well as job-board scraping, automatic applications, inbox access, employer accounts, external ATS integrations, and AI hiring decisions.

## Proposed technology

- React and TypeScript
- Node.js and Express
- PostgreSQL and Prisma
- JSON Web Tokens and securely hashed passwords
- Managed cloud file storage
- Automated testing, GitHub collaboration, and cloud deployment

## Development plan

1. Establish the repository, data model, authentication, roles, profiles, and navigation.
2. Build application, employer, and contact records; pipeline; search; filters; and dashboard.
3. Add reminders, documents, interview preparation, career resources, expenses, and analytics.
4. Complete administration, tests, accessibility review, deployment, and documentation.

## Team workflow

- Finalize the technology stack and responsibilities during the Saturday team meeting.
- Create a separate branch for each assigned feature.
- Open a pull request for team review before merging work into main.
- Use **prototype/dashboard** only as a preserved visual and technical reference.
- Keep **main** limited to agreed and reviewed team work.

See **docs/TEAM-PLANNING.md** for the meeting checklist and **CONTRIBUTING.md** for the branch and pull-request workflow.

## Course document

The submission-ready project-selection document is `CareerLaunch-Project-Selection-Team.docx`.

## Team Quotes

> "The only way to do great work is to love what you do." - Steve Jobs
> *(Added by Samar)*

> "Sight shows you what is. Vision shows you what can be." - Olakunle Tayo Obademi
> *(Added by Olakunle)*
