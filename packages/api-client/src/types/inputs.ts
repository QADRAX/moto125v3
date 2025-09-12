export type ConnectList =
  | { connect: string[]; disconnect?: string[] }
  | { disconnect: string[]; connect?: string[] }
  | { set: string[] };

export type MediaId = number | string;
export type MediaIdList = Array<number | string>;

export type ArticleDZTextInput = {
  __component: 'article-content.text-content';
  Text: string;
};

export type ArticleDZImageGridInput = {
  __component: 'article-content.image-grid-content';
};

export type ArticleDZFortDebInput = {
  __component: 'article-content.fortalezas-debilidades';
  Fortalezas?: { value: string }[];
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

export type TagItemInput =
  | { Value: string }
  | { value: string }
  | { name: string }
  | { label: string }
  | { text: string };

export interface ArticleCreateInput {
  slug: string;
  title?: string;
  publicationDate?: string;
  visible?: boolean;
  authorPhotos?: string | null;
  authorAction?: string | null;
  authorText?: string | null;
  youtubeLink?: string | null;
  coverImage?: MediaId | null;
  content?: ArticleContentBlockInput[];
  tags?: TagItemInput[];
  relatedMotos?: ConnectList;
  relatedCompanies?: ConnectList;
  articleType?: string | null;
}

export type ArticleUpdateInput = Partial<ArticleCreateInput>;

export interface CompanyCreateInput {
  name: string;
  phone?: string | null;
  url?: string | null;
  active?: boolean;
  description?: string | null;
  image?: MediaId | null;
}
export type CompanyUpdateInput = Partial<CompanyCreateInput>;
export type MotoNormativaInput = "Euro 1" | "Euro 2" | "Euro 3" | "Euro 4" | "Euro 5" | "Euro 5plus";

export interface MotoCreateInput {
  modelName: string;
  moto125Id: string;
  active?: boolean;
  priece?: number | null;
  description?: string | null;
  fullName?: string | null;
  fichaTecnica?: Record<string, unknown> | null;
  normativa?: MotoNormativaInput | null;
  images?: MediaIdList;
  company?: string | null;
  motoType?: string | null;
}
export type MotoUpdateInput = Partial<MotoCreateInput>;

export interface ArticleTypeCreateInput { name: string }
export type ArticleTypeUpdateInput = Partial<ArticleTypeCreateInput>;

export interface MotoTypeCreateInput {
  name: string;
  fullName?: string | null;
  image?: MediaId | null;
  motoClass?: string | null;
}
export type MotoTypeUpdateInput = Partial<MotoTypeCreateInput>;

export interface MotoClassCreateInput { name: string }
export type MotoClassUpdateInput = Partial<MotoClassCreateInput>;

export interface ConfigUpdateInput {
  siteName?: string | null;
  logo?: MediaId | null;
  favicon?: MediaId | null;
  metaTitleDefault?: string | null;
  metaDescriptionDefault?: string | null;
  metaImageDefault?: MediaId | null;
  twitterHandle?: string | null;
  openGraphTitle?: string | null;
  openGraphDescription?: string | null;
  openGraphImage?: MediaId | null;
  canonicalUrl?: string | null;
  googleAnalyticsId?: string | null;
  heroBannerImage?: MediaId | null;
  heroBannerTitle?: string | null;
  heroBannerSubtitle?: string | null;
}

export interface HomePageUpdateInput {
  featuredArticles?: {
    featuredArticle1?: string | null;
    featuredArticle2?: string | null;
    featuredArticle3?: string | null;
  } | null;
  top10speed?: {
    top1?: string | null; top1speed?: string | null;
    top2?: string | null; top2speed?: string | null;
    top3?: string | null; top3speed?: string | null;
    top4?: string | null; top4speed?: string | null;
    top5?: string | null; top5speed?: string | null;
    top6?: string | null; top6speed?: string | null;
    top7?: string | null; top7speed?: string | null;
    top8?: string | null; top8speed?: string | null;
    top9?: string | null; top9speed?: string | null;
    top10?: string | null; top10speed?: string | null;
  } | null;
}

export type OfertaDZInput = { __component: 'list.ofertas'; title?: string; content?: string; };
export interface PaginaOfertasUpdateInput {
  title?: string | null;
  content?: string | null;
  ofertas?: OfertaDZInput[];
}

export interface AboutUsPageUpdateInput {
  content?: string | null;
}
