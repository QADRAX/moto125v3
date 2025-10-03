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
} from "@moto125/api-client";

export type ContentCacheWorkerIn =
  | { type: "hydrate"; sdkInit: SdkInit }
  | { type: "saveSnapshot"; path: string; stateBin: ArrayBufferLike }
  | { type: "loadSnapshot"; path: string }
  | { type: "setDebug"; enabled: boolean }
  | { type: "dispose" };

export type ContentCacheWorkerOut =
  | { type: "hydrate:done"; payload: { stateBin: ArrayBuffer; size: number } }
  | { type: "saveSnapshot:done" }
  | {
      type: "loadSnapshot:done";
      payload: { stateBin: ArrayBuffer; size: number };
    }
  | { type: "saveSnapshot:error"; error: ContentCacheError }
  | { type: "loadSnapshot:error"; error: ContentCacheError }
  | { type: "error"; error: string };

export interface ContentCacheError {
  time: string;
  source:
    | "unknown"
    | "articles"
    | "motos"
    | "companies"
    | "taxonomies.articleTypes"
    | "taxonomies.motoTypes"
    | "taxonomies.motoClasses"
    | "pages.home"
    | "pages.ofertas"
    | "pages.aboutUs"
    | "config"
    // NEW: file I/O & snapshot serialization errors
    | "snapshot";
  code: "HTTP_404" | "HTTP_4XX" | "HTTP_5XX" | "NETWORK" | "PARSE" | "UNKNOWN";
  status?: number;
  message: string;
  detail?: unknown;
}

export type HydrateOpts = {
  autosave?: boolean;
  snapshotPath?: string;
};

export interface ContentCacheData {
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

export interface ContentCacheTimings {
  hydrate: {
    startedAt: string;
    endedAt: string;
    totalMs: number;
    bySource: Record<string, number>;
  };
}

export interface ContentCacheState {
  version?: string;
  generatedAt: string;
  data: ContentCacheData;
  timings?: ContentCacheTimings;
}

export type ContentCacheRootState = ContentCacheState | null;
export type ErrorListener = (err: ContentCacheError) => void;

export type SdkInit = { baseUrl: string; token?: string };

export interface ContentCacheInitOptions {
  sdkInit?: SdkInit;
  snapshotPath?: string;
  refreshIntervalMs?: number;
  refreshCron?: string;
  cronTimezone?: string;
  autosave?: boolean;
  forceHydrateOnInit?: boolean;
  workerDebugLogging?: boolean;
}

export type UpdateListener = (next: ContentCacheRootState) => void;

export interface ContentCache {
  init(opts: ContentCacheInitOptions): Promise<void>;
  state(): ContentCacheRootState;
  onUpdate(listener: UpdateListener): () => void;
  onError(listener: ErrorListener): () => void;
  getErrors(): ReadonlyArray<ContentCacheError>;
  clearErrors(): void;
  refresh(): Promise<void>;
  start(): void;
  stop(): void;
  saveSnapshot(): Promise<void>;
  loadSnapshot(): Promise<void>;
  setWorkerDebugLogging(enabled: boolean): void;
  configure(
    opts: Partial<Omit<ContentCacheInitOptions, "forceHydrateOnInit">>
  ): void;
  dispose(): void;
}
