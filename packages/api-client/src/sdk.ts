import { ApiClient, type ApiClientOptions } from "./http";
import type {
  StrapiCollectionResponse,
  StrapiQueryParams,
  StrapiSingleResponse,
} from "./types/strapi";

import {
  getArticles,
  getArticleBySlug,
  getArticleByDocumentId,
  createArticle,
  updateArticleByDocumentId,
} from "./client/articles";

import {
  getMotos,
  getMotoByMoto125Id,
  getMotoByDocumentId,
  createMoto,
  updateMotoByDocumentId,
} from "./client/motos";

import {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompanyByDocumentId,
} from "./client/companies";

import {
  getArticleTypes,
  getMotoTypes,
  getMotoClasses,
  createArticleType,
  updateArticleTypeByDocumentId,
  createMotoType,
  updateMotoTypeByDocumentId,
  createMotoClass,
  updateMotoClassByDocumentId,
} from "./client/taxonomies";

import { getConfig, updateConfig } from "./client/config";

import { getHomePage, updateHomePage } from "./client/home-page";

import { getPaginaOfertas, updatePaginaOfertas } from "./client/pagina-ofertas";

import { getAboutUsPage, updateAboutUsPage } from "./client/about-us-page";
import {
  AboutUsPage,
  Article,
  ArticleType,
  Company,
  Config,
  HomePage,
  Moto,
  MotoClass,
  MotoType,
  PaginaOfertas,
} from "./types/entities";
import {
  AboutUsPageUpdateInput,
  ArticleCreateInput,
  ArticleTypeCreateInput,
  ArticleTypeUpdateInput,
  ArticleUpdateInput,
  CompanyCreateInput,
  CompanyUpdateInput,
  ConfigUpdateInput,
  HomePageUpdateInput,
  MotoClassCreateInput,
  MotoClassUpdateInput,
  MotoCreateInput,
  MotoTypeCreateInput,
  MotoTypeUpdateInput,
  MotoUpdateInput,
  PaginaOfertasUpdateInput,
} from "./types/inputs";

/**
 * Options to create the Moto125 SDK.
 */
export interface Moto125ApiOptions extends ApiClientOptions {
  /**
   * Default Strapi query options applied to *every* request.
   * Explicit params passed in calls will override these.
   * Example: { publicationState: 'live', locale: 'es' }
   */
  queryDefaults?: Partial<StrapiQueryParams>;
}

/**
 * Merge user params with global query defaults.
 * Caller params always win.
 */
function applyQueryDefaults(
  base: Partial<StrapiQueryParams> | undefined,
  overrides: Partial<StrapiQueryParams> | undefined
): StrapiQueryParams {
  return { ...(base ?? {}), ...(overrides ?? {}) } as StrapiQueryParams;
}

/** Public, typed surface of the SDK. */
export interface Moto125Sdk {
  /** Low-level HTTP client (exposed for advanced/custom calls). */
  readonly http: ApiClient;

  readonly articles: {
    /** List articles. */
    list(
      params?: StrapiQueryParams
    ): Promise<StrapiCollectionResponse<Article>>;
    /** Get 1 article by slug. */
    getBySlug(
      slug: string,
      params?: Omit<StrapiQueryParams, "filters">
    ): Promise<StrapiCollectionResponse<Article>>;
    /** Get article by documentId. */
    getById(
      documentId: string,
      params?: StrapiQueryParams
    ): Promise<StrapiSingleResponse<Article>>;
    /** Create / Update. */
    create(
      data: ArticleCreateInput,
      params?: StrapiQueryParams
    ): Promise<StrapiSingleResponse<Article>>;
    update(
      documentId: string,
      data: ArticleUpdateInput,
      params?: StrapiQueryParams
    ): Promise<StrapiSingleResponse<Article>>;
  };

  readonly motos: {
    list(params?: StrapiQueryParams): Promise<StrapiCollectionResponse<Moto>>;
    getByMoto125Id(
      moto125Id: string,
      params?: Omit<StrapiQueryParams, "filters">
    ): Promise<StrapiCollectionResponse<Moto>>;
    getById(
      documentId: string,
      params?: StrapiQueryParams
    ): Promise<StrapiSingleResponse<Moto>>;
    create(
      data: MotoCreateInput,
      params?: StrapiQueryParams
    ): Promise<StrapiSingleResponse<Moto>>;
    update(
      documentId: string,
      data: MotoUpdateInput,
      params?: StrapiQueryParams
    ): Promise<StrapiSingleResponse<Moto>>;
  };

