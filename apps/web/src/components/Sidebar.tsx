import { ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Home01Icon, Briefcase01Icon, UserSquareIcon, UserIcon, Logout01Icon, Building01Icon, Contact01Icon } from "hugeicons-react";
import { CaretUpDownIcon } from "@phosphor-icons/react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

import { DropdownMenu, DropdownMenuItem } from "@/components/ui/DropdownMenu";
import { AppLogo } from "@/components/AppLogo";
import { useAuth } from "@/lib/auth";

interface SidebarProps {
  children: ReactNode;
}

export function SidebarLayout({ children }: SidebarProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayName = user?.name || "User";
  const displayEmail = user?.email || "user@example.com";

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  return (
    <SidebarProvider defaultOpen width="18rem">
      <Sidebar side="left" variant="sidebar">
        <SidebarHeader>
          <Link to="/" className="brand" aria-label="CareerLaunch">
            <span className="brand-mark">
              <AppLogo size={28} color="white" />
            </span>
            <span className="brand-name">CareerLaunch</span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  icon={Home01Icon}
                  isActive={currentPath === "/"}
                  render={<Link to="/" />}
                >
                  Dashboard
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  icon={Briefcase01Icon}
                  isActive={currentPath === "/applications"}
                  render={<Link to="/applications" />}
                >
                  Applications
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  icon={Building01Icon}
                  isActive={currentPath === "/employers"}
                  render={<Link to="/employers" />}
                >
                  Employers
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  icon={Contact01Icon}
                  isActive={currentPath === "/contacts"}
                  render={<Link to="/contacts" />}
                >
                  Contacts
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  icon={UserSquareIcon}
                  isActive={currentPath === "/informational-interviews"}
                  render={<Link to="/informational-interviews" />}
                >
                  Interviews
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="sidebar-card mb-2">
            <span className="eyebrow">Weekly goal</span>
            <strong>3 of 5 applications</strong>
            <div className="progress-track" aria-label="60 percent of weekly goal">
              <span />
            </div>
            <p>Two more applications to reach your target.</p>
          </div>

          <div className="relative flex items-center gap-1 w-full pt-1">
            <SidebarMenu aria-label="User" className="min-w-0 flex-1">
              <SidebarMenuItem>
                <DropdownMenu
                  align="start"
                  side="top"
                  sideOffset={8}
                  className="w-56"
                  trigger={
                    <button
                      type="button"
                      className="user-footer-btn"
                      aria-label="Open user menu"
                    >
                      <div className="user-avatar-circle">
                        <UserIcon className="size-3.5" />
                      </div>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                        {displayName}
                      </span>
                      <CaretUpDownIcon className="size-4 shrink-0 text-[#9eb3ad]" weight="bold" />
                    </button>
                  }
                >
                  <div className="dropdown-user-header">
                    <p className="dropdown-user-name truncate">
                      {displayName}
                    </p>
                    <p className="dropdown-user-email truncate">
                      {displayEmail}
                    </p>
                  </div>
                  <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                    <UserIcon className="size-4 text-gray-500" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                    <Logout01Icon className="size-4 text-red-500 dark:text-red-400" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <div className="sidebar-trigger-bar hidden sm:flex">
          <SidebarTrigger />
        </div>
        <div className="main-content-container">
          {children}
        </div>
      </SidebarInset>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[62px] items-center justify-around border-t border-white/10 bg-[#0e1e1b]/95 backdrop-blur-md px-1 pb-[env(safe-area-inset-bottom,0px)] md:hidden" aria-label="Mobile Navigation">
        <Link to="/" className={`flex flex-1 flex-col items-center justify-center gap-0.5 p-1 text-[11px] font-medium text-[#9eb3ad] no-underline ${currentPath === "/" ? "text-white font-semibold" : "hover:text-white"}`}>
          <Home01Icon size={19} />
          <span>Dashboard</span>
        </Link>
        <Link to="/applications" className={`flex flex-1 flex-col items-center justify-center gap-0.5 p-1 text-[11px] font-medium text-[#9eb3ad] no-underline ${currentPath === "/applications" ? "text-white font-semibold" : "hover:text-white"}`}>
          <Briefcase01Icon size={19} />
          <span>Jobs</span>
        </Link>
        <Link to="/employers" className={`flex flex-1 flex-col items-center justify-center gap-0.5 p-1 text-[11px] font-medium text-[#9eb3ad] no-underline ${currentPath === "/employers" ? "text-white font-semibold" : "hover:text-white"}`}>
          <Building01Icon size={19} />
          <span>Employers</span>
        </Link>
        <Link to="/contacts" className={`flex flex-1 flex-col items-center justify-center gap-0.5 p-1 text-[11px] font-medium text-[#9eb3ad] no-underline ${currentPath === "/contacts" ? "text-white font-semibold" : "hover:text-white"}`}>
          <Contact01Icon size={19} />
          <span>Contacts</span>
        </Link>
        <Link to="/informational-interviews" className={`flex flex-1 flex-col items-center justify-center gap-0.5 p-1 text-[11px] font-medium text-[#9eb3ad] no-underline ${currentPath === "/informational-interviews" ? "text-white font-semibold" : "hover:text-white"}`}>
          <UserSquareIcon size={19} />
          <span>Interviews</span>
        </Link>
        <Link to="/profile" className={`flex flex-1 flex-col items-center justify-center gap-0.5 p-1 text-[11px] font-medium text-[#9eb3ad] no-underline ${currentPath === "/profile" ? "text-white font-semibold" : "hover:text-white"}`}>
          <UserIcon size={19} />
          <span>Profile</span>
        </Link>
      </nav>
    </SidebarProvider>
  );
}

export { SidebarLayout as Sidebar };
