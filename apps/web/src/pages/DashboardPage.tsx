import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Search01Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Note01Icon,
  PlusSignIcon,
  Briefcase01Icon,
  UserIcon,
  Building01Icon,
  Wallet01Icon,
  UserSquareIcon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  CheckmarkSquare02Icon,
  Time02Icon,
  Folder01Icon,
} from "hugeicons-react";
import { pipelineStatuses } from "../status";
import type { ApplicationStatus, DashboardData } from "../types";
import {
  getInterviewReadinessSummary,
  selectInterviewReminders,
} from "./informationalInterviewHelpers";
import { MetricCard } from "../components/Cards";
import { Select, Table, Button } from "../components/ui";
import { DropdownMenu, DropdownMenuItem } from "../components/ui/DropdownMenu";
import { useAuth } from "../lib/auth";
import {
  useDashboardQuery,
  useExpenseSummaryQuery,
} from "../hooks/queries";

const fallbackData: DashboardData = {
  metrics: {
    activeApplications: 0,
    interviews: 0,
    offers: 0,
    responseRate: 0,
  },
  statusSummary: [],
  reminderSummary: {
    total: 0,
    overdue: 0,
    dueThisWeek: 0,
  },
  applications: [],
  upcomingTasks: [],
  informationalInterviews: [],
};

const weekdayFormatter = new Intl.DateTimeFormat("en-GB", { weekday: "long" });
const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long" });

function getTaskIcon(type: string) {
  switch (type.toLowerCase()) {
    case "interview":
      return <Calendar03Icon size={14} strokeWidth={1.5} />;
    case "document":
      return <Note01Icon size={14} strokeWidth={1.5} />;
    case "deadline":
      return <Time02Icon size={14} strokeWidth={1.5} />;
    case "recruiter":
    case "contact":
    case "thank-you":
    case "action item":
    case "follow-up":
    default:
      return <CheckmarkCircle02Icon size={14} strokeWidth={1.5} />;
  }
}

