export interface StrapiFileFormat {
  ext?: string;
  url: string;
  hash?: string;
  mime?: string;
  name?: string;
  path?: string | null;
  size?: number;
  width?: number;
  height?: number;
  sizeInBytes?: number;
}

export interface StrapiFileAttributes {
  name: string;
  alternativeText?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
  formats?: Record<string, StrapiFileFormat> | null;
  hash: string;
  ext?: string | null;
  mime: string;
  size: number;
  url: string;
  previewUrl?: string | null;
  provider: string;
  provider_metadata?: any;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

export type StrapiFile = StrapiFileAttributes & {
  id: number;
  documentId: string;
};

export interface StrapiMeta {
  pagination?: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
}

export type StrapiEntry<T> = T & { id: number; documentId: string };

export interface StrapiCollectionResponse<T> {
  data: Array<StrapiEntry<T>>;
  meta: StrapiMeta;
}

export interface StrapiSingleResponse<T> {
  data: StrapiEntry<T> | null;
  meta: StrapiMeta;
}

export type StrapiFilters = Record<string, any>;
export type StrapiPopulate =
  | '*'
  | string
  | string[]
  | Record<string, true | { populate?: StrapiPopulate }>;
export type StrapiSort = string | string[];
export type StrapiFields = string[];

export interface StrapiQueryParams {
  filters?: StrapiFilters;
  populate?: StrapiPopulate;
  sort?: StrapiSort;
  fields?: StrapiFields;
  publicationState?: 'live' | 'preview';
  locale?: string;
  pagination?: {
    page?: number;
    pageSize?: number;
    withCount?: boolean;
    start?: number;
    limit?: number;
  };
}
