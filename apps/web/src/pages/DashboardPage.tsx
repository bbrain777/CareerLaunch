import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button, ButtonGroup, DropdownMenu } from "@cloudflare/kumo";
import { CaretDownIcon } from "@phosphor-icons/react";
import {
  Search01Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Note01Icon,
  PlusSignIcon
} from "hugeicons-react";
import { pipelineStatuses } from "../status";
import type { ApplicationStatus, DashboardData } from "../types";
import { MetricCard } from "../components/Cards";
import { Select, Table } from "../components/ui";
import { useAuth } from "../lib/auth";
import { useApplicationsQuery, useDashboardQuery, useTasksQuery } from "../hooks/queries";

const fallbackData: DashboardData = {
  metrics: {
    activeApplications: 0,
    interviews: 0,
    offers: 0,
    responseRate: 0
  },
  applications: [],
  upcomingTasks: [],
  informationalInterviews: []
};

const todayLabel = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long"
}).format(new Date());

function getTaskIcon(type: string) {
  switch (type.toLowerCase()) {
    case "interview":
      return <Calendar03Icon size={16} />;
    case "document":
      return <Note01Icon size={16} />;
    case "follow-up":
    default:
      return <CheckmarkCircle02Icon size={16} />;
  }
}

function pillClass(status: ApplicationStatus): string {
  switch (status) {
    case "Saved": return "bg-slate-100 text-slate-600";
    case "Applied": return "bg-blue-50 text-blue-700";
    case "Interview": return "bg-violet-50 text-violet-700";
    case "Offer": return "bg-emerald-50 text-emerald-700";
    case "Closed": return "bg-red-50 text-red-700";
    case "Preparing": return "bg-amber-50 text-amber-700";
    default: return "bg-slate-100 text-slate-600";
  }
}

