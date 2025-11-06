import { StrapiEntry, StrapiFile } from "./strapi";

export interface DZBase {
  id: number;
  __component: string;
}

export interface TextContentBlock extends DZBase {
  __component: "article-content.text-content";
  Text?: string;
}

export interface ImageGridContentBlock extends DZBase {
  __component: "article-content.image-grid-content";
  [k: string]: unknown;
}

export interface ArticlePrestaciones {
  acc50m?: string;
  acc100m?: string;
  acc400m?: string;
  acc1000m?: string;
  acc100kmh?: string;
  maxSpeed?: string;
  consumo?: string;
  autonomia?: string;
  pesoTotal?: string;
  repartoTrasero?: string;
  repartoFrontral?: string;
}

export interface PrestacionesContentBlock extends DZBase {
  __component: "article-content.prestaciones";
  prestaciones?: ArticlePrestaciones | null;
}

export interface FortalezaItem {
  id: number;
  value: string;
}
export interface DebilidadItem {
  id: number;
  value: string;
}

export interface FortalezasDebilidadesContentBlock extends DZBase {
  __component: "article-content.fortalezas-debilidades";
  Fortalezas?: FortalezaItem[];
  Debilidades?: DebilidadItem[];
}

export type ArticleContentBlock =
  | TextContentBlock
  | ImageGridContentBlock
  | PrestacionesContentBlock
  | FortalezasDebilidadesContentBlock;

export interface ArticleType {
  id: number;
  documentId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

export interface Company {
  id: number;
  documentId: string;
  name: string;
  phone?: string | null;
  url?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  description?: string | null;
  image?: StrapiFile | null;
  articles?: Article[] | null;
}

export interface MotoClass {
  id: number;
  documentId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  image?: StrapiFile | null;
}

export interface MotoType {
  id: number;
  documentId: string;
  name?: string | null;
  fullName?: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  motoClass?: MotoClass | null;
  image?: StrapiFile | null;
}

export interface CombustionEngineSpec {
  powerRPM?: number;
  horsePower?: number;
  gearboxName?: string;
  maxTorqueNP?: number;
  ignitionType?: string | null;
  maxTorqueRPM?: number;
  pistonStroke?: number;
  pistonDiameter?: number;
  fuelFeedingName?: string;
  compressionRatio?: number;
  distributionName?: string;
  numberOfCylinders?: number;
  refrigerationName?: string;
  engineDisplacement?: number;
}

export interface ElectricEngineSpec {
  rpm?: number;
  torque?: number;
  powerKW?: number;
  powerPM?: number;
  batteryName?: string;
  batteryVolts?: number;
  numberOfMotors?: number;
  batteryCapacity?: number;
}

export interface MotoFichaTecnica {
  width?: number;
  height?: number;
  longitude?: number;
  wheelbase?: number;
  seatHeight?: number;
  totalWeight?: number;
  depositCapacity?: number;
  rearWheelBallon?: string;
  frontWheelBallon?: string;
  rearBreakDiameter?: number;
  rearBreakTypeName?: string;
  frontBreakDiameter?: number;
  frontBreakTypeName?: string;
  rearNumSuspensions?: number;
  rearSuspensionTravel?: number;
  frontSuspensionTravel?: number;
  rearTrainDistribution?: number | null;
  frontTrainDistribution?: number | null;
  frontSuspensionTypeName?: string;
  motorcycleFrameTypeName?: string;
  motorcycleFrameMaterialName?: string;
  combustionEngine?: CombustionEngineSpec;
  electricEngine?: ElectricEngineSpec;
}

export type MotoNormativa =
  | "Euro 1" | "Euro 2" | "Euro 3" | "Euro 4" | "Euro 5" | "Euro 5plus";

export interface Moto {
  id: number;
  documentId: string;
  modelName: string;
  priece?: number | null;
  fichaTecnica?: MotoFichaTecnica | null;
  moto125Id: string;
  active: boolean;
  description?: string | null;
  fullName?: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  images?: StrapiFile[];
  company?: Company | null;
  motoType?: MotoType | null;
  articles?: Article[];
  normativa?: MotoNormativa | null;
}

export interface TagItem {
  id: number;
  Value?: string | null;
}

export interface Article {
  id: number;
  documentId: string;
  slug: string;
  title?: string | null;
  publicationDate?: string | null;
  visible: boolean;
  authorPhotos?: string | null;
  authorAction?: string | null;
  authorText?: string | null;
  youtubeLink?: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  tags?: TagItem[];
  coverImage: StrapiFile;
  relatedMotos?: Moto[];
  relatedCompanies?: Company[];
  articleType?: ArticleType | null;
  content?: ArticleContentBlock[];
}

export interface FeaturedArticlesComponent {
  id: number;
  featuredArticle1?: Article | null;
  featuredArticle2?: Article | null;
  featuredArticle3?: Article | null;
}
export interface Top10MotosSpeedComponent {
  id: number;
  top1?: Moto | null; top1speed?: string | null;
  top2?: Moto | null; top2speed?: string | null;
  top3?: Moto | null; top3speed?: string | null;
  top4?: Moto | null; top4speed?: string | null;
  top5?: Moto | null; top5speed?: string | null;
  top6?: Moto | null; top6speed?: string | null;
  top7?: Moto | null; top7speed?: string | null;
  top8?: Moto | null; top8speed?: string | null;
  top9?: Moto | null; top9speed?: string | null;
  top10?: Moto | null; top10speed?: string | null;
}

export interface HomePage {
  id: number; documentId?: string;
  createdAt: string; updatedAt: string; publishedAt?: string | null;
  featuredArticles?: FeaturedArticlesComponent | null;
  top10speed?: Top10MotosSpeedComponent | null;
}

export interface PaginaOfertas {
  id: number; documentId?: string;
  createdAt: string; updatedAt: string; publishedAt?: string | null;
  title?: string | null;
  content?: string | null;
  ofertas?: Array<{
    id: number;
    __component: "list.ofertas";
    title?: string | null;
    content?: string | null;
  }>;
}

export interface AboutUsPage {
  id: number; documentId?: string;
  createdAt: string; updatedAt: string; publishedAt?: string | null;
  content?: string | null;
}

export interface Config {
  id: number; 
  documentId: string;
  createdAt: string; 
  updatedAt: string; 
  publishedAt?: string | null;
  siteName?: string | null;
  logo?: StrapiFile | null;
  favicon?: StrapiFile | null;
  metaTitleDefault?: string | null;
  metaDescriptionDefault?: string | null;
  metaImageDefault?: StrapiFile | null;
  twitterHandle?: string | null;
  openGraphTitle?: string | null;
  openGraphDescription?: string | null;
  openGraphImage?: StrapiFile | null;
  canonicalUrl?: string | null;
  googleAnalyticsId?: string | null;
  heroBannerImage?: StrapiFile | null;
  heroBannerTitle?: string | null;
  heroBannerSubtitle?: string | null;
}

export type ArticleEntry = StrapiEntry<Article>;
export type MotoEntry = StrapiEntry<Moto>;
export type CompanyEntry = StrapiEntry<Company>;
export type ConfigEntry = StrapiEntry<Config>;
export type HomePageEntry = StrapiEntry<HomePage>;
export type PaginaOfertasEntry = StrapiEntry<PaginaOfertas>;
export type AboutUsPageEntry = StrapiEntry<AboutUsPage>;