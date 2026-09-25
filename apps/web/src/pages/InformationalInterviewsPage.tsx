import { useMemo, useState } from "react";
import { Search01Icon } from "hugeicons-react";
import { Button, Select, Table } from "../components/ui";
import { useInterviewsQuery } from "../hooks/queries";

export function InformationalInterviewsPage() {
  const { data: interviews = [], isLoading: loading } = useInterviewsQuery();
  const [query, setQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("All");

  const companies = useMemo(() => {
    const set = new Set<string>();
    interviews.forEach((i) => {
      if (i.company) set.add(i.company);
    });
    return Array.from(set).sort();
  }, [interviews]);

  const filteredInterviews = useMemo(() => {
    let result = interviews;
    if (companyFilter !== "All") {
      result = result.filter((i) => i.company === companyFilter);
    }
    const search = query.trim().toLowerCase();
    if (search) {
      result = result.filter((i) =>
        [i.contactName, i.company, i.role, i.keyTakeaway, i.scheduledFor]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search)
      );
    }
    return result;
  }, [interviews, query, companyFilter]);

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="min-w-0">
          <span className="mb-0.5 block text-[12px] font-medium text-[var(--text-muted)]">Networking</span>
          <h1 className="truncate">Interviews</h1>
        </div>
        <Button variant="primary" className="!rounded-[14px] !h-8.5 !px-3 sm:!px-3.5 !text-[13px] !font-medium shrink-0">
          Add interview
        </Button>
      </header>

      <section className="rounded-2xl bg-white p-4 sm:p-6 border-0 ring-0 min-w-0">
        <div className="mb-[18px] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:w-[220px] sm:flex-none">
            <Select
              aria-label="Filter interviews by company"
              value={companyFilter}
              onValueChange={(val) => val && setCompanyFilter(val)}
              className="w-full"
              items={{
                All: `All companies (${interviews.length})`,
                ...Object.fromEntries(
                  companies.map((comp) => [
                    comp,
                    `${comp} (${interviews.filter((i) => i.company === comp).length})`
                  ])
                )
              }}
            />
          </div>
          <label className="flex w-full items-center gap-2 rounded-xl bg-gray-100/80 border border-gray-200/60 px-3.5 py-2 sm:w-[280px] md:w-[320px] text-gray-400 focus-within:border-[#0a5c4d] focus-within:ring-2 focus-within:ring-[#0a5c4d]/20 transition-all">
            <span className="sr-only">Search interviews</span>
            <Search01Icon size={16} className="shrink-0 text-gray-500" />
            <input
              type="text"
              className="bg-transparent border-0 outline-none ring-0 shadow-none p-0 text-sm w-full text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:border-0"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search interviews"
            />
          </label>
        </div>

        {loading ? (
          <div className="page-loading">
            <span className="page-loader" aria-hidden="true" />
            <span>Loading interviews</span>
          </div>
        ) : filteredInterviews.length ? (
          <div className="w-full overflow-x-auto pb-2">
            <Table className="min-w-[560px]">
              <Table.Header>
                <Table.Row>
                  <Table.Head className="min-w-[130px]">Contact</Table.Head>
                  <Table.Head className="min-w-[150px]">Company / role</Table.Head>
                  <Table.Head className="min-w-[120px]">Date</Table.Head>
                  <Table.Head className="min-w-[160px]">Key takeaways</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredInterviews.map((interview) => (
                  <Table.Row key={interview.id}>
                    <Table.Cell className="font-medium text-gray-900">
                      {interview.contactName}
                    </Table.Cell>
                    <Table.Cell>
                      {interview.role} {interview.company ? `at ${interview.company}` : ""}
                    </Table.Cell>
                    <Table.Cell>
                      {interview.scheduledFor
                        ? new Intl.DateTimeFormat("en-GB", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(interview.scheduledFor))
                        : "—"}
                    </Table.Cell>
                    <Table.Cell className="max-w-xs truncate">
                      {interview.keyTakeaway || "—"}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        ) : (
          <p className="px-4 py-12 text-center text-sm text-gray-500">No informational interviews match your search.</p>
        )}
      </section>
    </>
  );
}
