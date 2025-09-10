import {
  StrapiManyRelation,
  StrapiRelation,
} from './strapi';

/** Article content blocks (Dynamic Zone) */

export interface TextContentBlock {
  __component: 'article-content.text-content';
  Text?: string; // richtext in Strapi; delivered as HTML string
}

export interface ImageGridContentBlock {
  __component: 'article-content.image-grid-content';
  // No attributes defined yet; extend later if you add images/captions.
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

export interface PrestacionesContentBlock {
  __component: 'article-content.prestaciones';
  prestaciones?: ArticlePrestaciones | null;
}

/** We don't have the exact shapes of list.foralezas-list / list.debilidades-list.
 * Keep them generic and offer mappers in utils.
 */
export type FortalezaItem = Record<string, any>;
export type DebilidadItem = Record<string, any>;

export interface FortalezasDebilidadesContentBlock {
  __component: 'article-content.fortalezas-debilidades';
  Fortalezas?: FortalezaItem[];
  Debilidades?: DebilidadItem[];
}

export type ArticleContentBlock =
  | TextContentBlock
  | ImageGridContentBlock
  | PrestacionesContentBlock
  | FortalezasDebilidadesContentBlock;

/** Component list.tag-list (unknown shape), we normalize in utils. */
export type TagComponentItem = Record<string, any>;

/** Related entities light attrs */
export interface CompanyLite {
  name?: string;
  url?: string | null;
  active?: boolean;
  // description is "blocks" in Strapi; omit here.
}

export interface MotoTypeLite {
  name?: string;
  fullName?: string | null;
}

export interface MotoClassLite {
  name: string;
}

export interface ArticleTypeAttrs {
  name?: string;
  // articles mappedBy
}

export interface CompanyAttrs extends CompanyLite {
  phone?: string | null;
  image?: any;
  articles?: StrapiManyRelation<ArticleAttrs>;
  motos?: StrapiManyRelation<MotoAttrs>;
  description?: any; // blocks
}

export interface MotoClassAttrs extends MotoClassLite {
  image?: any;
  motoTypes?: StrapiManyRelation<MotoTypeAttrs>;
}

export interface MotoTypeAttrs extends MotoTypeLite {
  image?: any;
  motos?: StrapiManyRelation<MotoAttrs>;
  motoClass?: StrapiRelation<MotoClassAttrs>;
}

/** Ficha técnica types (from your JSON shape) */
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

/** Article */
export interface ArticleAttrs {
  slug: string;
  title?: string | null;
  publicationDate?: string | null; // date only (YYYY-MM-DD)
  visible: boolean;
  coverImage: any; // relation resolved via populate
  authorPhotos?: string | null;
  authorAction?: string | null;
  content?: ArticleContentBlock[];
  tags?: TagComponentItem[]; // legacy component
  relatedMotos?: any;        // relation
  relatedCompanies?: any;    // relation
  authorText?: string | null;
  articleType?: any;         // relation
  youtubeLink?: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

/** Moto */
export interface MotoAttrs {
  modelName: string;
  images?: any; // media[]
  priece?: string | number | null; // "priece" per schema (typo)
  fichaTecnica?: MotoFichaTecnica | null;
  motoType?: any; // relation
  moto125Id: string;
  articles?: any; // relation
  company?: any; // relation
  active: boolean;
  description?: string | null;
  fullName?: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

/** Config (singleType) */
export interface ConfigAttrs {
  DefaultAvatar?: any; // media
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}