function taskIconClass(type: string): string {
  switch (type.toLowerCase()) {
    case "interview": return "text-violet-700 bg-violet-100";
    case "follow-up": return "text-blue-700 bg-blue-100";
    case "document": return "text-amber-700 bg-amber-100";
    default: return "text-gray-600 bg-gray-200";
  }
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboardQuery();
  const {
    data: applications = [],
    isLoading: applicationsLoading,
  } = useApplicationsQuery();
  const {
    data: tasks = [],
    isLoading: tasksLoading,
  } = useTasksQuery();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const dashboard = dashboardData ?? fallbackData;
  const activeStatuses = new Set<ApplicationStatus>(["Saved", "Preparing", "Applied", "Interview"]);
  const data: DashboardData = {
    ...dashboard,
    applications,
    upcomingTasks: tasks,
    metrics: {
      ...dashboard.metrics,
      activeApplications: applications.filter((application) => activeStatuses.has(application.status)).length,
      interviews: applications.filter((application) => application.status === "Interview").length,
      offers: applications.filter((application) => application.status === "Offer").length,
    },
  };
  const loading = dashboardLoading || applicationsLoading || tasksLoading;
  const firstName = user?.name ? user.name.split(" ")[0] : "there";

  const filteredApplications = useMemo(() => {
    let result = data.applications;
    if (statusFilter !== "All") {
      result = result.filter((app) => app.status === statusFilter);
    }
    const search = query.trim().toLowerCase();
    if (search) {
      result = result.filter((application) =>
        [application.company, application.position, application.location, application.status]
          .join(" ")
          .toLowerCase()
          .includes(search)
      );
    }
    return result;
  }, [data.applications, query, statusFilter]);

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="min-w-0">
          <span className="mb-0.5 block text-[12px] font-medium text-[var(--text-muted)]">{todayLabel}</span>
          <h1 className="truncate">Welcome back{user?.name ? `, ${firstName}` : ""}</h1>
        </div>
        <div className="shrink-0">
          <ButtonGroup aria-label="Create options">
            <Button
              variant="primary"
              onClick={() => navigate({ to: "/applications" })}
              className="!h-8.5 !px-2.5 sm:!px-3 !text-[13px] !font-medium inline-flex items-center gap-1.5"
            >
              <PlusSignIcon size={14} />
              <span>Create</span>
            </Button>
            <DropdownMenu>
              <DropdownMenu.Trigger
                render={
                  <Button
                    variant="primary"
                    shape="square"
                    aria-label="More create options"
                    className="!h-8.5 !w-8 !p-0 flex items-center justify-center"
                  >
                    <CaretDownIcon size={14} />
                  </Button>
                }
              />
              <DropdownMenu.Content>
                <DropdownMenu.Item onClick={() => navigate({ to: "/applications" })}>
                  Application
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={() => navigate({ to: "/contacts" })}>
                  Contact
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={() => navigate({ to: "/employers" })}>
                  Employer
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={() => navigate({ to: "/informational-interviews" })}>
                  Interview
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          </ButtonGroup>
        </div>
      </header>


      <section className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" aria-label="Application summary">
        <MetricCard
          label="Active applications"
          value={data.metrics.activeApplications}
          detail="Across four pipeline stages"
          accent="teal"
        />
        <MetricCard
          label="Interviews"
          value={data.metrics.interviews}
          detail="One scheduled tomorrow"
          accent="violet"
        />
        <MetricCard
          label="Response rate"
          value={data.metrics.responseRate}
          suffix="%"
          detail="Up 5% this month"
          accent="amber"
        />
        <MetricCard
          label="Offers"
          value={data.metrics.offers}
          detail="Keep building momentum"
          accent="blue"
        />
      </section>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,2.3fr)_minmax(300px,1fr)]">
        <section className="rounded-2xl bg-white p-4 sm:p-6 border-0 ring-0 min-w-0" id="applications">
          <div className="mb-[18px] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:w-[220px] sm:flex-none">
              <Select
                aria-label="Filter applications by status"
                value={statusFilter}
                onValueChange={(val) => val && setStatusFilter(val)}
                className="w-full"
                items={{
                  All: `All applications (${applications.length})`,
                  ...Object.fromEntries(
                    pipelineStatuses.map((status) => [
                      status,
                      `${status} (${applications.filter((a) => a.status === status).length})`
                    ])
                  )
                }}
              />
            </div>

            <label className="flex w-full items-center gap-2 rounded-xl bg-gray-100/90 px-3.5 py-2 sm:w-[280px] md:w-[320px] text-gray-400 focus-within:ring-2 focus-within:ring-[#0a5c4d]/20 transition-all">
              <span className="sr-only">Search applications</span>
              <Search01Icon size={16} className="shrink-0 text-gray-500" />
              <input
                type="text"
                className="bg-transparent border-0 outline-none ring-0 shadow-none p-0 text-sm w-full text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:border-0"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search applications"
              />
            </label>
          </div>

          {loading ? (
            <div className="page-loading">
              <span className="page-loader" aria-hidden="true" />
              <span>Loading opportunities</span>
            </div>
          ) : filteredApplications.length ? (
            <div className="w-full overflow-x-auto pb-2">
              <Table className="min-w-[580px]">
                <Table.Header>
                  <Table.Row>
                    <Table.Head className="min-w-[140px]">Company</Table.Head>
                    <Table.Head className="min-w-[140px]">Position</Table.Head>
                    <Table.Head className="min-w-[120px]">Location</Table.Head>
                    <Table.Head className="min-w-[100px]">Status</Table.Head>
                    <Table.Head className="min-w-[100px]">Deadline</Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filteredApplications.map((application) => (
                    <Table.Row key={application.id}>
                      <Table.Cell className="font-medium text-gray-900">
                        {application.company}
                      </Table.Cell>
                      <Table.Cell>{application.position}</Table.Cell>
                      <Table.Cell>{application.location || "—"}</Table.Cell>
                      <Table.Cell>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium ${pillClass(application.status)}`}>
                          {application.status}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        {application.deadline
                          ? new Intl.DateTimeFormat("en-GB", {
                              day: "numeric",
                              month: "short",
                            }).format(new Date(`${application.deadline}T12:00:00`))
                          : "—"}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </div>
          ) : (
            <p className="px-4 py-12 text-center text-sm text-gray-500">No applications found matching your search.</p>
          )}
        </section>

        <div className="grid gap-5 min-w-0">
          <aside className="rounded-2xl bg-white p-4 sm:p-6 border-0 ring-0">
            <div className="mb-[18px] flex items-center justify-between gap-4">
              <div>
                <span className="mb-0.5 block text-[12px] font-medium text-[var(--text-muted)]">Stay on schedule</span>
                <h2>Upcoming</h2>
              </div>
              <button className="inline-flex items-center rounded-lg border-0 bg-transparent px-2 py-1 text-xs font-semibold text-[var(--primary)] hover:bg-[rgba(10,92,77,0.08)] cursor-pointer" type="button">View all</button>
            </div>
            <div className="grid gap-2.5">
              {data.upcomingTasks.map((task) => (
                <article className="grid grid-cols-[32px_1fr] items-center gap-2.5 rounded-xl bg-gray-50 p-2.5" key={task.id}>
                  <span className={`grid size-8 place-items-center rounded-lg text-[12px] font-semibold ${taskIconClass(task.type)}`}>
                    {getTaskIcon(task.type)}
                  </span>
                  <div>
                    <strong className="block text-[14px] font-medium">{task.title}</strong>
                    <span className="text-[12px] text-gray-500">
                      {task.due
                        ? new Intl.DateTimeFormat("en-GB", {
                            day: "numeric",
                            month: "short",
                          }).format(new Date(`${task.due}T12:00:00`))
                        : "No due date"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-gray-50 p-4">
              <span className="mb-0.5 block text-xs font-medium text-kumo-subtle">Interview preparation</span>
              <p className="mt-1 mb-3 text-sm text-gray-700">Review questions and build a focused checklist.</p>
              <Link to="/informational-interviews" className="inline-flex w-full h-10 items-center justify-center rounded-xl bg-[#0a5c4d] hover:bg-[#07473b] active:scale-[0.98] px-4 text-xs font-semibold text-white no-underline">
                Start preparing
              </Link>
            </div>
          </aside>

          <section className="rounded-2xl bg-white p-4 sm:p-6 border-0 ring-0 min-w-0" id="informational-interviews">
            <div className="mb-[18px] flex items-center justify-between gap-4">
              <div>
                <span className="mb-0.5 block text-xs font-medium text-kumo-subtle">Professional relationships</span>
                <h2>Informational interviews</h2>
              </div>
              <Link to="/informational-interviews" className="inline-flex items-center rounded-lg border-0 bg-transparent px-2.5 py-1 text-xs font-semibold text-[#0a5c4d] no-underline hover:bg-[#0a5c4d]/10">
                View all
              </Link>
            </div>
            {data.informationalInterviews.length ? (
              <div className="w-full overflow-x-auto pb-2">
                <Table className="min-w-[360px]">
                  <Table.Header>
                    <Table.Row>
                      <Table.Head className="min-w-[120px]">Contact</Table.Head>
                      <Table.Head className="min-w-[140px]">Company / role</Table.Head>
                      <Table.Head className="min-w-[100px]">Date</Table.Head>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {data.informationalInterviews.map((interview) => (
                      <Table.Row key={interview.id}>
                        <Table.Cell className="font-medium text-gray-900">
                          {interview.contactName}
                        </Table.Cell>
                        <Table.Cell>
                          {interview.role} {interview.company ? `(${interview.company})` : ""}
                        </Table.Cell>
                        <Table.Cell className="whitespace-nowrap">
                          {interview.scheduledFor
                            ? new Intl.DateTimeFormat("en-GB", {
                                day: "numeric",
                                month: "short",
                              }).format(new Date(interview.scheduledFor))
                            : "—"}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </div>
            ) : (
              <p className="px-4 py-12 text-center text-sm text-gray-500">No informational interviews recorded yet.</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
