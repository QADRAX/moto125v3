/* Minimal UI controller for Content Ops Service.
 * - GET /jobs: list jobs & status
 * - POST /jobs/:id/run: trigger job
 * - POST /scheduler/restart: restart schedules
 * - GET /logs/stream: live logs via SSE
 */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const elJobsBody = $("#jobs-body");
const elTs = $("#ts");
const elLogs = $("#logs");
const btnRefresh = $("#btn-refresh");
const btnRestart = $("#btn-restart");

/** Formatters */
const fmtBool = (v) => v ? `<span class="pill ok">yes</span>` : `<span class="pill warn">no</span>`;
const fmtMs = (ms) => (typeof ms === "number" ? `${ms} ms` : "—");
const fmtIso = (iso) => (iso ? new Date(iso).toLocaleString() : "—");

/** Fetch helper */
async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

/** Render jobs table */
async function loadJobs() {
  elTs.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
  const data = await api("/jobs");
  const rows = (data?.data ?? []).map((j) => {
    const s = j.state || {};
    const counters =
      `proc:${s.processed ?? 0} • up:${s.uploaded ?? 0} • ` +
      `skip:${s.skipped ?? 0} • err:${s.errors ?? 0}`;

    const lastErr = s.lastError ? `<div class="muted">Err: ${escapeHtml(s.lastError)}</div>` : "";

    return `
      <tr>
        <td><strong>${escapeHtml(j.name)}</strong></td>
        <td class="mono">${escapeHtml(j.id)}</td>
        <td class="mono">${escapeHtml(j.cron)}</td>
        <td>${fmtBool(j.enabled)}</td>
        <td>
          <div>${fmtIso(s.lastRunAt)}</div>
          ${lastErr}
        </td>
        <td>${fmtMs(s.lastDurationMs)}</td>
        <td class="mono">${counters}</td>
        <td>
          <div class="row-actions">
            <button data-run="${escapeAttr(j.id)}">Run</button>
          </div>
        </td>
      </tr>
    `;
  });
  elJobsBody.innerHTML = rows.join("") || `<tr><td colspan="8" class="muted">No jobs registered</td></tr>`;
}

/** Run job handler */
async function onRun(jobId) {
  const btn = document.querySelector(`button[data-run="${CSS.escape(jobId)}"]`);
  if (btn) btn.disabled = true;
  try {
    await api(`/jobs/${encodeURIComponent(jobId)}/run`, { method: "POST" });
    await loadJobs();
  } catch (e) {
    alert(`Run failed: ${e.message}`);
  } finally {
    if (btn) btn.disabled = false;
  }
}

/** Restart scheduler */
async function onRestart() {
  btnRestart.disabled = true;
  try {
    await api("/scheduler/restart", { method: "POST" });
    await loadJobs();
  } catch (e) {
    alert(`Restart failed: ${e.message}`);
  } finally {
    btnRestart.disabled = false;
  }
}

/** Logs via SSE */
function initLogStream() {
  const es = new EventSource("/logs/stream");
  es.addEventListener("message", (ev) => {
    try {
      const e = JSON.parse(ev.data);
      appendLog(e);
    } catch {}
  });
  es.addEventListener("error", () => {
    appendLog({ ts: new Date().toISOString(), level: "warn", msg: "Log stream disconnected" });
  });
}

/** Append one log line to panel */
function appendLog(e) {
  const line = document.createElement("div");
  const lvl = String(e.level || "info").toUpperCase();
  line.className = `log-line lvl-${lvl}`;
  line.textContent = `${e.ts ?? new Date().toISOString()} [${lvl}] ${e.msg || ""}${formatCtx(e.ctx)}`;
  elLogs.appendChild(line);
  // Auto-scroll to bottom
  elLogs.scrollTop = elLogs.scrollHeight;
}

function formatCtx(ctx) {
  if (!ctx || typeof ctx !== "object") return "";
  try {
    return " " + JSON.stringify(ctx);
  } catch {
    return "";
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
function escapeAttr(s) { return escapeHtml(s); }

/** Wire events */
document.addEventListener("click", (ev) => {
  const btn = ev.target.closest("button[data-run]");
  if (btn) {
    const id = btn.getAttribute("data-run");
    if (id) onRun(id);
  }
});
btnRefresh.addEventListener("click", loadJobs);
btnRestart.addEventListener("click", onRestart);

/** Boot */
loadJobs();
initLogStream();
