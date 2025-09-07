
import { BlobServiceClient } from '@azure/storage-blob';
import axios from 'axios';
import path from 'path';
import FormData from 'form-data';
import fs from 'fs';
import { lookup as getMimeType } from 'mime-types';
import dotenv from 'dotenv';
import os from 'os';

dotenv.config();

const {
  AZURE_ACCOUNT,
  AZURE_KEY,
  AZURE_CONTAINER,
  STRAPI_API_URL,
  STRAPI_ADMIN_TOKEN,
} = process.env;

const connectionString = `DefaultEndpointsProtocol=https;AccountName=${AZURE_ACCOUNT};AccountKey=${AZURE_KEY};EndpointSuffix=core.windows.net`;

const axiosInstance = axios.create({
  baseURL: STRAPI_API_URL,
  headers: {
    Authorization: `Bearer ${STRAPI_ADMIN_TOKEN}`,
  },
});

const folderCache = new Map<string, number>();

async function ensureFolder(fullPath: string): Promise<number | null> {
  if (!fullPath || fullPath === '.') return null;
  if (folderCache.has(fullPath)) return folderCache.get(fullPath)!;

  const segments = fullPath.split('/').filter(Boolean);
  const parentPath = segments.slice(0, -1).join('/');
  const folderName = segments[segments.length - 1];

  const parentId = await ensureFolder(parentPath);

  const payload: any = { name: folderName };
  if (parentId) payload.parent = parentId;

  console.log(`📁 Creating folder: ${folderName} at path: /${fullPath}`);

  const { data } = await axiosInstance.post('/upload/folders', payload);
  const folderId = data.data.id;
  folderCache.set(fullPath, folderId);
  return folderId;
}

async function uploadFile(buffer: Buffer, fileName: string, mimeType: string, folderId: number | null) {
  const tmpPath = path.join(os.tmpdir(), fileName);
  await fs.promises.writeFile(tmpPath, buffer);

  const form = new FormData();
  form.append('files', fs.createReadStream(tmpPath), {
    filename: fileName,
    contentType: mimeType,
  });

  const fileInfo: Record<string, any> = { name: fileName };
  if (folderId !== null) fileInfo['folder'] = folderId;
  form.append('fileInfo', JSON.stringify(fileInfo));

  console.log(`📤 Uploading "${fileName}" to folder ID ${folderId ?? 'null'} (type: ${mimeType})`);

  try {
    const res = await axiosInstance.post('/upload', form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    console.log(`✅ Upload success: ${fileName} => ID: ${res.data[0]?.id}`);
  } catch (err: any) {
    console.error(`❌ Upload failed for "${fileName}"`);
    if (err.response) {
      console.error('↪ Status:', err.response.status);
      console.error('↪ Data:', err.response.data);
    } else {
      console.error(err.message);
    }
  }

  await fs.promises.unlink(tmpPath);
}

export async function migrateBlob() {
  const client = BlobServiceClient.fromConnectionString(connectionString);
  const container = client.getContainerClient(AZURE_CONTAINER!);

  let total = 0;
  let errors = 0;

  for await (const blob of container.listBlobsFlat()) {
    try {
      console.log(`📦 Procesando blob: ${blob.name}`);

      const blobClient = container.getBlobClient(blob.name);
      const downloadBlockBlobResponse = await blobClient.download();
      const buffer = await streamToBuffer(downloadBlockBlobResponse.readableStreamBody!);

      const mimeType = getMimeType(blob.name) || 'application/octet-stream';
      const fileName = path.basename(blob.name);
      const folderPath = path.dirname(blob.name).replace(/\\/g, '/');      
      const folderId = await ensureFolder(folderPath);

      await uploadFile(buffer, fileName, mimeType, folderId);
      total++;
    } catch (err: any) {
      console.error(`❌ Error al subir ${blob.name}: ${err.message}`);
      errors++;
    }
  }

  console.log(`✅ Proceso finalizado: ${total} subidos, ${errors} errores`);
}

function streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on('data', chunk => chunks.push(Buffer.from(chunk)));
    readableStream.on('end', () => resolve(Buffer.concat(chunks)));
    readableStream.on('error', reject);
  });
}
