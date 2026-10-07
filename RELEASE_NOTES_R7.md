# Release Notes: Sprint 4 - R7 Expense Tracking & Security Hardening

## Overview
Sprint 4 delivers the comprehensive **R7 Expense Tracking** feature for the CareerLaunch platform, empowering users to log, categorize, filter, and monitor career-related expenses directly from an authenticated dashboard widget and dedicated tracking page.

## Key Features & Deliverables
1. **Owner-Scoped Expense Architecture**: Added Prisma models, migrations, and repository operations with strict user ownership scoping.
2. **Backend API & Analytics**: Created authenticated endpoints for CRUD operations and expense summary queries grouped by category, secured with `requireAdmin` role-based middleware.
3. **Frontend Dashboard & UI**: Developed the `ExpenseTrackingPage` with real-time summary cards, empty/loading states, and search filtering.
4. **Security Hardening**: Restricted CORS origins and implemented global Express error-handling middleware.
5. **Testing Suite Infrastructure**: Unified the test runner configuration to cleanly execute utility tests (`tsx`) and React component tests (`vitest` + `jsdom`).
