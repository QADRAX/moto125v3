import React from "react";
import type { JobItem } from "@moto125/content-ops-shared";
import CreateJobDialog from "./CreateJobDialog";

type Props = {
  jobs: JobItem[];
  loading: boolean;
  runningId: string | null;
  deletingId: string | null;
  onRun: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
};

export default function JobsPanel({
  jobs,
  loading,
  runningId,
  deletingId,
  onRun,
  onDelete,
  onRefresh,
}: Props) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-heading mt-0">Jobs</h2>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={onRefresh} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
          <button className="btn" onClick={() => setOpen(true)}>
            New job
          </button>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        {jobs.length === 0 ? (
          <div className="text-gray-500">No jobs</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="py-2 w-40">Name</th>
                <th className="py-2">ID</th>
                <th className="py-2 w-32">Type</th>
                <th className="py-2 w-48">Cron</th>
                <th className="py-2 w-48">Last run</th>
                <th className="py-2 w-28">Duration</th>
                <th className="py-2 w-[260px]">Counters</th>
                <th className="py-2 w-44">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => {
                const s = j.state || {};
                const counters = `proc:${s.processed ?? 0} • up:${s.uploaded ?? 0} • skip:${s.skipped ?? 0} • err:${s.errors ?? 0}`;
                return (
                  <tr key={j.id} className="border-t border-border">
                    <td className="py-2"><strong>{j.name}</strong></td>
                    <td className="py-2 mono text-xs">{j.id}</td>
                    <td className="py-2 mono text-xs">{j.type}</td>
                    <td className="py-2 mono text-xs">{j.cron ?? "—"}</td>
                    <td className="py-2">
                      <div>{s.lastRunAt ? new Date(s.lastRunAt).toLocaleString() : "—"}</div>
                      {s.lastError ? <div className="text-red-600 text-xs">Err: {s.lastError}</div> : null}
                    </td>
                    <td className="py-2">{typeof s.lastDurationMs === "number" ? `${s.lastDurationMs} ms` : "—"}</td>
                    <td className="py-2 mono text-xs">{counters}</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <button
                          className="btn"
                          onClick={() => onRun(j.id)}
                          disabled={runningId === j.id}
                          title="Run now"
                        >
                          {runningId === j.id ? "Running…" : "Run"}
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => onDelete(j.id)}
                          disabled={deletingId === j.id}
                          title="Delete job"
                        >
                          {deletingId === j.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <CreateJobDialog open={open} onClose={() => setOpen(false)} onCreated={onRefresh} />
    </>
  );
}
