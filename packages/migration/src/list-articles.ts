import 'dotenv/config';
import {
  ApiClient,
  getArticleByDocumentId,
  getArticles,
} from '@moto125/api-client';

async function main() {
  const baseUrl = process.env.STRAPI_API_URL;
  if (!baseUrl) throw new Error('Missing STRAPI_API_URL env var');
  const token = process.env.STRAPI_API_TOKEN || null;

  const api = new ApiClient({ baseUrl, token });

  // 1) List first 50 articles
  const listRes = await getArticles(api, {
    pagination: { page: 1, pageSize: 2, withCount: true },
    sort: ['publicationDate:desc', 'createdAt:desc'],
  });

  const items = listRes.data;
  const item = items[1];

  const article = await getArticleByDocumentId(api, item.documentId)

  console.log(article);

}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
