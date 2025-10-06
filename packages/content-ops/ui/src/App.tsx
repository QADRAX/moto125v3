import React from "react";
import { API, getJSON, postJSON } from "./api";
import type { GetJobsResponse, JobItem } from "@moto125/content-ops-shared";
import LogsPanel from "./components/LogsPanel";
import JobsTable from "./components/JobsTable";

export default function App() {
  const [jobs, setJobs] = React.useState<JobItem[]>([]);
  const [ts, setTs] = React.useState<string>("");
  const [runningId, setRunningId] = React.useState<string | null>(null);

  const loadJobs = React.useCallback(async () => {
    const data = await getJSON<GetJobsResponse>(API.JOBS);
    setJobs(data.data ?? []);
    setTs(new Date().toLocaleTimeString());
  }, []);

  React.useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const onRun = async (id: string) => {
    setRunningId(id);
    try {
      await postJSON(API.JOB_RUN(id));
      await loadJobs();
    } catch (e: any) {
      alert(`Run failed: ${e?.message ?? e}`);
    } finally {
      setRunningId(null);
    }
  };

  const onRestart = async () => {
    const btn = document.getElementById(
      "btn-restart"
    ) as HTMLButtonElement | null;
    if (btn) btn.disabled = true;
    try {
      await postJSON(API.RESTART);
      await loadJobs();
    } catch (e: any) {
      alert(`Restart failed: ${e?.message ?? e}`);
    } finally {
      if (btn) btn.disabled = false;
    }
  };

  return (
    <>
      <h1>Content Ops Service</h1>
      <div className="toolbar">
        <button
          id="btn-refresh"
          className="secondary"
          onClick={loadJobs}
          title="Refresh jobs"
        >
          Refresh
        </button>
        <button id="btn-restart" onClick={onRestart} title="Restart scheduler">
          Restart scheduler
        </button>
        <span id="ts" className="muted">
          Updated: {ts}
        </span>
      </div>

      <div className="grid">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Jobs</h2>
          <JobsTable jobs={jobs} onRun={onRun} loadingId={runningId} />
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Logs</h2>
          <LogsPanel />
        </div>
      </div>
    </>
  );
}
