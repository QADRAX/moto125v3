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

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'article-content.fortalezas-debilidades': ArticleContentFortalezasDebilidades;
      'article-content.image-grid-content': ArticleContentImageGridContent;
      'article-content.prestaciones': ArticleContentPrestaciones;
      'article-content.text-content': ArticleContentTextContent;
      'list.debilidades-list': ListDebilidadesList;
      'list.foralezas-list': ListForalezasList;
      'list.tag-list': ListTagList;
    }
  }
}
