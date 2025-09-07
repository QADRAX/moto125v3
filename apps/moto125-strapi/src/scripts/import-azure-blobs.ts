import { BlobServiceClient } from '@azure/storage-blob';
import path from 'path';
import { lookup as getMimeType } from 'mime-types';
import axios from 'axios';
import fs from 'fs';
import fsPromises from 'fs/promises';
import os from 'os';

const AZURE_ACCOUNT = process.env.STORAGE_ACCOUNT!;
const AZURE_KEY = process.env.STORAGE_ACCOUNT_KEY!;
const AZURE_CONTAINER = process.env.STORAGE_MIGRATION_CONTAINER_NAME!;

const AZURE_CONNECTION_STRING = `DefaultEndpointsProtocol=https;AccountName=${AZURE_ACCOUNT};AccountKey=${AZURE_KEY};EndpointSuffix=core.windows.net`;

const folderService = () => strapi.plugin('upload').service('folder');
const fileService = () => strapi.plugin('upload').service('upload');

const folderCache = new Map<string, any>();

async function findFolderByPath(fullPath: string): Promise<any | null> {
  const folders = await strapi.entityService.findMany('plugin::upload.folder', {
    filters: { path: fullPath },
    limit: 1,
  });
  return folders[0] || null;
}

async function ensureFolder(fullPath: string): Promise<any> {
  if (folderCache.has(fullPath)) return folderCache.get(fullPath);
  const existing = await findFolderByPath(fullPath);
  if (existing) {
    folderCache.set(fullPath, existing);
    return existing;
  }

  const segments = fullPath.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const parentPath = '/' + segments.slice(0, -1).join('/');
  const parent = await ensureFolder(parentPath);

  const folder = await folderService().create({
    name: segments[segments.length - 1],
    path: '/' + segments.join('/'),
    parent: parent?.id ?? null,
  });

  folderCache.set(fullPath, folder);
  return folder;
}

async function uploadFileFromUrl(url: string, fileName: string, mime: string, folderId: number | null) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    console.log(`🟢 Subiendo archivo ${fileName} a Strapi desde ${url}...`);

    await fileService().upload({
      data: {
        fileInfo: {
          name: fileName,
          alternativeText: fileName,
          caption: fileName,
        },
        folder: folderId,
      },
      files: {
        name: fileName,
        type: mime,
        size: buffer.byteLength,
        buffer, // ✅ STRAPI 5: usa 'buffer' directamente
      },
    });

    console.log(`✅ Archivo ${fileName} subido correctamente.`);
    return true;
  } catch (error: any) {
    console.error(`🔴 Error al importar ${url}: ${error.message}`);
    return false;
  }
}

export default async () => {
  console.log('📦 Conectando a Azure Blob Storage...');
  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(AZURE_CONTAINER);

  let imported = 0;
  let skipped = 0;

  for await (const blob of containerClient.listBlobsFlat()) {
    try {
      const mimeType = getMimeType(blob.name) || 'application/octet-stream';
      const fileName = path.basename(blob.name);
      const url = `https://${AZURE_ACCOUNT}.blob.core.windows.net/${AZURE_CONTAINER}/${blob.name}`;
      const strapiFolderPath = '/' + path.dirname(blob.name).replace(/\\/g, '/');

      const folder = await ensureFolder(strapiFolderPath);

      await uploadFileFromUrl(url, fileName, mimeType, folder?.id ?? null);

      console.log(`🟢 Importado: ${blob.name}`);
      imported++;
    } catch (err: any) {
      console.error(`🔴 Error al importar ${blob.name}:`, err.message);
    }
  }

  console.log('✅ Migración completada');
  console.log(`📊 Archivos importados: ${imported}`);
  console.log(`📁 Archivos ya existentes (no detectados aún): ${skipped}`);
};
