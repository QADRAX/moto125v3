import React from "react";
import type { LogsEvent } from "@moto125/content-ops-shared";

export default function LogsPanel() {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const es = new EventSource("/logs/stream");
    const onMsg = (ev: MessageEvent) => {
      try {
        const e = JSON.parse(ev.data) as LogsEvent;
        if (!ref.current) return;
        const lvl = String(e.level || "info").toUpperCase();
        const div = document.createElement("div");
        div.className = `log-line lvl-${lvl}`;
        div.textContent = `${e.ts ?? new Date().toISOString()} [${lvl}] ${e.msg || ""} ${e.ctx ? JSON.stringify(e.ctx) : ""}`;
        ref.current.appendChild(div);
        ref.current.scrollTop = ref.current.scrollHeight;
      } catch {}
    };
    const onErr = () => {
      if (!ref.current) return;
      const div = document.createElement("div");
      div.className = "log-line lvl-WARN";
      div.textContent = `${new Date().toISOString()} [WARN] Log stream disconnected`;
      ref.current.appendChild(div);
    };
    es.addEventListener("message", onMsg);
    es.addEventListener("error", onErr);
    return () => {
      es.removeEventListener("message", onMsg);
      es.removeEventListener("error", onErr);
      es.close();
    };
  }, []);

  return <div id="logs" className="logs mono" ref={ref} aria-live="polite" />;
}
