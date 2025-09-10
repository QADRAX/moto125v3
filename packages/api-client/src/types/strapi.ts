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
  createdAt: string;
  updatedAt: string;
}

export interface StrapiMediaRelation {
  data: null | {
    id: number;
    attributes: StrapiFileAttributes;
  };
}

export interface StrapiMediaMultiRelation {
  data: Array<{
    id: number;
    attributes: StrapiFileAttributes;
  }>;
}

export interface StrapiRelation<TAttrs> {
  data: null | {
    id: number;
    attributes: TAttrs;
  };
}

export interface StrapiManyRelation<TAttrs> {
  data: Array<{
    id: number;
    attributes: TAttrs;
  }>;
}

export interface StrapiEntry<T> {
  id: number;
  attributes: T;
}

export interface StrapiMeta {
  pagination?: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
}

export interface StrapiCollectionResponse<T> {
  data: Array<StrapiEntry<T>>;
  meta: StrapiMeta;
}

export interface StrapiSingleResponse<T> {
  data: StrapiEntry<T> | null;
  meta: StrapiMeta;
}

/** Loose typing for Strapi filters / sort / populate / fields / pagination. */
export type StrapiFilters = Record<string, any>;
export type StrapiPopulate =
  | '*'
  | string
  | string[]
  | Record<string, true | { populate?: StrapiPopulate }>;
export type StrapiSort = string | string[];
export type StrapiFields = string[];

/** Common query params for Strapi REST. */
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
