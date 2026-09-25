import {
  createRouter,
  createRoute,
  createRootRoute,
  Navigate,
  Outlet,
  useRouterState
} from "@tanstack/react-router";
import { SidebarLayout } from "./components/Sidebar";
import { DashboardPage } from "./pages/DashboardPage";
import { ApplicationsPage } from "./pages/ApplicationsPage";
import { EmployersPage } from "./pages/EmployersPage";
import { ContactsPage } from "./pages/ContactsPage";
import { InformationalInterviewsPage } from "./pages/InformationalInterviewsPage";

import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ProfilePage } from "./pages/ProfilePage";
import { useAuth } from "./lib/auth";
import { isPublicAuthPath, requiresLogin } from "./lib/auth-routing";

function RootComponent() {
  const { token, loading } = useAuth();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-app)]">
        <span className="page-loader" aria-hidden="true" />
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
  )
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: SignupPage
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage
});

const applicationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/applications",
  component: ApplicationsPage
});

const interviewsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/informational-interviews",
  component: InformationalInterviewsPage
});

const employersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/employers",
  component: EmployersPage
});

const contactsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contacts",
  component: ContactsPage
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  applicationsRoute,
  employersRoute,
  contactsRoute,
  interviewsRoute,
  profileRoute,
  loginRoute,
  signupRoute
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

