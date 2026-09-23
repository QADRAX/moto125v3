import { z } from "zod";
import type {
  AboutUsPageUpdateInput,
  ArticleContentBlockInput,
  ArticleCreateInput,
  ArticleTypeCreateInput,
  ArticleTypeUpdateInput,
  ArticleUpdateInput,
  CompanyCreateInput,
  CompanyUpdateInput,
  ConfigUpdateInput,
  ConnectList,
  HomePageUpdateInput,
  MediaId,
  MotoClassCreateInput,
  MotoClassUpdateInput,
  MotoCreateInput,
  MotoFichaTecnica,
  MotoTypeCreateInput,
  MotoTypeUpdateInput,
  MotoUpdateInput,
  OfertaDZInput,
  PaginaOfertasUpdateInput,
  StrapiQueryParams,
  TagItemInput,
  CombustionEngineSpec,
  ElectricEngineSpec,
} from "@moto125/api-client";
import type { Id, UploadOptions } from "@moto125/admin-api-client";

/** StrapiQueryParams tal cual en @moto125/api-client. */
export const strapiQueryParamsSchema: z.ZodType<StrapiQueryParams> = z.object({
  filters: z
    .record(z.any())
    .optional()
    .describe(
      "Filtros Strapi. Ver resources moto125://docs/filtros-articulos y filtros-catalogo."
    ),
  populate: z
    .union([
      z.literal("*"),
      z.string(),
      z.array(z.string()),
      z.record(z.any()),
    ])
    .optional()
    .describe("Populate Strapi. En list_* el MCP aplica populate ligero si se omite."),
  sort: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe("Orden Strapi, ej. publicationDate:desc"),
  fields: z
    .array(z.string())
    .optional()
    .describe("Campos a devolver. Listas usan fields ligeros si se omite."),
  publicationState: z
    .enum(["live", "preview"])
    .optional()
    .describe("live | preview (default MCP: preview)"),
  locale: z.string().optional().describe('Locale (default MCP: "es")'),
  pagination: z
    .object({
      page: z.number().optional().describe("Página 1-based"),
      pageSize: z.number().optional().describe("Tamaño (máx. ~100)"),
      withCount: z.boolean().optional(),
      start: z.number().optional(),
      limit: z.number().optional(),
    })
    .optional()
    .describe("Paginación Strapi"),
});

export const mediaIdSchema: z.ZodType<MediaId> = z
  .union([z.number(), z.string()])
  .describe("Id de media Strapi (number o string)");

export const connectListSchema: z.ZodType<ConnectList> = z.union([
  z.object({
    connect: z.array(z.string()).describe("documentIds a conectar"),
    disconnect: z.array(z.string()).optional(),
  }),
  z.object({
    disconnect: z.array(z.string()),
    connect: z.array(z.string()).optional(),
  }),
  z.object({
    set: z
      .array(z.string())
      .describe("Sustituye la relación completa por estos documentIds"),
  }),
]);

export const tagItemInputSchema: z.ZodType<TagItemInput> = z.union([
  z.object({ Value: z.string() }).describe("Formato preferido (migraciones/CMS)"),
  z.object({ value: z.string() }),
  z.object({ name: z.string() }),
  z.object({ label: z.string() }),
  z.object({ text: z.string() }),
]);

export const articleContentBlockInputSchema: z.ZodType<ArticleContentBlockInput> =
  z.discriminatedUnion("__component", [
    z.object({
      __component: z.literal("article-content.text-content"),
      Text: z
        .string()
        .describe("Cuerpo del bloque (campo Text con T mayúscula)"),
    }),
    z.object({
      __component: z.literal("article-content.image-grid-content"),
    }),
    z.object({
      __component: z.literal("article-content.fortalezas-debilidades"),
      Fortalezas: z
        .array(z.object({ value: z.string() }))
        .optional()
        .describe("Lista de fortalezas"),
      Debilidades: z
        .array(z.object({ value: z.string() }))
        .optional()
        .describe("Lista de debilidades"),
    }),
    z.object({
      __component: z.literal("article-content.prestaciones"),
      prestaciones: z
        .record(z.unknown())
        .describe(
          "acc50m, acc100m, acc400m, acc1000m, acc100kmh, maxSpeed, consumo, autonomia, pesoTotal, repartoTrasero, repartoFrontral"
        ),
    }),
  ]);

