import { BlobServiceClient, type ContainerClient } from "@azure/storage-blob";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import crypto from "node:crypto";
import { lookup as getMimeType } from "mime-types";

/** Factory to create an Azure ContainerClient from account/key/container. */
export function createAzureContainer(opts: {
  account: string;
  key: string;
  container: string;
}): ContainerClient {
  const connectionString = `DefaultEndpointsProtocol=https;AccountName=${opts.account};AccountKey=${opts.key};EndpointSuffix=core.windows.net`;
  const svc = BlobServiceClient.fromConnectionString(connectionString);
  return svc.getContainerClient(opts.container);
}

export interface TmpDownload {
  tmpPath: string;
  fileName: string;
  folderPath: string; // posix-like (a/b/c)
  size: number;
  mime: string;
}

/** Download a blob to a temp file and return metadata (name, folder, size, mime). */
export async function downloadBlobToTmp(
  container: ContainerClient,
  blobName: string
): Promise<TmpDownload> {
  const blobClient = container.getBlobClient(blobName);
  const props = await blobClient.getProperties();

  const fileName = path.basename(blobName);
  const folderRaw = path.dirname(blobName);
  const folderPath = folderRaw === "." ? "" : folderRaw.replace(/\\/g, "/");

  const size = Number(props.contentLength ?? 0);
  const mime =
    props.contentType ?? (getMimeType(fileName) || "application/octet-stream");

  // unique tmp path
  const unique = crypto.randomBytes(6).toString("hex");
  const tmpPath = path.join(os.tmpdir(), `${fileName}.${unique}.part`);

  const resp = await blobClient.download();
  const readable = resp.readableStreamBody;
  if (!readable) throw new Error(`No readable stream for blob "${blobName}"`);

  await pipeline(readable, fs.createWriteStream(tmpPath));

  return { tmpPath, fileName, folderPath, size, mime };
}

/** Best-effort cleanup of a tmp file. */
export async function safeUnlink(file: string) {
  await fs.promises.rm(file, { force: true });
}
