/**
 * Polling Runner (single table with counts + delta + timing)
 * - Loads .env (STRAPI_API_URL, STRAPI_API_TOKEN, DM_INTERVAL_MS)
 * - Boots mirror with polling enabled
 * - Logs ONLY automatic polling updates (ignores initial push)
 * - Prints one clean table per update:
 *   metric | value | delta | timingMs
 */

import "dotenv/config";
import { resolve } from "node:path";
import { createMoto125Api } from "@moto125/api-client";
import { createContentCache } from "@moto125/content-cache";
import { STRAPI_URL } from "./constants";

/** Short ISO format: YYYY-MM-DD HH:mm:ss */
function isoShort(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

type Mirror = ReturnType<typeof createContentCache>;
let mirror: Mirror;

function mirrorState() {
  return mirror.state();
}

/** Counts snapshot extracted from mirror state */
function countsOf(s: NonNullable<ReturnType<typeof mirrorState>>) {
  return {
    generatedAt: s.generatedAt,
    articles: s.data.articles.length,
    motos: s.data.motos.length,
    companies: s.data.companies.length,
    articleTypes: s.data.taxonomies.articleTypes.length,
    motoTypes: s.data.taxonomies.motoTypes.length,
    motoClasses: s.data.taxonomies.motoClasses.length,
    hasHome: !!s.data.pages.home,
    hasOfertas: !!s.data.pages.ofertas,
    hasAboutUs: !!s.data.pages.aboutUs,
    hasConfig: !!s.data.config,
  };
}

/** Timings extracted + mapped for rows */
function timingsOf() {
  const s = mirrorState();
  const t = s?.timings;
  if (!t) return null;
  return {
    bySource: t.hydrate.bySource ?? ({} as Record<string, number>),
    totalMs: t.hydrate.totalMs,
    startedAt: t.hydrate.startedAt,
    endedAt: t.hydrate.endedAt,
  };
}

/** One divider line with title */
function hr(title: string) {
  console.log("─".repeat(10), title, "─".repeat(10));
}

/** Build unified table rows: metric | value | delta | timingMs */
function buildUnifiedTable(
  now: ReturnType<typeof countsOf>,
  prev: ReturnType<typeof countsOf> | undefined,
  timings: ReturnType<typeof timingsOf> | null
) {
  const d = (a: number, b?: number) => (b == null ? "" : a - (b ?? 0));
  const rows: Array<Record<string, unknown>> = [];

  // counts
  rows.push(
    {
      metric: "articles",
      value: now.articles,
      delta: d(now.articles, prev?.articles),
      timingMs: timings?.bySource["articles"] ?? "",
    },
    {
      metric: "motos",
      value: now.motos,
      delta: d(now.motos, prev?.motos),
      timingMs: timings?.bySource["motos"] ?? "",
    },
    {
      metric: "companies",
      value: now.companies,
      delta: d(now.companies, prev?.companies),
      timingMs: timings?.bySource["companies"] ?? "",
    },
    {
      metric: "articleTypes",
      value: now.articleTypes,
      delta: d(now.articleTypes, prev?.articleTypes),
      timingMs: timings?.bySource["taxonomies.articleTypes"] ?? "",
    },
    {
      metric: "motoTypes",
      value: now.motoTypes,
      delta: d(now.motoTypes, prev?.motoTypes),
      timingMs: timings?.bySource["taxonomies.motoTypes"] ?? "",
    },
    {
      metric: "motoClasses",
      value: now.motoClasses,
      delta: d(now.motoClasses, prev?.motoClasses),
      timingMs: timings?.bySource["taxonomies.motoClasses"] ?? "",
    },
    {
      metric: "hasHome",
      value: String(now.hasHome),
      delta: "",
      timingMs: timings?.bySource["pages.home"] ?? "",
    },
    {
      metric: "hasOfertas",
      value: String(now.hasOfertas),
      delta: "",
      timingMs: timings?.bySource["pages.ofertas"] ?? "",
    },
    {
      metric: "hasAboutUs",
      value: String(now.hasAboutUs),
      delta: "",
      timingMs: timings?.bySource["pages.aboutUs"] ?? "",
    },
    {
      metric: "hasConfig",
      value: String(now.hasConfig),
      delta: "",
      timingMs: timings?.bySource["config"] ?? "",
    }
  );

  // totals at bottom
  rows.push({ metric: "—", value: "—", delta: "—", timingMs: "—" });
  rows.push({
    metric: "totalHydrate",
    value: "",
    delta: "",
    timingMs: timings ? Math.round(timings.totalMs) : "",
  });
  rows.push({
    metric: "snapshotSave",
    value: "",
    delta: "",
  });

  return rows;
}

// ───────────────────────────────────────────────────────────────────────────────

const { STRAPI_API_URL, STRAPI_API_TOKEN, DM_INTERVAL_MS } = process.env;

function guardEnv() {
  const missing: string[] = [];
  if (!STRAPI_API_URL) missing.push("STRAPI_API_URL");
  if (!STRAPI_API_TOKEN) missing.push("STRAPI_API_TOKEN");
  if (missing.length) {
    console.error("❌ Missing env:", missing.join(", "));
    process.exit(1);
  }
}

async function main() {
  guardEnv();

  const snapshotPath = resolve(process.cwd(), "data/cache.json");
  const intervalMs = Number(DM_INTERVAL_MS ?? 15_000);

  console.log("🟢 Moto125 Data Mirror Cache ");
  console.log("   • pulling interval:", intervalMs, "ms");
  console.log("   • snapshot:", snapshotPath);
  console.log("   • baseUrl :", STRAPI_API_URL);

  // Create mirror and attach listeners BEFORE init to catch errors emitted during init/refresh.
  mirror = createContentCache();

  let prevCounts: ReturnType<typeof countsOf> | undefined;
  let seenInitialPush = false;
  let tick = 0;

  mirror.onUpdate((next) => {
    if (!seenInitialPush) {
      // Ignore the initial push caused by subscription
      seenInitialPush = true;
      return;
    }
    if (!next) {
      hr("UPDATE");
      console.log("⚠️  mirror reset to null");
      return;
    }

    tick += 1;

    const nowCounts = countsOf(next);
    const t = timingsOf();

    hr(`POLL #${tick} @ ${isoShort(nowCounts.generatedAt)}`);
    if (t) {
      console.log(
        "   window:",
        `${isoShort(t.startedAt)} → ${isoShort(t.endedAt)}`
      );
    }

    const table = buildUnifiedTable(nowCounts, prevCounts, t);
    console.table(table);

    prevCounts = nowCounts;
  });

  mirror.onError((err) => {
    hr("ERROR");
    console.error("❗", err.message);
    console.error(
      JSON.stringify(
        {
          time: err.time,
          source: err.source,
          code: err.code,
          status: err.status ?? null,
        },
        null,
        2
      )
    );
  });

  try {
    await mirror.init({
      sdkInit: {
        baseUrl: STRAPI_URL!, // usa tu constante resuelta (equivalente a STRAPI_API_URL)
        token: STRAPI_API_TOKEN!,
      },
      snapshotPath,
      autosave: true,
      refreshIntervalMs: intervalMs,
      forceHydrateOnInit: true, // si falla, lo atrapamos abajo y seguimos
    });
  } catch (e: any) {
    // Aceptamos fallos: no salimos del proceso.
    hr("INIT ERROR (tolerated)");
    // Si el createDataMirror.refresh lanzó AggregateError con __mirrorErrors, ya se emitieron por onError.
    console.error("⚠️  init failed but continuing with polling…");
    // Si había snapshot, el estado ya se cargó antes del refresh; si no, state() puede ser null hasta el próximo poll OK.
    // Arrancamos el polling manualmente (init no llegó a hacerlo).
    mirror.start();
  }

  const s0 = mirror.state();
  if (!s0) {
    hr("BOOT");
    console.log(
      "ℹ️  No initial state available (no snapshot or hydrate failed). Waiting for next successful poll…"
    );
  } else {
    prevCounts = countsOf(s0);
  }
}

main().catch((e) => {
  console.error("💥 Fatal error:", e);
  try {
    mirror?.stop();
    mirror?.dispose();
  } catch {}
  process.exit(1);
});
