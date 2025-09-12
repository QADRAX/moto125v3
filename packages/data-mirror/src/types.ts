import type {
  Article,
  Moto,
  Company,
  ArticleType,
  MotoType,
  MotoClass,
  Config,
  HomePage,
  PaginaOfertas,
  AboutUsPage,
  Moto125Sdk,
} from "@moto125/api-client";

export interface MirrorError {
  /** ISO timestamp when the error happened. */
  time: string;
  /** Logical source that failed. */
  source:
    | "articles"
    | "motos"
    | "companies"
    | "taxonomies.articleTypes"
    | "taxonomies.motoTypes"
    | "taxonomies.motoClasses"
    | "pages.home"
    | "pages.ofertas"
    | "pages.aboutUs"
    | "config";
  /** High-level error code for quick routing. */
  code: "HTTP_404" | "HTTP_4XX" | "HTTP_5XX" | "NETWORK" | "PARSE" | "UNKNOWN";
  /** HTTP status if applicable. */
  status?: number;
  /** Human-friendly message. */
  message: string;
  /** Optional raw details for debugging (safe to print). */
  detail?: unknown;
}

export interface MirrorData {
  articles: Article[];
  motos: Moto[];
  companies: Company[];
  taxonomies: {
    articleTypes: ArticleType[];
    motoTypes: MotoType[];
    motoClasses: MotoClass[];
  };
  pages: {
    home?: HomePage;
    ofertas?: PaginaOfertas;
    aboutUs?: AboutUsPage;
  };
  config?: Config;
}

export interface MirrorTimings {
  hydrate: {
    startedAt: string;
    endedAt: string;
    totalMs: number;
    bySource: Record<string, number>;
  };
  snapshotSaveMs?: number;
}

export interface MirrorState {
  version?: string;
  generatedAt: string;
  data: MirrorData;
  timings?: MirrorTimings;
}

export type MirrorRootState = MirrorState | null;
export type ErrorListener = (err: MirrorError) => void;

export interface DataMirrorInitOptions {
  sdk?: Moto125Sdk;           // required if no snapshot on disk
  snapshotPath?: string;      // JSON snapshot path
  refreshIntervalMs?: number; // enable polling if provided (> 0)
  autosave?: boolean;         // save snapshot after each refresh (if snapshotPath)
  forceHydrateOnInit?: boolean; // hydrate even if snapshot loads
}

export type UpdateListener = (next: MirrorRootState) => void;

export interface DataMirror {
  /** Initialize: load snapshot or hydrate; start polling if configured. */
  init(opts: DataMirrorInitOptions): Promise<void>;
  /** Current state (null if not loaded yet). */
  state(): MirrorRootState;
  /** Subscribe to updates; returns unsubscribe. */
  onUpdate(listener: UpdateListener): () => void;
  onError(listener: ErrorListener): () => void;
  getErrors(): ReadonlyArray<MirrorError>;
  clearErrors(): void;
  /** Trigger a refresh (hydrate now). */
  refresh(): Promise<void>;
  /** Start/stop polling. */
  start(): void;
  stop(): void;
  /** Snapshot operations. */
  saveSnapshot(): Promise<void>;
  loadSnapshot(): Promise<void>;
  /** Reconfigure at runtime (restarts polling if interval changes). */
  configure(opts: Partial<Omit<DataMirrorInitOptions, "forceHydrateOnInit">>): void;
  /** Cleanup timers/subscriptions. */
  dispose(): void;
}