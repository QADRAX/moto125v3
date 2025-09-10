import 'dotenv/config';
import { StrapiAdminHttp, MediaLibrary } from '@moto125/admin-api-client';

async function main() {
  const { STRAPI_API_URL, STRAPI_ADMIN_EMAIL, STRAPI_ADMIN_PASSWORD } = process.env;
  if (!STRAPI_API_URL || !STRAPI_ADMIN_EMAIL || !STRAPI_ADMIN_PASSWORD) {
    throw new Error('Faltan env: STRAPI_API_URL, STRAPI_ADMIN_EMAIL, STRAPI_ADMIN_PASSWORD');
    }
  const admin = new StrapiAdminHttp({
    baseURL: STRAPI_API_URL,
    email: STRAPI_ADMIN_EMAIL,
    password: STRAPI_ADMIN_PASSWORD,
  });
  const media = new MediaLibrary(admin);

  const base = await media.ensureFolderPath('images/stories/motos');
  console.log('OK base folder:', base);

  const children = await media.listChildFolders(base.id);
  console.log('child folders:', children.length);

  // listar archivos de la primera subcarpeta (si hay)
  if (children[0]) {
    const files = await media.listFilesInFolder(children[0].id);
    console.log('files in first child:', files.length);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
