// WP RSS item: Feed RSS obtenido directamente de Wordpress

import { BrandModels } from "./extractMarcasModelos";

export interface RSSItemCategory {
  _: string;
}

export interface RssItem {
  title: string;
  link: string;
  "content:encoded": string;
  "wp:post_id": string;
  "wp:post_name": string;
  "wp:status": string;
  category?: RSSItemCategory[] | RSSItemCategory;
  pubDate: string;
}

export interface RssChannel {
  item: RssItem[];
}

export interface RssResult {
  rss: {
    channel: RssChannel;
  };
}

// Normalized Posts: Posts normalizados en base a unas categorias y con html sanitizado.

export interface Tag {
  name: string;
}

export type PostCategory =
  | "ACTUALIDAD"
  | "REPORTAJES"
  | "PRUEBAS"
  | "COMPARATIVAS"
  | "PRESENTACIONES"
  | "INICIACIÓN"
  | "TÉCNICA";

export interface Post {
  id: number;
  title: string;
  link: string;
  slug: string;
  publicationDate: Date;
  category: PostCategory[];
  tags: Tag[];
  content: string;
}

// Moto125 Posts

export interface DebilidadesFortalezas {
  debilidades: string[];
  fortalezas: string[];
}

export interface Creditos {
  authorText: string;
  authorAccion: string;
  authorPhotos: string;
}

export interface Moto125Post {
  id: number;
  slug: string;

  title: string;
  image: string;

  publicationDate: Date;

  category: PostCategory[];
  tags: string[];

  rawHtmlContent: string;
  htmlContent: string;
  mdContent: string;

  creditos?: Creditos;
  prestaciones?: Prestaciones;
  debilidadesFortalezas?: DebilidadesFortalezas;

  marcasModelos?: BrandModels[];

  youtubeLink?: string;
  fichaTecnicaId?: string;
}

// Files

export interface FileItem {
  filePath: string;
  fileName: string;
  folderPath: string;
  contentType: string;
}

// Fichas tecnicas

export interface Picture {
  url: string;
  isMainPicture: boolean;
}

export interface Company {
  id: number;
  name: string;
  webUrl: string;
  contactPhoneNumber: string;
  numberOfMotorcycles: number;
  numberOfActiveMotorcycles: number;
  pictures: Picture[];
}

export interface Picture {
  url: string;
  isMainPicture: boolean;
}

export interface Company {
  id: number;
  name: string;
  webUrl: string;
  contactPhoneNumber: string;
  numberOfMotorcycles: number;
  numberOfActiveMotorcycles: number;
  pictures: Picture[];
}

export interface MotorbikeClass {
  id: number;
  name: string;
}

export interface MotorcycleType {
  id: number;
  name: string;
  motorbikeClass: MotorbikeClass;
}

export interface FuelFeeding {
  id: number;
  name: string;
}

export interface Refrigeration {
  id: number;
  name: string;
}

export interface Gearbox {
  id: number;
  name: string;
}

export interface DistributionClass {
  id: number;
  name: string;
}

export interface Distribution {
  id: number;
  name: string;
  distributionClass: DistributionClass;
}

export interface CombustionEngine {
  numberOfCylinders: number;
  pistonDiameter: number;
  pistonStroke: number;
  compressionRatio: number;
  engineDisplacement: number;
  horsePower: number;
  powerRPM: number;
  maxTorqueNP: number;
  maxTorqueRPM: number;
  ignitionType: string;
  fuelFeeding: FuelFeeding;
  refrigeration: Refrigeration;
  gearbox: Gearbox;
  distribution: Distribution;
}

export interface BatteryType {
  id: number;
  name: string;
}

export interface ElectricEngine {
  numberOfMotors: number;
  powerKW: number;
  powerPM: number;
  torque: number;
  rpm: number;
  batteryVolts: number;
  batteryCapacity: number;
  batteryType: BatteryType;
}

export interface MotorcycleFrameType {
  id: number;
  name: string;
}

export interface MotorcycleFrameMaterial {
  id: number;
  name: string;
}

export interface FrontSuspensionType {
  id: number;
  name: string;
}

export interface BreakType {
  id: number;
  name: string;
}

export interface Photo {
  url: string;
  isMainPicture: boolean;
}

