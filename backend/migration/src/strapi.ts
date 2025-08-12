import fs from "fs-extra";
import axios from "axios";
import FormData from "form-data";
import {
  CompanyData,
  CreateCompanyRequest,
  CreateMotoRequest,
  FileItem,
  MotoData,
} from "./types";
import dotenv from "dotenv";

dotenv.config();

const { STRAPI_API_URL, STRAPI_API_TOKEN, STRAPI_ADMIN_TOKEN } = process.env;

export async function uploadToStrapi(fileItem: FileItem): Promise<void> {
  try {
    const formData = new FormData();

    formData.append("files", fs.createReadStream(fileItem.filePath), {
      filename: fileItem.fileName,
      contentType: fileItem.contentType,
    });

    formData.append(
      "fileInfo",
      JSON.stringify({
        name: fileItem.fileName,
        folder: "8",
      })
    );

    const response = await axios.post(`${STRAPI_API_URL}/upload`, formData, {
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        ...formData.getHeaders(),
      },
    });

    console.log(
      `Archivo subido: ${fileItem.filePath} - Respuesta: ${response.status}`
    );
  } catch (error) {
    console.error(`Error al subir el archivo: ${fileItem.filePath}`, error);
  }
}

export async function createCompany(companyData: CompanyData): Promise<any> {
  try {
    const response = await axios.post<CreateCompanyRequest>(
      `${STRAPI_API_URL}/api/companies`,
      { data: companyData },
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating the company:", error);
    throw error;
  }
}

export async function createMoto(motoData: MotoData): Promise<any> {
  try {
    const response = await axios.post<CreateMotoRequest>(
      `${STRAPI_API_URL}/api/motos`,
      { data: motoData },
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error:", error.message);
    }
    throw error;
  }
}

export async function getCompanyIdByName(
  companyName: string
): Promise<number | null> {
  try {
    const response = await axios.get(
      `${STRAPI_API_URL}/content-manager/collection-types/api::company.company`,
      {
        params: {
          "filters[name][$eq]": companyName,
          "pageSize": 1,
        },
        headers: {
          Authorization: `Bearer ${STRAPI_ADMIN_TOKEN}`,
        },
      }
    );

    const company = response.data?.results?.[0];
    return company ? company.id : null;
  } catch (error) {
    console.error("Error fetching company ID via Admin API:", error);
    throw error;
  }
}

export async function getMotorcycleTypeIdByName(
  motorcycleTypeName: string
): Promise<number | null> {
  try {
    const response = await axios.get(`${STRAPI_API_URL}/content-manager/collection-types/api::moto-type.moto-type`, {
      params: {
        "filters[name][$eq]": motorcycleTypeName,
        "pageSize": 1,
      },
      headers: {
        Authorization: `Bearer ${STRAPI_ADMIN_TOKEN}`,
      },
    });

    const motorcycleType = response.data?.results?.[0];
    return motorcycleType ? motorcycleType.id : null;
  } catch (error) {
    console.error("Error fetching motorcycle type ID:", error);
    throw error;
  }
}

export async function getImageIdsByMoto125Id(
  moto125Id: string
): Promise<any[]> {
  const folderName = `m${moto125Id}`;

  const foldersRes = await axios.get(`${STRAPI_API_URL}/upload/folders`, {
    headers: {
      Authorization: `Bearer ${STRAPI_ADMIN_TOKEN}`,
    },
  });

  const folders: any[] = foldersRes.data.data;

  const targetFolder = folders.find((f) => f.name === folderName);
  if (!targetFolder) {
    console.warn(`Folder ${folderName} not found.`);
    return [];
  }

  const folderId = targetFolder.id;

  const filesRes = await axios.get(`${STRAPI_API_URL}/upload/files`, {
    headers: {
      Authorization: `Bearer ${STRAPI_ADMIN_TOKEN}`,
    },
    params: {
      "filters[folder][id][$eq]": folderId,
      pagination: { pageSize: 1000 },
    },
  });

  const files = filesRes.data.results;
  const filtered = files.filter((file: any) =>
    /^f\d{3}\.(jpg|jpeg|png)$/i.test(file.name)
  );

  return filtered.map((file: any) => file.id);
}
