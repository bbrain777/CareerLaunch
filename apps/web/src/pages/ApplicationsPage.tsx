import { useMemo, useState } from "react";
import { Search01Icon } from "hugeicons-react";
import { pipelineStatuses } from "../status";
import { ApplicationCard } from "../components/Cards";
import { Button, Select, Loader } from "../components/ui";
import { useApplicationsQuery } from "../hooks/queries";

export function ApplicationsPage() {
  const { data: applications = [], isLoading: loading, error: queryError } = useApplicationsQuery();
  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  const error = queryError ? "Unable to load applications. Ensure the API server is running." : "";

  const filteredApplications = useMemo(() => {
    let result = applications;

    if (selectedStatus !== "All") {
      result = result.filter((app) => app.status === selectedStatus);
    }

    const search = query.trim().toLowerCase();
    if (search) {
      result = result.filter((app) =>
        [app.company, app.position, app.location, app.status]
          .join(" ")
          .toLowerCase()
          .includes(search)
      );
    }

    return result;
  }, [applications, query, selectedStatus]);

  return (
    <>
      <header className="topbar">
        <div>
          <span className="eyebrow">Pipeline management</span>
          <h1>Job applications</h1>
        </div>
        <Button variant="primary" className="topbar-add-btn">
          Add application
        </Button>
      </header>

      {error && <div className="error-banner" role="alert">{error}</div>}

      <section className="panel">
        <div className="panel-heading applications-toolbar">
          <div className="filter-select-wrapper">
            <Select
              aria-label="Filter applications by status"
              value={selectedStatus}
              onValueChange={(val) => val && setSelectedStatus(val as string)}
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

          <label className="search-field applications-search">
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
            <Loader size={24} aria-label="Loading applications" />
            <span className="text-xs text-[#6b7280]">Loading applications</span>
          </div>
        ) : (
          <div className="pipeline">
            {(selectedStatus === "All" ? pipelineStatuses : [selectedStatus]).map((status) => {
              const statusApps = filteredApplications.filter((app) => app.status === status);
              return (
                <div className="pipeline-column" key={status}>
                  <div className="column-heading">
                    <span className={"status-dot " + status.toLowerCase()} />
                    <h3>{status}</h3>
                    <span>{statusApps.length}</span>
                  </div>
                  {statusApps.length ? (
                    statusApps.map((application) => (
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
    </>
  );
}
