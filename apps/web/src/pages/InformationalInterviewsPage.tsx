import { InformationalInterviewCard } from "../components/Cards";
import { Button, Loader } from "../components/ui";
import { useInterviewsQuery } from "../hooks/queries";

export function InformationalInterviewsPage() {
  const { data: interviews = [], isLoading: loading, error: queryError } = useInterviewsQuery();
  const error = queryError ? "Unable to load informational interviews. Ensure the API server is running." : "";

  return (
    <>
      <header className="topbar">
        <div>
          <span className="eyebrow">Networking</span>
          <h1>Interviews</h1>
        </div>
        <Button variant="primary" className="topbar-add-btn">
          Add interview
        </Button>
      </header>

      {error && <div className="error-banner" role="alert">{error}</div>}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">All sessions</span>
            <h2>Scheduled and completed conversations</h2>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader size={24} aria-label="Loading interviews" />
            <span className="text-xs text-[#6b7280]">Loading interviews</span>
          </div>
        ) : (
          <div className="interview-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {interviews.length ? (
              interviews.map((interview) => (
                <InformationalInterviewCard interview={interview} key={interview.id} />
              ))
            ) : (
              <p className="empty-state">No informational interviews recorded yet.</p>
            )}
          </div>
        )}
      </section>
    </>
  );
}