  readonly companies: {
    list(
      params?: StrapiQueryParams
    ): Promise<StrapiCollectionResponse<Company>>;
    getById(
      documentId: string,
      params?: StrapiQueryParams
    ): Promise<StrapiSingleResponse<Company>>;
    create(
      data: CompanyCreateInput,
      params?: StrapiQueryParams
    ): Promise<StrapiSingleResponse<Company>>;
    update(
      documentId: string,
      data: CompanyUpdateInput,
      params?: StrapiQueryParams
    ): Promise<StrapiSingleResponse<Company>>;
  };

  readonly taxonomies: {
    readonly articleTypes: {
      list(
        params?: StrapiQueryParams
      ): Promise<StrapiCollectionResponse<ArticleType>>;
      create(
        data: ArticleTypeCreateInput,
        params?: StrapiQueryParams
      ): Promise<StrapiSingleResponse<ArticleType>>;
      update(
        documentId: string,
        data: ArticleTypeUpdateInput,
        params?: StrapiQueryParams
      ): Promise<StrapiSingleResponse<ArticleType>>;
    };
    readonly motoTypes: {
      list(
        params?: StrapiQueryParams
      ): Promise<StrapiCollectionResponse<MotoType>>;
      create(
        data: MotoTypeCreateInput,
        params?: StrapiQueryParams
      ): Promise<StrapiSingleResponse<MotoType>>;
      update(
        documentId: string,
        data: MotoTypeUpdateInput,
        params?: StrapiQueryParams
      ): Promise<StrapiSingleResponse<MotoType>>;
    };
    readonly motoClasses: {
      list(
        params?: StrapiQueryParams
      ): Promise<StrapiCollectionResponse<MotoClass>>;
      create(
        data: MotoClassCreateInput,
        params?: StrapiQueryParams
      ): Promise<StrapiSingleResponse<MotoClass>>;
      update(
        documentId: string,
        data: MotoClassUpdateInput,
        params?: StrapiQueryParams
      ): Promise<StrapiSingleResponse<MotoClass>>;
    };
  };

  readonly config: {
    get(params?: StrapiQueryParams): Promise<StrapiSingleResponse<Config>>;
    update(
      data: ConfigUpdateInput,
      params?: StrapiQueryParams
    ): Promise<StrapiSingleResponse<Config>>;
  };

  readonly pages: {
    readonly home: {
      get(params?: StrapiQueryParams): Promise<StrapiSingleResponse<HomePage>>;
      update(
        data: HomePageUpdateInput,
        params?: StrapiQueryParams
      ): Promise<StrapiSingleResponse<HomePage>>;
    };
    readonly ofertas: {
      get(
        params?: StrapiQueryParams
      ): Promise<StrapiSingleResponse<PaginaOfertas>>;
      update(
        data: PaginaOfertasUpdateInput,
        params?: StrapiQueryParams
      ): Promise<StrapiSingleResponse<PaginaOfertas>>;
    };
    readonly aboutUs: {
      get(
        params?: StrapiQueryParams
      ): Promise<StrapiSingleResponse<AboutUsPage>>;
      update(
        data: AboutUsPageUpdateInput,
        params?: StrapiQueryParams
      ): Promise<StrapiSingleResponse<AboutUsPage>>;
    };
  };
}

/**
 * Factory that returns a verbose, namespaced SDK built on functional clients.
 * Keeps code testable (pure functions) but offers an ergonomic grouped API.
 */
