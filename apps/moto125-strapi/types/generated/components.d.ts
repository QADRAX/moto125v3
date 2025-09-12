import type { Schema, Struct } from '@strapi/strapi';

export interface ArticleContentFortalezasDebilidades
  extends Struct.ComponentSchema {
  collectionName: 'components_article_content_fortalezas_debilidades';
  info: {
    displayName: 'FortalezasDebilidades';
  };
  attributes: {
    Debilidades: Schema.Attribute.Component<'list.debilidades-list', true>;
    Fortalezas: Schema.Attribute.Component<'list.foralezas-list', true>;
  };
}

export interface ArticleContentImageGridContent extends Struct.ComponentSchema {
  collectionName: 'components_article_content_image_grid_contents';
  info: {
    description: '';
    displayName: 'ImageGridContent';
    icon: 'dashboard';
  };
  attributes: {};
}

export interface ArticleContentPrestaciones extends Struct.ComponentSchema {
  collectionName: 'components_article_content_prestaciones';
  info: {
    displayName: 'prestaciones';
  };
  attributes: {
    prestaciones: Schema.Attribute.JSON;
  };
}

export interface ArticleContentTextContent extends Struct.ComponentSchema {
  collectionName: 'components_article_content_text_contents';
  info: {
    description: '';
    displayName: 'TextContent';
    icon: 'pencil';
  };
  attributes: {
    Text: Schema.Attribute.RichText;
  };
}

export interface ListArticulosDestacados extends Struct.ComponentSchema {
  collectionName: 'components_list_articulos_destacados';
  info: {
    displayName: 'ArticulosDestacados';
    icon: 'bulletList';
  };
  attributes: {
    featuredArticle1: Schema.Attribute.Relation<
      'oneToOne',
      'api::article.article'
    >;
    featuredArticle2: Schema.Attribute.Relation<
      'oneToOne',
      'api::article.article'
    >;
    featuredArticle3: Schema.Attribute.Relation<
      'oneToOne',
      'api::article.article'
    >;
  };
}

export interface ListDebilidadesList extends Struct.ComponentSchema {
  collectionName: 'components_list_debilidades_lists';
  info: {
    displayName: 'DebilidadesList';
  };
  attributes: {
    value: Schema.Attribute.String;
  };
}

export interface ListForalezasList extends Struct.ComponentSchema {
  collectionName: 'components_list_foralezas_lists';
  info: {
    displayName: 'ForalezasList';
  };
  attributes: {
    value: Schema.Attribute.String;
  };
}

export interface ListOfertas extends Struct.ComponentSchema {
  collectionName: 'components_list_ofertas';
  info: {
    displayName: 'Oferta';
  };
  attributes: {
    content: Schema.Attribute.RichText;
    title: Schema.Attribute.String;
  };
}

export interface ListTagList extends Struct.ComponentSchema {
  collectionName: 'components_list_tag_lists';
  info: {
    description: '';
    displayName: 'TagList';
  };
  attributes: {
    Value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ListTop10MotosSpeed extends Struct.ComponentSchema {
  collectionName: 'components_list_top10_motos_speeds';
  info: {
    displayName: 'Top10MotosSpeed';
    icon: 'bulletList';
  };
  attributes: {
    top1: Schema.Attribute.Relation<'oneToOne', 'api::moto.moto'>;
    top10: Schema.Attribute.Relation<'oneToOne', 'api::moto.moto'>;
    top10speed: Schema.Attribute.String;
    top1speed: Schema.Attribute.String;
    top2: Schema.Attribute.Relation<'oneToOne', 'api::moto.moto'>;
    top2speed: Schema.Attribute.String;
    top3: Schema.Attribute.Relation<'oneToOne', 'api::moto.moto'>;
    top3speed: Schema.Attribute.String;
    top4: Schema.Attribute.Relation<'oneToOne', 'api::moto.moto'>;
    top4speed: Schema.Attribute.String;
    top5: Schema.Attribute.Relation<'oneToOne', 'api::moto.moto'>;
    top5speed: Schema.Attribute.String;
    top6: Schema.Attribute.Relation<'oneToOne', 'api::moto.moto'>;
    top6speed: Schema.Attribute.String;
    top7: Schema.Attribute.Relation<'oneToOne', 'api::moto.moto'>;
    top7speed: Schema.Attribute.String;
    top8: Schema.Attribute.Relation<'oneToOne', 'api::moto.moto'>;
    top8speed: Schema.Attribute.String;
    top9: Schema.Attribute.Relation<'oneToOne', 'api::moto.moto'>;
    top9speed: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'article-content.fortalezas-debilidades': ArticleContentFortalezasDebilidades;
      'article-content.image-grid-content': ArticleContentImageGridContent;
      'article-content.prestaciones': ArticleContentPrestaciones;
      'article-content.text-content': ArticleContentTextContent;
      'list.articulos-destacados': ListArticulosDestacados;
      'list.debilidades-list': ListDebilidadesList;
      'list.foralezas-list': ListForalezasList;
      'list.ofertas': ListOfertas;
      'list.tag-list': ListTagList;
      'list.top10-motos-speed': ListTop10MotosSpeed;
    }
  }
}
