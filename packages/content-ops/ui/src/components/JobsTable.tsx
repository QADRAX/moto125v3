import { type JobItem } from "@moto125/content-ops-shared";

type Props = {
  jobs: JobItem[];
  onRun: (id: string) => void;
  loadingId?: string | null;
};

export default function JobsTable({ jobs, onRun, loadingId }: Props) {
  const fmtBool = (v: boolean) =>
    v ? (
      <span className="pill ok">yes</span>
    ) : (
      <span className="pill warn">no</span>
    );
  const fmtMs = (ms?: number) => (typeof ms === "number" ? `${ms} ms` : "—");
  const fmtIso = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "—");

  if (!jobs.length) {
    return <div className="muted">No jobs</div>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th style={{ width: 160 }}>Name</th>
          <th>ID</th>
          <th style={{ width: 120 }}>Cron</th>
          <th style={{ width: 90 }}>Enabled</th>
          <th style={{ width: 160 }}>Last run</th>
          <th style={{ width: 160 }}>Duration</th>
          <th style={{ width: 220 }}>Counters</th>
          <th style={{ width: 140 }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((j) => {
          const s = j.state || {};
          const counters = `proc:${s.processed ?? 0} • up:${s.uploaded ?? 0} • skip:${s.skipped ?? 0} • err:${s.errors ?? 0}`;
          return (
            <tr key={j.id}>
              <td>
                <strong>{j.name}</strong>
              </td>
              <td className="mono">{j.id}</td>
              <td className="mono">{j.cron}</td>
              <td>{fmtBool(j.enabled)}</td>
              <td>
                <div>{fmtIso(s.lastRunAt)}</div>
                {s.lastError ? (
                  <div className="muted">Err: {s.lastError}</div>
                ) : null}
              </td>
              <td>{fmtMs(s.lastDurationMs)}</td>
              <td className="mono">{counters}</td>
              <td>
                <div className="row-actions">
                  <button
                    onClick={() => onRun(j.id)}
                    disabled={loadingId === j.id}
                  >
                    Run
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
