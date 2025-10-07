import { useAppSelector } from "../store";

export default function LogsPanel() {
  const { lines, connected, lastError } = useAppSelector((s) => s.logs);

  return (
    <div className="flex flex-col min-h-[280px]">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold text-heading mt-0">Logs</h2>
        <div className="text-xs">
          {connected ? (
            <span className="pill pill-ok">connected</span>
          ) : (
            <span className="pill pill-warn">disconnected</span>
          )}
        </div>
      </div>

      {lastError ? (
        <div className="text-xs text-red-600 mb-2">Error: {lastError}</div>
      ) : null}

      <div className="mono h-[40vh] sm:h-[45vh] overflow-auto bg-white/60 border border-border rounded-xl p-3 no-scrollbar">
        {lines.length === 0 ? (
          <div className="text-gray-500 text-sm">No logs yet</div>
        ) : (
          lines.map((line, idx) => {
            const [msg, color = "text-blue-700"] = line.split("|||");
            return (
              <div key={idx} className={`text-xs whitespace-pre-wrap ${color}`}>
                {msg}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