const articleCreateObject = z.object({
  slug: z.string().describe("Slug URL único (obligatorio en create)"),
  title: z.string().optional().describe("Título del artículo"),
  publicationDate: z
    .string()
    .optional()
    .describe("Fecha editorial YYYY-MM-DD (no es publishedAt)"),
  visible: z
    .boolean()
    .optional()
    .describe("Si false, la UI pública lo oculta"),
  authorPhotos: z.string().nullable().optional(),
  authorAction: z.string().nullable().optional(),
  authorText: z.string().nullable().optional(),
  youtubeLink: z.string().nullable().optional(),
  coverImage: mediaIdSchema
    .nullable()
    .optional()
    .describe("Id de fichero en Media Library"),
  content: z
    .array(articleContentBlockInputSchema)
    .optional()
    .describe("Dynamic zone de bloques de contenido"),
  tags: z.array(tagItemInputSchema).optional(),
  relatedMotos: connectListSchema.optional(),
  relatedCompanies: connectListSchema.optional(),
  articleType: z
    .string()
    .nullable()
    .optional()
    .describe("documentId de article-type"),
});

export const articleCreateInputSchema: z.ZodType<ArticleCreateInput> =
  articleCreateObject;
export const articleUpdateInputSchema: z.ZodType<ArticleUpdateInput> =
  articleCreateObject.partial();

const companyCreateObject = z.object({
  name: z.string().describe("Nombre de la marca"),
  phone: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  active: z.boolean().optional(),
  description: z.string().nullable().optional(),
  image: mediaIdSchema.nullable().optional(),
});

export const companyCreateInputSchema: z.ZodType<CompanyCreateInput> =
  companyCreateObject;
export const companyUpdateInputSchema: z.ZodType<CompanyUpdateInput> =
  companyCreateObject.partial();

const motoNormativaSchema = z.enum([
  "Euro 1",
  "Euro 2",
  "Euro 3",
  "Euro 4",
  "Euro 5",
  "Euro 5plus",
]);

const motoEngineTypeSchema = z.enum([
  "combustión",
  "eléctrico",
  "hibrido",
]);

/** Unidades = las que pinta MotoSpecs / MotoProductJsonLd (UI). No convertir. */
const combustionEngineSchema: z.ZodType<CombustionEngineSpec> = z.object({
  powerRPM: z.number().optional().describe("rpm a potencia máx."),
  horsePower: z.number().optional().describe("CV (no kW)"),
  gearboxName: z.string().optional(),
  maxTorqueNP: z.number().optional().describe("N·m"),
  ignitionType: z.string().nullable().optional(),
  maxTorqueRPM: z.number().optional().describe("rpm a par máx."),
  pistonStroke: z.number().optional().describe("mm"),
  pistonDiameter: z.number().optional().describe("mm"),
  fuelFeedingName: z.string().optional(),
  compressionRatio: z
    .number()
    .optional()
    .describe("ratio X (UI muestra X:1)"),
  distributionName: z.string().optional(),
  numberOfCylinders: z.number().optional(),
  refrigerationName: z.string().optional(),
  engineDisplacement: z.number().optional().describe("cc"),
});

const electricEngineSchema: z.ZodType<ElectricEngineSpec> = z.object({
  rpm: z.number().optional().describe("rpm"),
  torque: z.number().optional().describe("N·m"),
  powerKW: z.number().optional().describe("kW continuo"),
  powerPM: z.number().optional().describe("kW pico"),
  batteryName: z.string().optional(),
  batteryVolts: z.number().optional().describe("V"),
  numberOfMotors: z.number().optional(),
  batteryCapacity: z.number().optional().describe("kWh (no Ah)"),
});

export const motoFichaTecnicaSchema: z.ZodType<MotoFichaTecnica> = z.object({
  width: z.number().optional().describe("mm"),
  height: z.number().optional().describe("mm"),
  longitude: z.number().optional().describe("mm (longitud)"),
  wheelbase: z.number().optional().describe("mm"),
  seatHeight: z.number().optional().describe("mm"),
  totalWeight: z.number().optional().describe("kg"),
  depositCapacity: z.number().optional().describe("L"),
  rearWheelBallon: z.string().optional().describe("ej. 140/70-14"),
  frontWheelBallon: z.string().optional().describe("ej. 110/70-16"),
  rearBreakDiameter: z.number().optional().describe("mm"),
  rearBreakTypeName: z.string().optional(),
  frontBreakDiameter: z.number().optional().describe("mm"),
  frontBreakTypeName: z.string().optional(),
  rearNumSuspensions: z.number().optional(),
  rearSuspensionTravel: z.number().optional().describe("mm"),
  frontSuspensionTravel: z.number().optional().describe("mm"),
  rearTrainDistribution: z
    .number()
    .nullable()
    .optional()
    .describe("% peso tren trasero"),
  frontTrainDistribution: z
    .number()
    .nullable()
    .optional()
    .describe("% peso tren delantero"),
  frontSuspensionTypeName: z.string().optional(),
  motorcycleFrameTypeName: z.string().optional(),
  motorcycleFrameMaterialName: z.string().optional(),
  combustionEngine: combustionEngineSchema.optional(),
  electricEngine: electricEngineSchema.optional(),
});

