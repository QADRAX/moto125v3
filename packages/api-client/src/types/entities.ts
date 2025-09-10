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
  documentId?: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

export interface Company {
  id: number;
  documentId?: string;
  name: string;
  phone?: string | null;
  url?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  description?: any | null;
  image?: StrapiFile | null;
}

export interface MotoClass {
  id: number;
  documentId?: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

export interface MotoType {
  id: number;
  documentId?: string;
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

export interface Moto {
  id: number;
  documentId?: string;
  modelName: string;
  priece?: number | null; // número en tu payload
  fichaTecnica?: MotoFichaTecnica | null;
  moto125Id: string;
  active: boolean;
  description?: string | null;
  fullName?: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;

  images?: StrapiFile[]; // media[]
  company?: Company | null; // relation 1
  motoType?: MotoType | null; // relation 1
  articles?: Article[]; // si alguna vez lo pueblas
}

export interface TagItem {
  id: number;
  Value?: string | null;
}

export interface Article {
  id: number;
  documentId?: string;
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

export interface Config {
  id: number;
  documentId?: string;
  DefaultAvatar?: StrapiFile | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

export type ArticleEntry = StrapiEntry<Article>;
export type MotoEntry = StrapiEntry<Moto>;
export type CompanyEntry = StrapiEntry<Company>;
export type ConfigEntry = StrapiEntry<Config>;