export interface Motorcycle {
  id: number;
  legacyId: number;
  isActive: boolean;
  modelName: string;
  priece: number;
  time50m: number;
  time100m: number;
  time400m: number;
  time1000m: number;
  time100kmh: number;
  topSpeedKmh: number;
  consumeLkm: number;
  autonomyKm: number;
  totalWeight: number;
  rearTrainDistribution: number;
  frontTrainDistribution: number;
  rearSuspensionTravel: number;
  rearNumSuspensions: number;
  frontSuspensionTravel: number;
  rearBreakDiameter: number;
  frontBreakDiameter: number;
  rearWheelBallon: string;
  rearWheelDiameter: number;
  frontWheelBallon: string;
  frontWheelDiameter: number;
  longitude: number;
  height: number;
  width: number;
  wheelbase: number;
  seatHeight: number;
  depositCapacity: number;
  descrition: string;
  company: Company;
  motorcycleType: MotorcycleType;
  combustionEngine?: CombustionEngine;
  electricEngine?: ElectricEngine;
  motorcycleFrameType: MotorcycleFrameType;
  motorcycleFrameMaterial: MotorcycleFrameMaterial;
  frontSuspensionType: FrontSuspensionType;
  frontBreakType: BreakType;
  rearBreakType: BreakType;
  photos: Photo[];
}

// Strapi moto

export interface Prestaciones {
  acc50m: string;
  acc100m: string;
  acc400m: string;
  acc1000m: string;
  acc100kmh: string;
  maxSpeed: string;
  consumo: string;
  autonomia: string;
  pesoTotal: string;
  repartoFrontral: string;
  repartoTrasero: string;
}

export interface StrapiCombustionEngine {
  numberOfCylinders: number;
  pistonDiameter: number;
  pistonStroke: number;
  compressionRatio: number;
  engineDisplacement: number;
  horsePower: number;
  powerRPM: number;
  maxTorqueNP: number;
  maxTorqueRPM: number;
  ignitionType: string;
  fuelFeedingName: string;
  refrigerationName: string;
  gearboxName: string;
  distributionName: string;
}

export interface StrapiElectricEngine {
  numberOfMotors: number;
  powerKW: number;
  powerPM: number;
  torque: number;
  rpm: number;
  batteryVolts: number;
  batteryCapacity: number;
  batteryName: string;
}

export interface StrapiFichaTecnica {
  totalWeight: number;
  rearTrainDistribution: number;
  frontTrainDistribution: number;
  rearSuspensionTravel: number;
  rearNumSuspensions: number;
  frontSuspensionTravel: number;
  rearBreakDiameter: number;
  frontBreakDiameter: number;
  rearWheelBallon: string;
  rearWheelDiameter: number;
  frontWheelBallon: string;
  frontWheelDiameter: number;
  longitude: number;
  height: number;
  width: number;
  wheelbase: number;
  seatHeight: number;
  depositCapacity: number;
  combustionEngine?: StrapiCombustionEngine;
  electricEngine?: StrapiElectricEngine;
  motorcycleFrameTypeName: string;
  motorcycleFrameMaterialName: string;
  frontSuspensionTypeName: string;
  frontBreakTypeName: string;
  rearBreakTypeName: string;
}

export interface StrapiMotorcycle {
  id: number;
  legacyId: number;
  isActive: boolean;
  modelName: string;
  priece: number;
  companyName: string;
  fichaTecnica: StrapiFichaTecnica;
  description: string;
  motorcycleTypeName: string;
}

// Strapi

export interface CompanyData {
  name: string;
  image?: string | number; // Can be a URL or an ID
  phone: string;
  motos?: (string | number)[]; // Array of strings or IDs
  articles?: (string | number)[]; // Array of strings or IDs
  url: string;
  locale?: string;
  localizations?: (string | number)[]; // Array of strings or IDs
  active: boolean;
}

export interface MotoData {
  modelName: string;
  fullName: string;
  priece: number;
  fichaTecnica: any;
  motoType: any;
  moto125Id: string;
  company: any;
  active: boolean;
  description: string;
  images: any;
}

export interface CreateCompanyRequest {
  data: CompanyData;
}

export interface CreateMotoRequest {
  data: MotoData;
}