const motoCreateObject = z.object({
  modelName: z.string(),
  moto125Id: z.string().describe("Id externo estable"),
  active: z.boolean().optional(),
  year: z
    .number()
    .int()
    .nullable()
    .optional()
    .describe("Año de generación/modelo (no va en modelName)"),
  engineType: motoEngineTypeSchema
    .nullable()
    .optional()
    .describe("combustión | eléctrico | hibrido"),
  priece: z
    .number()
    .nullable()
    .optional()
    .describe("Precio (nombre histórico priece en el SDK)"),
  description: z.string().nullable().optional(),
  fullName: z.string().nullable().optional(),
  fichaTecnica: motoFichaTecnicaSchema
    .nullable()
    .optional()
    .describe(
      "MotoFichaTecnica (UI). Unidades fijas: mm/kg/L/CV/N·m/cc/kW/kWh/%. Ver moto125://docs/ficha-tecnica."
    ),
  normativa: motoNormativaSchema.nullable().optional(),
  images: z.array(mediaIdSchema).optional(),
  company: z.string().nullable().optional().describe("documentId marca"),
  motoType: z.string().nullable().optional().describe("documentId tipo"),
});

export const motoCreateInputSchema: z.ZodType<MotoCreateInput> =
  motoCreateObject;
export const motoUpdateInputSchema: z.ZodType<MotoUpdateInput> =
  motoCreateObject.partial();

const articleTypeCreateObject = z.object({
  name: z
    .string()
    .describe("Ej. PRUEBAS, ACTUALIDAD, REPORTAJES, COMPARATIVAS…"),
});
export const articleTypeCreateInputSchema: z.ZodType<ArticleTypeCreateInput> =
  articleTypeCreateObject;
export const articleTypeUpdateInputSchema: z.ZodType<ArticleTypeUpdateInput> =
  articleTypeCreateObject.partial();

const motoTypeCreateObject = z.object({
  name: z.string(),
  fullName: z.string().nullable().optional(),
  image: mediaIdSchema.nullable().optional(),
  motoClass: z.string().nullable().optional().describe("documentId clase"),
});
export const motoTypeCreateInputSchema: z.ZodType<MotoTypeCreateInput> =
  motoTypeCreateObject;
export const motoTypeUpdateInputSchema: z.ZodType<MotoTypeUpdateInput> =
  motoTypeCreateObject.partial();

const motoClassCreateObject = z.object({ name: z.string() });
export const motoClassCreateInputSchema: z.ZodType<MotoClassCreateInput> =
  motoClassCreateObject;
export const motoClassUpdateInputSchema: z.ZodType<MotoClassUpdateInput> =
  motoClassCreateObject.partial();

export const configUpdateInputSchema: z.ZodType<ConfigUpdateInput> = z.object({
  siteName: z.string().nullable().optional(),
  logo: mediaIdSchema.nullable().optional(),
  favicon: mediaIdSchema.nullable().optional(),
  metaTitleDefault: z.string().nullable().optional(),
  metaDescriptionDefault: z.string().nullable().optional(),
  metaImageDefault: mediaIdSchema.nullable().optional(),
  twitterHandle: z.string().nullable().optional(),
  openGraphTitle: z.string().nullable().optional(),
  openGraphDescription: z.string().nullable().optional(),
  openGraphImage: mediaIdSchema.nullable().optional(),
  canonicalUrl: z.string().nullable().optional(),
  googleAnalyticsId: z.string().nullable().optional(),
  heroBannerImage: mediaIdSchema.nullable().optional(),
  heroBannerTitle: z.string().nullable().optional(),
  heroBannerSubtitle: z.string().nullable().optional(),
});

