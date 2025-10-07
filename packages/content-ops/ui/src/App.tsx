import React from "react";
import { useAppDispatch, useAppSelector } from "./store";
import { fetchJobs, runJob, deleteJob } from "./store/jobsSlice";
import { startLogs } from "./store/logSlice";
import LogsPanel from "./components/LogsPanel";
import JobsPanel from "./components/JobsPanel";

export default function App() {
  const dispatch = useAppDispatch();
  const jobs = useAppSelector((s) => s.jobs.items);
  const loading = useAppSelector((s) => s.jobs.loading);
  const runningId = useAppSelector((s) => s.jobs.runningId);
  const deletingId = useAppSelector((s) => s.jobs.deletingId);

  React.useEffect(() => {
    dispatch(fetchJobs());
    dispatch(startLogs());
  }, [dispatch]);

  const handleRun = (id: string) => dispatch(runJob(id)).then(() => dispatch(fetchJobs()));
  const handleDelete = (id: string) =>
    dispatch(deleteJob(id)).then(() => dispatch(fetchJobs()));

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="max-w-page mx-auto px-4 py-5">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-heading">Content Ops Service</h1>
          <p className="text-sm text-gray-500">Jobs & Logs monitor</p>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-rows-[minmax(420px,auto)_minmax(340px,1fr)]">
          <section className="card p-4">
            <JobsPanel
              jobs={jobs}
              loading={loading}
              runningId={runningId ?? null}
              deletingId={deletingId ?? null}
              onRun={handleRun}
              onDelete={handleDelete}
              onRefresh={() => dispatch(fetchJobs())}
            />
          </section>

          <section className="card p-4">
            <LogsPanel />
          </section>
        </div>
      </div>
    </div>
  );
}
