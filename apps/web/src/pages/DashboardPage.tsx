import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Search01Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Note01Icon
} from "hugeicons-react";
import { pipelineStatuses } from "../status";
import type { DashboardData } from "../types";
import { MetricCard, ApplicationCard, InformationalInterviewCard } from "../components/Cards";
import { Button, Loader } from "../components/ui";
import { useAuth } from "../lib/auth";
import { useApplicationsQuery, useDashboardQuery } from "../hooks/queries";

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

export function DashboardPage() {
  const { user } = useAuth();
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useDashboardQuery();
  const {
    data: applications = [],
    isLoading: applicationsLoading,
    error: applicationsError,
  } = useApplicationsQuery();
  const [query, setQuery] = useState("");

  const dashboard = dashboardData || fallbackData;
  const activeStatuses = new Set(["Saved", "Preparing", "Applied", "Interview"]);
  const data: DashboardData = {
    ...dashboard,
    applications,
    metrics: {
      ...dashboard.metrics,
      activeApplications: applications.filter((application) => activeStatuses.has(application.status)).length,
      interviews: applications.filter((application) => application.status === "Interview").length,
      offers: applications.filter((application) => application.status === "Offer").length,
    },
  };
  const loading = dashboardLoading || applicationsLoading;
  const error = dashboardError || applicationsError
    ? "The API is unavailable. Confirm that both local servers are running and you are signed in."
    : "";
  const firstName = user?.name ? user.name.split(" ")[0] : "there";

  const filteredApplications = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return data.applications;

    return data.applications.filter((application) =>
      [application.company, application.position, application.location, application.status]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [data.applications, query]);

  return (
    <>
      <header className="topbar">
        <div>
          <span className="eyebrow">{todayLabel}</span>
          <h1>Welcome back{user?.name ? `, ${firstName}` : ""}</h1>
        </div>
        <Button variant="primary" className="topbar-add-btn">
          Add application
        </Button>
      </header>

      <section className="hero" id="dashboard">
        <div>
          <h2>Keep every opportunity moving forward</h2>
          <p>
            Track applications, prepare for interviews, and follow up with confidence.
          </p>
        </div>
        <div className="hero-stat">
          <span>This week</span>
          <strong>+2</strong>
          <small>new applications</small>
        </div>
      </section>

      {error && <div className="error-banner" role="alert">{error}</div>}

      <section className="metrics" aria-label="Application summary">
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

      <div className="content-grid">
        <section className="panel" id="applications">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Application pipeline</span>
              <h2>Current opportunities</h2>
            </div>
            <label className="search-field">
              <span className="sr-only">Search applications</span>
              <Search01Icon size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search applications"
              />
            </label>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader size={24} aria-label="Loading opportunities" />
              <span className="text-xs text-[#6b7280]">Loading opportunities</span>
            </div>
          ) : (
            <div className="pipeline">
              {pipelineStatuses.slice(0, 4).map((status) => {
                const statusApplications = filteredApplications.filter(
                  (application) => application.status === status
                );
                return (
                  <div className="pipeline-column" key={status}>
                    <div className="column-heading">
                      <span className={"status-dot " + status.toLowerCase()} />
                      <h3>{status}</h3>
                      <span>{statusApplications.length}</span>
                    </div>
                    {statusApplications.length ? (
                      statusApplications.map((application) => (
                        <ApplicationCard application={application} key={application.id} />
                      ))
                    ) : (
                      <p className="empty-state" style={{ padding: "16px 4px", fontSize: "12px" }}>
                        No applications
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="right-rail">
          <aside className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Stay on schedule</span>
                <h2>Upcoming</h2>
              </div>
              <button className="text-button" type="button">View all</button>
            </div>
            <div className="task-list">
              {data.upcomingTasks.map((task) => (
                <article className="task" key={task.id}>
                  <span className={"task-icon " + task.type.toLowerCase()}>
                    {getTaskIcon(task.type)}
                  </span>
                  <div>
                    <strong>{task.title}</strong>
                    <span>{task.due}</span>
                  </div>
                </article>
              ))}
            </div>
            <div className="preparation-card">
              <span className="eyebrow">Interview preparation</span>
              <p>Review questions and build a focused checklist.</p>
              <Link to="/informational-interviews" className="primary-button" style={{ textDecoration: "none", width: "100%", textAlign: "center" }}>
                Start preparing
              </Link>
            </div>
          </aside>

          <section className="panel" id="informational-interviews">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Professional relationships</span>
                <h2>Informational interviews</h2>
              </div>
              <Link to="/informational-interviews" className="text-button" style={{ textDecoration: "none" }}>
                View all
              </Link>
            </div>
            <div className="interview-grid">
              {data.informationalInterviews.map((interview) => (
                <InformationalInterviewCard interview={interview} key={interview.id} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