export const homePageUpdateInputSchema: z.ZodType<HomePageUpdateInput> = z.object(
  {
    featuredArticles: z
      .object({
        featuredArticle1: z.string().nullable().optional(),
        featuredArticle2: z.string().nullable().optional(),
        featuredArticle3: z.string().nullable().optional(),
      })
      .nullable()
      .optional()
      .describe("documentIds de artículos destacados"),
    top10speed: z
      .object({
        top1: z.string().nullable().optional(),
        top1speed: z.string().nullable().optional(),
        top2: z.string().nullable().optional(),
        top2speed: z.string().nullable().optional(),
        top3: z.string().nullable().optional(),
        top3speed: z.string().nullable().optional(),
        top4: z.string().nullable().optional(),
        top4speed: z.string().nullable().optional(),
        top5: z.string().nullable().optional(),
        top5speed: z.string().nullable().optional(),
        top6: z.string().nullable().optional(),
        top6speed: z.string().nullable().optional(),
        top7: z.string().nullable().optional(),
        top7speed: z.string().nullable().optional(),
        top8: z.string().nullable().optional(),
        top8speed: z.string().nullable().optional(),
        top9: z.string().nullable().optional(),
        top9speed: z.string().nullable().optional(),
        top10: z.string().nullable().optional(),
        top10speed: z.string().nullable().optional(),
      })
      .nullable()
      .optional()
      .describe("documentIds de motos + velocidades"),
  }
);

export const ofertaDZInputSchema: z.ZodType<OfertaDZInput> = z.object({
  __component: z.literal("list.ofertas"),
  title: z.string().optional(),
  content: z.string().optional(),
});

export const paginaOfertasUpdateInputSchema: z.ZodType<PaginaOfertasUpdateInput> =
  z.object({
    title: z.string().nullable().optional(),
    content: z.string().nullable().optional(),
    ofertas: z.array(ofertaDZInputSchema).optional(),
  });

export const aboutUsPageUpdateInputSchema: z.ZodType<AboutUsPageUpdateInput> =
  z.object({
    content: z.string().nullable().optional(),
  });

export const adminIdSchema: z.ZodType<Id> = z
  .number()
  .int()
  .describe("Id numérico Admin API (carpetas/ficheros)");

export const watermarkOptionsSchema = z.object({
  enabled: z.boolean().default(true).describe("Si se aplica la marca de agua"),
  position: z
    .enum(["bottom-right", "bottom-left", "top-right", "top-left", "center"])
    .default("bottom-right")
    .describe("Posición de la marca de agua"),
  opacity: z
    .number()
    .min(0.05)
    .max(1)
    .default(0.85)
    .describe("Opacidad de la marca de agua (0.1 a 1.0)"),
  scale: z
    .number()
    .min(0.05)
    .max(0.6)
    .default(0.18)
    .describe(
      "Escala de la marca respecto al ancho de la imagen (ej: 0.18 = 18%)"
    ),
  margin: z
    .number()
    .int()
    .min(0)
    .default(20)
    .describe("Margen en píxeles desde el borde seleccionado"),
});
export type WatermarkInput = z.infer<typeof watermarkOptionsSchema>;

export const fileInfoSchema = z.object({
  alternativeText: z
    .string()
    .nullable()
    .optional()
    .describe("Texto alternativo (alt text) para SEO y accesibilidad"),
  caption: z.string().nullable().optional().describe("Pie de foto"),
  name: z
    .string()
    .nullable()
    .optional()
    .describe("Nombre para mostrar del archivo en la biblioteca"),
});
export type FileInfoInput = z.infer<typeof fileInfoSchema>;

export const uploadOptionsSchema = z.object({
  folderId: adminIdSchema
    .nullable()
    .optional()
    .describe("Id numérico de la carpeta en Strapi (opcional si se pasa folderPath)"),
  folderPath: z
    .string()
    .optional()
    .describe(
      "Ruta de carpetas (ej. 'post-cover-images', 'motos/honda'). Si se especifica, se asegura o crea automáticamente"
    ),
  filename: z
    .string()
    .optional()
    .describe("Nombre del fichero final con extensión"),
  fileInfo: fileInfoSchema
    .passthrough()
    .optional()
    .describe("Metadatos descriptivos y SEO del archivo"),
  watermark: z
    .union([z.boolean(), watermarkOptionsSchema])
    .optional()
    .describe(
      "Opcional. Por defecto NO se añade marca de agua (false). Pasar true o configuración personalizada solo si se desea marcar la imagen."
    ),
});
export type McpUploadOptions = z.infer<typeof uploadOptionsSchema>;

