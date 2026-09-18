import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  useRouterState
} from "@tanstack/react-router";
import { SidebarLayout } from "./components/Sidebar";
import { DashboardPage } from "./pages/DashboardPage";
import { ApplicationsPage } from "./pages/ApplicationsPage";
import { InformationalInterviewsPage } from "./pages/InformationalInterviewsPage";

import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ProfilePage } from "./pages/ProfilePage";

function RootComponent() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  if (isAuthRoute) {
    return <Outlet />;
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

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  applicationsRoute,
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

