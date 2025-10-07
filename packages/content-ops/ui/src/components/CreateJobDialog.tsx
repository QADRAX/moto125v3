import React from "react";
import { useAppDispatch, useAppSelector } from "../store";
import { createSyncMediaJob } from "../store/jobsSlice";

export default function CreateJobDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const dispatch = useAppDispatch();
  const creating = useAppSelector((s) => s.jobs.creating);
  const createError = useAppSelector((s) => s.jobs.createError);

  const [type, setType] = React.useState<"sync-media">("sync-media");
  const [id, setId] = React.useState<string>("");
  const [cron, setCron] = React.useState<string>(""); // vacío = manual-only
  const [concurrency, setConcurrency] = React.useState<number>(4);

  React.useEffect(() => {
    if (!open) {
      // reset simple al cerrar
      setType("sync-media");
      setId("");
      setCron("");
      setConcurrency(4);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === "sync-media") {
      const payload = {
        id: id?.trim() || undefined,
        cron: cron?.trim() ? cron.trim() : undefined,
        concurrency: Math.max(1, Number(concurrency) || 1),
      };
      const res = await dispatch(createSyncMediaJob(payload));
      if ((res as any).meta?.requestStatus === "fulfilled") {
        onCreated();
        onClose();
      }
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-2 sm:p-6"
    >
      <div className="w-full max-w-xl card p-4 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-heading m-0">Create job</h3>
          <button className="btn-secondary" onClick={onClose} aria-label="Close dialog">Close</button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Job type</label>
            <select
              className="w-full border border-border rounded-lg px-3 py-2 bg-surface"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
            >
              <option value="sync-media">sync-media</option>
              {/* futuro: añade más tipos aquí */}
            </select>
          </div>

          {/* Campos específicos por tipo */}
          {type === "sync-media" && (
            <>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Job ID (optional)</label>
                <input
                  className="w-full border border-border rounded-lg px-3 py-2 bg-surface"
                  placeholder="sync-media-123 (auto if empty)"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Cron (optional) <span className="text-gray-400">(manual-only if empty)</span>
                </label>
                <input
                  className="w-full border border-border rounded-lg px-3 py-2 bg-surface mono"
                  placeholder="e.g. 0 */5 * * * *"
                  value={cron}
                  onChange={(e) => setCron(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usa una expresión cron estándar (segundos opcionales). Deja vacío para ejecutar solo manualmente.{" "}
                  <a
                    className="hover-primary underline"
                    href="https://crontab.guru/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ayuda cron
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Concurrency</label>
                <input
                  type="number"
                  min={1}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-surface"
                  value={concurrency}
                  onChange={(e) => setConcurrency(parseInt(e.target.value || "1", 10))}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nº de blobs a procesar en paralelo
                </p>
              </div>
            </>
          )}

          {/* Error global */}
          {createError ? (
            <div className="text-sm text-red-600">Error: {createError}</div>
          ) : null}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={creating}>
              {creating ? "Creating…" : "Create job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