export function createMoto125Api(opts: Moto125ApiOptions): Moto125Sdk {
  const api = new ApiClient(opts);
  const qd = opts.queryDefaults ?? {};

  return {
    /** Expose the low-level http in case you need custom calls. */
    http: api,

    /** Articles resource */
    articles: {
      /** List articles */
      list: (params?: StrapiQueryParams) =>
        getArticles(api, applyQueryDefaults(qd, params)),
      /** Get by slug (1 item) */
      getBySlug: (slug: string, params?: Omit<StrapiQueryParams, "filters">) =>
        getArticleBySlug(api, slug, applyQueryDefaults(qd, params)),
      /** Get by documentId */
      getById: (documentId: string, params?: StrapiQueryParams) =>
        getArticleByDocumentId(api, documentId, applyQueryDefaults(qd, params)),
      /** Create / Update */
      create: (data: any, params?: StrapiQueryParams) =>
        createArticle(api, data, applyQueryDefaults(qd, params)),
      update: (documentId: string, data: any, params?: StrapiQueryParams) =>
        updateArticleByDocumentId(
          api,
          documentId,
          data,
          applyQueryDefaults(qd, params)
        ),
    },

    /** Motos resource */
    motos: {
      list: (params?: StrapiQueryParams) =>
        getMotos(api, applyQueryDefaults(qd, params)),
      getByMoto125Id: (
        moto125Id: string,
        params?: Omit<StrapiQueryParams, "filters">
      ) => getMotoByMoto125Id(api, moto125Id, applyQueryDefaults(qd, params)),
      getById: (documentId: string, params?: StrapiQueryParams) =>
        getMotoByDocumentId(api, documentId, applyQueryDefaults(qd, params)),
      create: (data: any, params?: StrapiQueryParams) =>
        createMoto(api, data, applyQueryDefaults(qd, params)),
      update: (documentId: string, data: any, params?: StrapiQueryParams) =>
        updateMotoByDocumentId(
          api,
          documentId,
          data,
          applyQueryDefaults(qd, params)
        ),
    },

    /** Companies resource */
    companies: {
      list: (params?: StrapiQueryParams) =>
        getCompanies(api, applyQueryDefaults(qd, params)),
      getById: (documentId: string, params?: StrapiQueryParams) =>
        getCompanyById(api, documentId, applyQueryDefaults(qd, params)),
      create: (data: any, params?: StrapiQueryParams) =>
        createCompany(api, data, applyQueryDefaults(qd, params)),
      update: (documentId: string, data: any, params?: StrapiQueryParams) =>
        updateCompanyByDocumentId(
          api,
          documentId,
          data,
          applyQueryDefaults(qd, params)
        ),
    },

    /** Taxonomies */
    taxonomies: {
      articleTypes: {
        list: (params?: StrapiQueryParams) =>
          getArticleTypes(api, applyQueryDefaults(qd, params)),
        create: (data: any, params?: StrapiQueryParams) =>
          createArticleType(api, data, applyQueryDefaults(qd, params)),
        update: (documentId: string, data: any, params?: StrapiQueryParams) =>
          updateArticleTypeByDocumentId(
            api,
            documentId,
            data,
            applyQueryDefaults(qd, params)
          ),
      },
      motoTypes: {
        list: (params?: StrapiQueryParams) =>
          getMotoTypes(api, applyQueryDefaults(qd, params)),
        create: (data: any, params?: StrapiQueryParams) =>
          createMotoType(api, data, applyQueryDefaults(qd, params)),
        update: (documentId: string, data: any, params?: StrapiQueryParams) =>
          updateMotoTypeByDocumentId(
            api,
            documentId,
            data,
            applyQueryDefaults(qd, params)
          ),
      },
      motoClasses: {
        list: (params?: StrapiQueryParams) =>
          getMotoClasses(api, applyQueryDefaults(qd, params)),
        create: (data: any, params?: StrapiQueryParams) =>
          createMotoClass(api, data, applyQueryDefaults(qd, params)),
        update: (documentId: string, data: any, params?: StrapiQueryParams) =>
          updateMotoClassByDocumentId(
            api,
            documentId,
            data,
            applyQueryDefaults(qd, params)
          ),
      },
    },

    /** Site config */
    config: {
      get: (params?: StrapiQueryParams) =>
        getConfig(api, applyQueryDefaults(qd, params)),
      update: (data: any, params?: StrapiQueryParams) =>
        updateConfig(api, data, applyQueryDefaults(qd, params)),
    },

    /** CMS single pages */
    pages: {
      home: {
        get: (params?: StrapiQueryParams) =>
          getHomePage(api, applyQueryDefaults(qd, params)),
        update: (data: any, params?: StrapiQueryParams) =>
          updateHomePage(api, data, applyQueryDefaults(qd, params)),
      },
      ofertas: {
        get: (params?: StrapiQueryParams) =>
          getPaginaOfertas(api, applyQueryDefaults(qd, params)),
        update: (data: any, params?: StrapiQueryParams) =>
          updatePaginaOfertas(api, data, applyQueryDefaults(qd, params)),
      },
      aboutUs: {
        get: (params?: StrapiQueryParams) =>
          getAboutUsPage(api, applyQueryDefaults(qd, params)),
        update: (data: any, params?: StrapiQueryParams) =>
          updateAboutUsPage(api, data, applyQueryDefaults(qd, params)),
      },
    },
  };
}
