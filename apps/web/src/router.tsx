import React, { Suspense, lazy } from "react";
import {
  createRouter,
  createRoute,
  createRootRoute,
  Navigate,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { SidebarLayout } from "./components/Sidebar";
import { useAuth } from "./lib/auth";
import { isPublicAuthPath, requiresLogin } from "./lib/auth-routing";

const DashboardPage = lazy(() => import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const ApplicationsPage = lazy(() => import("./pages/ApplicationsPage").then((m) => ({ default: m.ApplicationsPage })));
const EmployersPage = lazy(() => import("./pages/EmployersPage").then((m) => ({ default: m.EmployersPage })));
const ContactsPage = lazy(() => import("./pages/ContactsPage").then((m) => ({ default: m.ContactsPage })));
const InformationalInterviewsPage = lazy(() => import("./pages/InformationalInterviewsPage").then((m) => ({ default: m.InformationalInterviewsPage })));
const InterviewPrepPage = lazy(() => import("./pages/InterviewPrepPage").then((m) => ({ default: m.InterviewPrepPage })));
const DocumentsPage = lazy(() => import("./pages/DocumentsPage").then((m) => ({ default: m.DocumentsPage })));
const ExpenseTrackingPage = lazy(() => import("./pages/ExpenseTrackingPage").then((m) => ({ default: m.ExpenseTrackingPage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import("./pages/SignupPage").then((m) => ({ default: m.SignupPage })));
const ProfilePage = lazy(() => import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));

function RouteFallback() {
  return (
    <div className="flex h-64 items-center justify-center" role="status" aria-live="polite">
      <span className="page-loader" aria-hidden="true" />
      <span className="sr-only">Loading page...</span>
    </div>
  );
}

function withSuspense(Component: React.ComponentType) {
  return function SuspenseWrapped() {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Component />
      </Suspense>
    );
  };
}

function RootComponent() {
  const { token, loading } = useAuth();

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  if (loading) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-app)]"
        role="status"
        aria-live="polite"
      >
        <span className="page-loader" aria-hidden="true" />
        <span className="sr-only">Checking your session</span>
      </div>
    );
  }

  if (requiresLogin(pathname, token, loading)) {
    return <Navigate to="/login" replace />;
  }

  if (isPublicAuthPath(pathname)) {
    return token ? <Navigate to="/" replace /> : <Outlet />;
  }

  return (
    <SidebarLayout>
      <Outlet />
    </SidebarLayout>
  );
}

const rootRoute = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => (
    <div style={{ padding: "40px" }}>
      <h2>Page Not Found</h2>
      <p>The page you requested could not be found.</p>
    </div>
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: withSuspense(LoginPage),
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: withSuspense(SignupPage),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: withSuspense(DashboardPage),
});

const applicationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/applications",
  component: withSuspense(ApplicationsPage),
});

const interviewsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/informational-interviews",
  component: withSuspense(InformationalInterviewsPage),
});

const interviewPrepRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/interview-prep",
  component: withSuspense(InterviewPrepPage),
});

const employersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/employers",
  component: withSuspense(EmployersPage),
});

const contactsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contacts",
  component: withSuspense(ContactsPage),
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: withSuspense(ProfilePage),
});

const documentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/documents",
  component: withSuspense(DocumentsPage),
});

const expensesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/expenses",
  component: withSuspense(ExpenseTrackingPage),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  applicationsRoute,
  employersRoute,
  contactsRoute,
  interviewsRoute,
  interviewPrepRoute,
  profileRoute,
  documentsRoute,
  expensesRoute,
  loginRoute,
  signupRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}