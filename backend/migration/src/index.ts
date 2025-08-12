import {
  parsePostToMoto125Post,
  readObjectFromFile,
  readPostsFromJsonFile,
  readWPFile,
} from "./dataReader";
import { exportPostsByYearToJson, writeJsonFile } from "./dataExport";
import { Company, FileItem, Moto125Post, MotoData, Motorcycle } from "./types";
import { traverseDirectories } from "./files";
import { createCompany, createMoto, uploadToStrapi } from "./strapi";
import {
  parseCompanyToCompanyData,
  parseMotoData,
  parseMotorcycleToStrapiMotorcycle,
} from "./fichasTecnicas";
import { migrateBlob } from "./migrateBlob";
import { saveMoto125PostAssets } from "./saveMoto125PostAssets";

const xmlFilePath: string = "./data/moto125.WordPress.2024-10-03.xml";
const fileDir: string = "G:moto125Content";

async function stepOne_extractRssPosts() {
  const items = await readWPFile(xmlFilePath);

  console.log(`Total items: ${items.length}`);

  exportPostsByYearToJson(items);

  console.log("FIN");
}

async function stepTwo_normalizeToMoto125Posts(year: number) {
  const posts = await readPostsFromJsonFile(`./data/posts/posts_${year}.json`);

  const moto125Posts: Moto125Post[] = [];

  for (const post of posts) {
    console.log(`Parseando post ${post.id}: ${post.title}`);
    const moto125Post = await parsePostToMoto125Post(post);
    moto125Posts.push(moto125Post);
    await saveMoto125PostAssets(moto125Post, year);
  }
  writeJsonFile(moto125Posts, `./data/moto125Posts/moto125_${year}.json`);

  console.log("FIN");
}

export async function normalizeMoto125PostBySlug(
  year: number,
  slug: string
): Promise<Moto125Post | undefined> {
  // 1) Cargar todos los posts del año
  const posts = await readPostsFromJsonFile(`./data/posts/posts_${year}.json`);

  // 2) Buscar el post por slug (ignorando posibles barras iniciales/finales)
  const cleanSlug = slug.replace(/^\/+|\/+$/g, "");
  const post = posts.find((p: any) => p.slug?.replace(/^\/+|\/+$/g, "") === cleanSlug);

  if (!post) {
    console.error(`No se encontró ningún post con slug \"${slug}\" para el año ${year}.`);
    return undefined;
  }

  // 3) Convertir a formato Moto125 y guardar recursos
  console.log(`Parseando post ${post.id}: ${post.title}`);
  const moto125Post = await parsePostToMoto125Post(post);

  await saveMoto125PostAssets(moto125Post, year);
}


async function stepThree_moveFiles() {
  //const filesList = await traverseDirectories(fileDir);

  //const first = filesList[0];

  const test: FileItem = {
    contentType: "image/gif",
    fileName: "Adonis.gif",
    filePath: "G:moto125Content\\Ban\\Adonis.gif",
    folderPath: "Ban",
  };

  await uploadToStrapi(test);

  console.log("FIN");
}

async function stepFour_CreateCompanies() {
  const companies: Company[] = await readObjectFromFile<Company[]>(
    "./data/marcas.json"
  );

  for (const company of companies) {
    const createRequest = parseCompanyToCompanyData(company);
    console.log(`Creando Company ${company.id}: ${company.name}`);
    await createCompany(createRequest);
  }

  console.log("FIN");
}

async function stepFive_CreateMotos() {
  const motos: Motorcycle[] = await readObjectFromFile<Motorcycle[]>(
    "./data/moto_data.json"
  );

  const motoDatas: MotoData[] = [];
  for (const moto of motos) {
    const strapiMoto = parseMotorcycleToStrapiMotorcycle(moto);
    console.log(`Parseando Moto ${moto.id}: ${moto.modelName}`);
    const motoData = await parseMotoData(strapiMoto);
    motoDatas.push(motoData);
  }

  writeJsonFile(motoDatas, `./data/motoDatas.json`);
}

async function stepSix_uploadMotos() {
  const motoDatas2: MotoData[] = await readObjectFromFile<MotoData[]>(
    "./data/motoDatas.json"
  );

  for (const motoData of motoDatas2) {
    console.log(`Creando Moto ${motoData.fullName}`);
    await createMoto(motoData);
  }

  console.log("FIN");
}

(async () => {
  //await stepOne_extractRssPosts();

  
  //await stepTwo_normalizeToMoto125Posts(2024);

  await normalizeMoto125PostBySlug(2024, 'superventas-3-ruedas-2023');

  //await stepThree_moveFiles();

  //await stepFour_CreateCompanies();

  //await stepFive_CreateMotos();

  //await stepSix_uploadMotos();

  //await migrateBlob();
})();
