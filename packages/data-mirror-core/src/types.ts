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

export type MirrorWorkerIn =
  | { type: "hydrate"; sdkInit: SdkInit }
  | { type: "saveSnapshot"; path: string; stateBin: ArrayBufferLike }
  | { type: "loadSnapshot"; path: string }
  | { type: "setDebug"; enabled: boolean }
  | { type: "dispose" };

export type MirrorWorkerOut =
  | { type: "hydrate:done"; payload: { stateBin: ArrayBuffer; size: number } }
  | { type: "saveSnapshot:done" }
  | {
      type: "loadSnapshot:done";
      payload: { stateBin: ArrayBuffer; size: number };
    }
  | { type: "saveSnapshot:error"; error: MirrorError }
  | { type: "loadSnapshot:error"; error: MirrorError }
  | { type: "error"; error: string };

export interface MirrorError {
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
}

export interface MirrorState {
  version?: string;
  generatedAt: string;
  data: MirrorData;
  timings?: MirrorTimings;
}

export type MirrorRootState = MirrorState | null;
export type ErrorListener = (err: MirrorError) => void;

export type SdkInit = { baseUrl: string; token?: string };

export interface DataMirrorInitOptions {
  sdkInit?: SdkInit;
  snapshotPath?: string;
  refreshIntervalMs?: number;
  autosave?: boolean;
  forceHydrateOnInit?: boolean;
  workerDebugLogging?: boolean;
}

export type UpdateListener = (next: MirrorRootState) => void;

export interface DataMirror {
  init(opts: DataMirrorInitOptions): Promise<void>;
  state(): MirrorRootState;
  onUpdate(listener: UpdateListener): () => void;
  onError(listener: ErrorListener): () => void;
  getErrors(): ReadonlyArray<MirrorError>;
  clearErrors(): void;
  refresh(): Promise<void>;
  start(): void;
  stop(): void;
  saveSnapshot(): Promise<void>;
  loadSnapshot(): Promise<void>;
  setWorkerDebugLogging(enabled: boolean): void;
  configure(
    opts: Partial<Omit<DataMirrorInitOptions, "forceHydrateOnInit">>
  ): void;
  dispose(): void;
}
