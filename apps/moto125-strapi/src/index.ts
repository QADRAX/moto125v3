import importAzureBlobs from './scripts/import-azure-blobs';

export default {
  async bootstrap({ strapi }) {
    if (process.env.RUN_BLOB_IMPORT === 'true') {
      console.log('🌀 Ejecutando importador de blobs de Azure...');
      await importAzureBlobs();
      console.log('✅ Importación completada desde bootstrap.');
    }
  }
};