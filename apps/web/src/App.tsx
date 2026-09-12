import { useEffect, useMemo, useState } from "react";
import { formatStatus, pipelineStatuses } from "./status";
import type { DashboardData, InformationalInterview, JobApplication } from "./types";

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

function App() {
  const [data, setData] = useState<DashboardData>(fallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) {
          throw new Error("The dashboard request failed.");
        }
        setData((await response.json()) as DashboardData);
      } catch {
        setError("The API is unavailable. Confirm that both local servers are running.");
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, []);

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
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="CareerLaunch dashboard">
          <span className="brand-mark">CL</span>
          <span>CareerLaunch</span>
        </a>

        <nav aria-label="Primary navigation">
          <a className="nav-link active" href="#dashboard">
            <span aria-hidden="true">▦</span> Dashboard
          </a>
          <a className="nav-link" href="#applications">
            <span aria-hidden="true">⌁</span> Applications
          </a>
          <a className="nav-link" href="#contacts">
            <span aria-hidden="true">♙</span> Contacts
          </a>
          <a className="nav-link" href="#informational-interviews">
            <span aria-hidden="true">II</span> Informational interviews
          </a>
          <a className="nav-link" href="#documents">
            <span aria-hidden="true">▤</span> Documents
          </a>
          <a className="nav-link" href="#resources">
            <span aria-hidden="true">◇</span> Preparation
          </a>
        </nav>

        <div className="sidebar-card">
          <span className="eyebrow">Weekly goal</span>
          <strong>3 of 5 applications</strong>
          <div className="progress-track" aria-label="60 percent of weekly goal">
            <span />
          </div>
          <p>Two more applications to reach your target.</p>
        </div>
      </aside>

      <main id="top">
        <header className="topbar">
          <div>
            <span className="eyebrow">{todayLabel}</span>
            <h1>Welcome back, Olakunle</h1>
          </div>
          <button className="primary-button" type="button">
            <span aria-hidden="true">＋</span> Add application
          </button>
        </header>

        <section className="hero" id="dashboard">
          <div>
            <span className="hero-kicker">Your career command centre</span>
            <h2>Keep every opportunity moving forward.</h2>
            <p>
              Track applications, prepare for interviews, and follow up with confidence
              from one focused workspace.
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
          <section className="panel pipeline-panel" id="applications">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Application pipeline</span>
                <h2>Current opportunities</h2>
              </div>
              <label className="search-field">
                <span className="sr-only">Search applications</span>
                <span aria-hidden="true">⌕</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search applications"
                />
              </label>
            </div>

            {loading ? (
              <p className="empty-state">Loading opportunities…</p>
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
                        <div className="empty-column">No applications</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="panel tasks-panel">
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
                  <span className={"task-icon " + task.type.toLowerCase()}>✓</span>
                  <div>
                    <strong>{task.title}</strong>
                    <span>{task.due}</span>
                  </div>
                </article>
              ))}
            </div>
            <div className="preparation-card" id="resources">
              <span className="eyebrow">Interview preparation</span>
              <h3>Ready for your next conversation?</h3>
              <p>Review practice questions and build a focused preparation checklist.</p>
              <button type="button">Start preparing <span aria-hidden="true">→</span></button>
            </div>
          </aside>
        </div>

        <section className="panel interview-panel" id="informational-interviews">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Build professional relationships</span>
              <h2>Informational interviews</h2>
            </div>
            <button className="text-button" type="button">Add interview</button>
          </div>
          <div className="interview-grid">
            {data.informationalInterviews.map((interview) => (
              <InformationalInterviewCard interview={interview} key={interview.id} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  suffix?: string;
  detail: string;
  accent: string;
}

function MetricCard({ label, value, suffix = "", detail, accent }: MetricCardProps) {
  return (
    <article className={"metric-card " + accent}>
      <span>{label}</span>
      <strong>{value}{suffix}</strong>
      <small>{detail}</small>
    </article>
  );
}

function ApplicationCard({ application }: { application: JobApplication }) {
  const deadline = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short"
  }).format(new Date(application.deadline + "T12:00:00"));

  return (
    <article className="application-card">
      <span className="status-label">{formatStatus(application.status)}</span>
      <h4>{application.position}</h4>
      <strong>{application.company}</strong>
      <span className="location">{application.location}</span>
      <div className="card-footer">
        <span>Due {deadline}</span>
        <button type="button" aria-label={"Open " + application.position + " application"}>
          →
        </button>
      </div>
    </article>
  );
}

function InformationalInterviewCard({ interview }: { interview: InformationalInterview }) {
  const scheduledFor = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(interview.scheduledFor));
  const nextFollowUp = interview.nextFollowUp
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(
        new Date(interview.nextFollowUp + "T12:00:00")
      )
    : "Not scheduled";

  return (
    <article className="interview-card">
      <div className="interview-card-heading">
        <div>
          <span className="status-label">{interview.status.toUpperCase()}</span>
          <h3>{interview.contactName}</h3>
          <p>{interview.role} · {interview.company}</p>
        </div>
        <time dateTime={interview.scheduledFor}>{scheduledFor}</time>
      </div>
      <div className="interview-details">
        <div>
          <strong>Preparation</strong>
          <span>{interview.preparationQuestions.length} questions ready</span>
        </div>
        <div>
          <strong>Follow-up</strong>
          <span>{nextFollowUp}</span>
        </div>
        <div>
          <strong>Next action</strong>
          <span>{interview.recommendedAction ?? "Capture notes after the conversation"}</span>
        </div>
      </div>
      {interview.keyTakeaway && (
        <p className="interview-takeaway"><strong>Key takeaway:</strong> {interview.keyTakeaway}</p>
      )}
      {interview.referral && (
        <p className="interview-referral"><strong>Referral:</strong> {interview.referral}</p>
      )}
      <p className="interview-referral">
        <strong>Thank-you:</strong> {interview.thankYouSent ? "Sent" : "Pending"}
      </p>
    </article>
  );
}

export default App;
