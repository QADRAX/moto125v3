// Relaciones (Strapi v5 con documentId)
export type ConnectList =
  | { connect: string[]; disconnect?: string[] }
  | { disconnect: string[]; connect?: string[] }
  | { set: string[] };

// Media: acepta id numérico o documentId string (single o múltiple)
export type MediaId = number | string;
export type MediaIdList = Array<number | string>;

/** ==== Article: Dynamic Zone (inputs) ==== */
export type ArticleDZTextInput = {
  __component: 'article-content.text-content';
  Text: string;
};

export type ArticleDZImageGridInput = {
  __component: 'article-content.image-grid-content';
};

export type ArticleDZFortDebInput = {
  __component: 'article-content.fortalezas-debilidades';
  Fortalezas?: { value: string }[]; // al crear no se envía id
  Debilidades?: { value: string }[];
};

export type ArticleDZPrestacionesInput = {
  __component: 'article-content.prestaciones';
  prestaciones: Record<string, unknown>;
};

export type ArticleContentBlockInput =
  | ArticleDZTextInput
  | ArticleDZImageGridInput
  | ArticleDZFortDebInput
  | ArticleDZPrestacionesInput;

/** Tags (componente repeatable). En tu proyecto parece 'Value' capitalizado. */
export type TagItemInput =
  | { Value: string }
  | { value: string }
  | { name: string }
  | { label: string }
  | { text: string };

/** ==== Article inputs ==== */
export interface ArticleCreateInput {
  slug: string;
  title?: string;
  publicationDate?: string;      // YYYY-MM-DD
  visible?: boolean;
  authorPhotos?: string | null;
  authorAction?: string | null;
  authorText?: string | null;
  youtubeLink?: string | null;

  // media / componentes / relaciones
  coverImage?: MediaId | null;   // id o documentId de media
  content?: ArticleContentBlockInput[];
  tags?: TagItemInput[];

  // relaciones
  relatedMotos?: ConnectList;        // many-to-many (documentId[])
  relatedCompanies?: ConnectList;    // many-to-many (documentId[])
  articleType?: string | null;       // many-to-one (documentId o null)
}

export type ArticleUpdateInput = Partial<ArticleCreateInput>;

/** ==== Company inputs ==== */
export interface CompanyCreateInput {
  name: string;
  phone?: string | null;
  url?: string | null;
  active?: boolean;
  description?: any | null;     // blocks
  image?: MediaId | null;       // media single
}
export type CompanyUpdateInput = Partial<CompanyCreateInput>;

/** ==== Moto inputs ==== */
export interface MotoCreateInput {
  modelName: string;
  moto125Id: string;
  active?: boolean;
  priece?: number | null;
  description?: string | null;
  fullName?: string | null;
  fichaTecnica?: Record<string, unknown> | null;

  images?: MediaIdList;      // media multiple
  company?: string | null;   // documentId (many-to-one)
  motoType?: string | null;  // documentId (many-to-one)
  // articles: se gestionan desde el artículo normalmente
}
export type MotoUpdateInput = Partial<MotoCreateInput>;

/** ==== Taxonomías inputs ==== */
export interface ArticleTypeCreateInput { name: string }
export type ArticleTypeUpdateInput = Partial<ArticleTypeCreateInput>;

export interface MotoTypeCreateInput {
  name: string;
  fullName?: string | null;
  image?: MediaId | null;
  motoClass?: string | null; // documentId
}
export type MotoTypeUpdateInput = Partial<MotoTypeCreateInput>;

export interface MotoClassCreateInput { name: string }
export type MotoClassUpdateInput = Partial<MotoClassCreateInput>;

/** ==== Single type: Config ==== */
export interface ConfigUpdateInput {
  DefaultAvatar?: MediaId | null;
}