function getStatusBadgeStyle(status: ApplicationStatus): { dot: string; bg: string; text: string } {
  switch (status) {
    case "Saved":
      return { dot: "#6b6760", bg: "#f6f5f2", text: "#57544e" };
    case "Applied":
      return { dot: "#3570c4", bg: "#eff6ff", text: "#3570c4" };
    case "Interview":
      return { dot: "#7652c2", bg: "#f5f3ff", text: "#7652c2" };
    case "Offer":
      return { dot: "#25754b", bg: "#ecfdf5", text: "#25754b" };
    case "Closed":
      return { dot: "#b23c30", bg: "#fef2f2", text: "#b23c30" };
    case "Preparing":
      return { dot: "#8f5e0e", bg: "#fffbeb", text: "#8f5e0e" };
    default:
      return { dot: "#6b6760", bg: "#f6f5f2", text: "#57544e" };
  }
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
  } = useDashboardQuery();

  const {
    data: expenseSummary,
    isLoading: expenseSummaryLoading,
  } = useExpenseSummaryQuery();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeTab, setActiveTab] = useState<"upcoming" | "overdue" | "all">("upcoming");

  const dashboard = dashboardData ?? fallbackData;
  const data: DashboardData = dashboard;
  const loading = dashboardLoading;

  const now = new Date();
  const hour = now.getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user?.name ? user.name.split(" ")[0] : "there";
  const dateStr = `${weekdayFormatter.format(now)}, ${dateFormatter.format(now)}`;

  const filteredApplications = useMemo(() => {
    let result = data.applications;

    if (statusFilter !== "All") {
      result = result.filter(
        (app) => app.status === statusFilter,
      );
    }

    const search = query.trim().toLowerCase();

    if (search) {
      result = result.filter((application) =>
        [
          application.company,
          application.position,
          application.location,
          application.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search),
      );
    }

    return result;
  }, [data.applications, query, statusFilter]);

  const interviewReminders = useMemo(
    () => selectInterviewReminders(data.upcomingTasks),
    [data.upcomingTasks],
  );

  const readiness = useMemo(
    () =>
      getInterviewReadinessSummary(
        data.informationalInterviews,
      ),
    [data.informationalInterviews],
  );

  const filteredTasks = useMemo(() => {
    if (activeTab === "overdue") {
      return data.upcomingTasks.filter((t) => t.overdue);
    }
    if (activeTab === "upcoming") {
      return data.upcomingTasks.filter((t) => !t.overdue);
    }
    return data.upcomingTasks;
  }, [data.upcomingTasks, activeTab]);

  return (
    <div className="space-y-5">
      {/* Page Header (.ph) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between pb-1">
        <div>
          <h1 className="text-[23px] font-semibold text-[#1d1c1a] tracking-tight leading-tight m-0">
            {greet}, {firstName}
          </h1>
          <p className="mt-1 text-[13.5px] text-[#57544e]">
            <span className="font-variant-numeric tabular-nums text-[#1d1c1a] font-medium">{dateStr}</span> · Here's what's happening across your pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            onClick={() => navigate({ to: "/informational-interviews" })}
            className="!h-[30px] !px-3 !text-[12.5px] !font-medium !rounded-lg border border-[#dad7d0] bg-white text-[#1d1c1a] hover:bg-[#f6f5f2] shadow-sm inline-flex items-center gap-1.5 transition-colors"
          >
            <UserSquareIcon size={14} strokeWidth={1.5} />
            <span>Prep interview</span>
          </Button>

          <DropdownMenu
            align="end"
            trigger={
              <Button
                variant="primary"
                className="!h-[30px] !px-3 !text-[12.5px] !font-medium !rounded-lg bg-[#0a5c4d] hover:bg-[#07473b] text-white border-0 shadow-sm inline-flex items-center gap-1.5 transition-colors"
              >
                <PlusSignIcon size={14} strokeWidth={2} />
                <span>New opportunity</span>
              </Button>
            }
          >
            <DropdownMenuItem onClick={() => navigate({ to: "/applications" })}>
              <Briefcase01Icon size={14} strokeWidth={1.5} className="mr-2 text-[#57544e]" />
              <span>Application</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/contacts" })}>
              <UserIcon size={14} strokeWidth={1.5} className="mr-2 text-[#57544e]" />
              <span>Contact</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/employers" })}>
              <Building01Icon size={14} strokeWidth={1.5} className="mr-2 text-[#57544e]" />
              <span>Employer</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/informational-interviews" })}>
              <UserSquareIcon size={14} strokeWidth={1.5} className="mr-2 text-[#57544e]" />
              <span>Interview</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/expenses" })}>
              <Wallet01Icon size={14} strokeWidth={1.5} className="mr-2 text-[#57544e]" />
              <span>Expense</span>
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
      </div>

      {/* Connected Overview Metric Stats Bar (.stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#e9e7e2] rounded-[10px] overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-[#e9e7e2] bg-white shadow-[0_1px_2px_rgba(28,25,20,0.04)]">
        <MetricCard
          label="Active applications"
          value={data.metrics.activeApplications}
          detail={`${data.applications.length} total opportunities`}
          accent="teal"
        />

        <MetricCard
          label="Interviews"
          value={data.metrics.interviews}
          detail="In review & interview stage"
          accent="violet"
        />

        <MetricCard
          label="Response rate"
          value={data.metrics.responseRate}
          suffix="%"
          detail="Across submitted applications"
          accent="amber"
        />

        <MetricCard
          label="Offers"
          value={data.metrics.offers}
          detail={data.metrics.offers ? "Offer-stage applications" : "Keep building momentum"}
          accent="blue"
        />
      </div>

      {/* Main Grid (.grid2): Primary Left Stack & Secondary Right Stack */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        {/* Left Column: Applications Table Panel */}
        <div className="flex flex-col gap-4 min-w-0">
          <section className="bg-white border border-[#e9e7e2] rounded-[10px] shadow-[0_1px_2px_rgba(28,25,20,0.04)] min-w-0">
            {/* Panel Header */}
            <div className="flex items-center justify-between gap-3 px-3.5 py-3 border-b border-[#e9e7e2]">
              <div className="flex items-center gap-2">
                <Folder01Icon size={16} strokeWidth={1.5} className="text-[#57544e]" />
                <h2 className="text-[13.5px] font-semibold text-[#1d1c1a] m-0">Applications Portfolio</h2>
                <span className="text-[11px] font-medium text-[#6b6760] bg-[#f6f5f2] border border-[#e9e7e2] px-2 py-0.5 rounded-[5px] tabular-nums">
                  {filteredApplications.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/applications"
                  className="text-[12px] font-medium text-[#57544e] hover:text-[#1d1c1a] inline-flex items-center gap-1 transition-colors"
                >
                  <span>View all</span>
                  <ArrowRight01Icon size={13} strokeWidth={1.5} />
                </Link>
              </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="p-3 bg-[#fbfaf8] border-b border-[#e9e7e2] flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              <div className="w-full sm:w-[200px]">
                <Select
                  aria-label="Filter applications by status"
                  value={statusFilter}
                  onValueChange={(val) => val && setStatusFilter(val)}
                  className="w-full"
                  items={{
                    All: `All (${data.applications.length})`,
                    ...Object.fromEntries(
                      pipelineStatuses.map((status) => [
                        status,
                        `${status} (${data.applications.filter((a) => a.status === status).length})`,
                      ]),
                    ),
                  }}
                />
              </div>

              <div className="relative flex-1 sm:max-w-[260px]">
                <Search01Icon
                  size={14}
                  strokeWidth={1.5}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8c8880] pointer-events-none"
                />
                <input
                  type="text"
                  className="w-full h-[30px] pl-8 pr-3 text-[12.5px] rounded-[6px] border border-[#dad7d0] bg-white text-[#1d1c1a] placeholder:text-[#8c8880] focus:border-[#0a5c4d] focus:outline-none transition-colors"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter applications..."
                />
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="py-12 text-center text-xs text-[#6b6760]">
                Loading applications…
              </div>
            ) : filteredApplications.length ? (
              <div className="overflow-x-auto">
                <Table className="min-w-[540px]">
                  <Table.Header>
                    <Table.Row className="bg-white border-b border-[#e9e7e2]">
                      <Table.Head className="text-[12px] font-medium text-[#57544e] pl-3.5 py-2">Company</Table.Head>
                      <Table.Head className="text-[12px] font-medium text-[#57544e] py-2">Position</Table.Head>
                      <Table.Head className="text-[12px] font-medium text-[#57544e] py-2">Location</Table.Head>
                      <Table.Head className="text-[12px] font-medium text-[#57544e] py-2">Status</Table.Head>
                      <Table.Head className="text-[12px] font-medium text-[#57544e] pr-3.5 py-2 text-right">Deadline</Table.Head>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {filteredApplications.map((application) => {
                      const badge = getStatusBadgeStyle(application.status);
                      return (
                        <Table.Row
                          key={application.id}
                          className="hover:bg-[#f6f5f2] border-b border-[#f0eeea] transition-colors cursor-pointer"
                          onClick={() => navigate({ to: "/applications" })}
                        >
                          <Table.Cell className="pl-3.5 py-2.5 font-medium text-[#1d1c1a] text-[13px]">
                            {application.company}
                          </Table.Cell>

                          <Table.Cell className="py-2.5 text-[#57544e] text-[13px]">
                            {application.position}
                          </Table.Cell>

                          <Table.Cell className="py-2.5 text-[#6b6760] text-[12.5px]">
                            {application.location || "—"}
                          </Table.Cell>

                          <Table.Cell className="py-2.5">
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[5px] text-[11.5px] font-medium border border-[#e9e7e2]"
                              style={{ backgroundColor: badge.bg, color: badge.text }}
                            >
                              <span className="size-1.5 rounded-full" style={{ backgroundColor: badge.dot }} />
                              {application.status}
                            </span>
                          </Table.Cell>

                          <Table.Cell className="pr-3.5 py-2.5 text-right text-[12px] text-[#6b6760] font-variant-numeric tabular-nums">
                            {application.deadline
                              ? new Intl.DateTimeFormat("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                }).format(new Date(`${application.deadline}T12:00:00`))
                              : "—"}
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table>
              </div>
            ) : (
              <div className="py-12 text-center text-[12.5px] text-[#6b6760]">
                No applications matching filter.
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Stack Panels (.stack) */}
        <div className="flex flex-col gap-4 min-w-0">
          {/* Panel: Upcoming Schedule / Tasks with Segments */}
          <section className="bg-white border border-[#e9e7e2] rounded-[10px] shadow-[0_1px_2px_rgba(28,25,20,0.04)]">
            <div className="flex items-center justify-between gap-3 px-3.5 py-3 border-b border-[#e9e7e2]">
              <h2 className="text-[13.5px] font-semibold text-[#1d1c1a] m-0">Schedule & Reminders</h2>

              {/* Segmented Control (.seg) */}
              <div className="inline-flex p-0.5 rounded-[6px] bg-[#eeede9] gap-0.5 text-[11.5px] font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab("upcoming")}
                  className={`px-2 py-1 rounded-[5px] transition-colors cursor-pointer ${
                    activeTab === "upcoming"
                      ? "bg-white text-[#1d1c1a] shadow-[0_1px_2px_rgba(0,0,0,0.08)] font-semibold"
                      : "text-[#57544e] hover:text-[#1d1c1a]"
                  }`}
                >
                  Upcoming
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("overdue")}
                  className={`px-2 py-1 rounded-[5px] transition-colors cursor-pointer ${
                    activeTab === "overdue"
                      ? "bg-white text-[#b23c30] shadow-[0_1px_2px_rgba(0,0,0,0.08)] font-semibold"
                      : "text-[#57544e] hover:text-[#b23c30]"
                  }`}
                >
                  Overdue ({data.reminderSummary.overdue})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-2 py-1 rounded-[5px] transition-colors cursor-pointer ${
                    activeTab === "all"
                      ? "bg-white text-[#1d1c1a] shadow-[0_1px_2px_rgba(0,0,0,0.08)] font-semibold"
                      : "text-[#57544e] hover:text-[#1d1c1a]"
                  }`}
                >
                  All
                </button>
              </div>
            </div>

            <div className="p-3">
              <div className="flex flex-col divide-y divide-[#f0eeea]">
                {filteredTasks.slice(0, 5).map((task) => (
                  <Link
                    to={task.href ?? "/applications"}
                    key={task.id}
                    className="flex items-center gap-2.5 py-2 px-1 text-left no-underline hover:bg-[#f6f5f2] rounded-[6px] transition-colors"
                  >
                    <span className="text-[#57544e] shrink-0">
                      {getTaskIcon(task.type)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-[#1d1c1a] truncate">
                        {task.title}
                      </div>
                      <div className="text-[11.5px] text-[#6b6760] font-variant-numeric tabular-nums">
                        {task.due
                          ? new Intl.DateTimeFormat("en-GB", {
                              day: "numeric",
                              month: "short",
                            }).format(new Date(`${task.due}T12:00:00`))
                          : "No due date"}
                      </div>
                    </div>

                    <span
                      className={`text-[10.5px] font-medium px-2 py-0.5 rounded-[4px] border ${
                        task.overdue
                          ? "bg-[#fef2f2] text-[#b23c30] border-[#fecaca]"
                          : "bg-[#f6f5f2] text-[#57544e] border-[#e9e7e2]"
                      }`}
                    >
                      {task.priority ?? task.type}
                    </span>
                  </Link>
                ))}

                {!loading && filteredTasks.length === 0 && (
                  <div className="py-6 text-center text-xs text-[#6b6760]">
                    {activeTab === "overdue" ? "No overdue items. All on track!" : "No tasks in this view."}
                  </div>
                )}
              </div>

              {/* Career Readiness Subcard */}
              <div className="mt-3 p-3 rounded-[8px] bg-[#f7f6f3] border border-[#e9e7e2]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11.5px] font-semibold text-[#57544e] tracking-wider">
                    Interview Readiness
                  </span>
                  <Link
                    to="/informational-interviews"
                    className="text-[11px] font-medium text-[#0a5c4d] hover:underline"
                  >
                    Details
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white border border-[#e9e7e2] p-1.5 rounded-[6px]">
                    <div className="text-[10px] text-[#6b6760]">Interviews</div>
                    <div className="text-[13px] font-semibold text-[#1d1c1a] font-variant-numeric tabular-nums">{readiness.total}</div>
                  </div>
                  <div className="bg-white border border-[#e9e7e2] p-1.5 rounded-[6px]">
                    <div className="text-[10px] text-[#6b6760]">Thank-yous</div>
                    <div className="text-[13px] font-semibold text-[#1d1c1a] font-variant-numeric tabular-nums">{readiness.thankYouPending}</div>
                  </div>
                  <div className="bg-white border border-[#e9e7e2] p-1.5 rounded-[6px]">
                    <div className="text-[10px] text-[#6b6760]">Follow-ups</div>
                    <div className="text-[13px] font-semibold text-[#1d1c1a] font-variant-numeric tabular-nums">{readiness.followUps}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Panel: Informational Interviews */}
          <section className="bg-white border border-[#e9e7e2] rounded-[10px] shadow-[0_1px_2px_rgba(28,25,20,0.04)]">
            <div className="flex items-center justify-between gap-3 px-3.5 py-3 border-b border-[#e9e7e2]">
              <h2 className="text-[13.5px] font-semibold text-[#1d1c1a] m-0">Informational Interviews</h2>
              <Link
                to="/informational-interviews"
                className="text-[12px] font-medium text-[#57544e] hover:text-[#1d1c1a] inline-flex items-center gap-1 transition-colors"
              >
                <span>View all</span>
                <ArrowRight01Icon size={13} strokeWidth={1.5} />
              </Link>
            </div>

            <div className="p-3">
              {data.informationalInterviews.length ? (
                <div className="flex flex-col divide-y divide-[#f0eeea]">
                  {data.informationalInterviews.slice(0, 4).map((interview) => (
                    <div key={interview.id} className="py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium text-[#1d1c1a] truncate">
                          {interview.contactName}
                        </div>
                        <div className="text-[11.5px] text-[#6b6760] truncate">
                          {interview.role} {interview.company ? `· ${interview.company}` : ""}
                        </div>
                      </div>
                      <span className="text-[11px] text-[#6b6760] font-variant-numeric tabular-nums shrink-0">
                        {interview.scheduledFor
                          ? new Intl.DateTimeFormat("en-GB", {
                              day: "numeric",
                              month: "short",
                            }).format(new Date(interview.scheduledFor))
                          : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-5 text-center text-xs text-[#6b6760]">
                  No informational interviews logged yet.
                </div>
              )}
            </div>
          </section>

          {/* Panel: Expenses Overview */}
          <section className="bg-white border border-[#e9e7e2] rounded-[10px] shadow-[0_1px_2px_rgba(28,25,20,0.04)]">
            <div className="flex items-center justify-between gap-3 px-3.5 py-3 border-b border-[#e9e7e2]">
              <h2 className="text-[13.5px] font-semibold text-[#1d1c1a] m-0">Expense Tracking</h2>
              <Link
                to="/expenses"
                className="text-[12px] font-medium text-[#57544e] hover:text-[#1d1c1a] inline-flex items-center gap-1 transition-colors"
              >
                <span>Manage</span>
                <ArrowUpRight01Icon size={13} strokeWidth={1.5} />
              </Link>
            </div>

            <div className="p-3.5">
              <div className="flex items-baseline justify-between">
                <span className="text-[12px] text-[#6b6760]">Total job search expenses</span>
                <span className="text-[19px] font-semibold text-[#1d1c1a] font-variant-numeric tabular-nums">
                  {new Intl.NumberFormat("en-GB", {
                    style: "currency",
                    currency: "GBP",
                  }).format(expenseSummary?.total ?? 0)}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}