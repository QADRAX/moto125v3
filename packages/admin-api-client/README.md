# @moto125/admin-api-client

Cliente tipado **Strapi Admin API** para **moto125.cc**.  
Proporciona un *wrapper* ligero alrededor de la **Media Library de Strapi** con tipados completos en TypeScript.

> Funciona en Node.js. Incluye builds **ESM** y **CJS**.

---

## Características

- Autenticación de administrador con email/password o token
- Gestión de carpetas en la Media Library de Strapi
- Subida, movimiento, listado y borrado de archivos
- Interfaces tipadas para carpetas, archivos y opciones de subida
- Construido sobre `axios`

---

## Instalación

```bash
npm i @moto125/admin-api-client
# o
pnpm add @moto125/admin-api-client
# o
yarn add @moto125/admin-api-client
```

---

## Inicio rápido

```ts
import { StrapiAdminHttp, MediaLibrary } from '@moto125/admin-api-client';

// Crear cliente HTTP
const http = new StrapiAdminHttp({
  baseURL: 'https://api.moto125.cc',
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASS,
});

// Crear cliente de Media Library
const media = new MediaLibrary(http);

// Listar carpetas en root
const folders = await media.listChildFolders(null);

// Asegurar que existe la ruta de carpeta
const folder = await media.ensureFolderPath('uploads/motos/2025');

// Subir un fichero local a la carpeta
const files = await media.uploadLocalFile('/ruta/a/fichero.jpg', {
  folderId: folder.id,
  filename: 'mi-moto.jpg',
  fileInfo: { caption: 'Mi nueva moto' },
});

console.log('URL del fichero subido:', files[0].url);
```

---

## Superficie de la API

### `StrapiAdminHttp`

Cliente HTTP de bajo nivel con autenticación integrada.

- `new StrapiAdminHttp({ baseURL, email, password, token?, timeoutMs? })`
- `login(creds?)` → `Promise<string>` (devuelve el token)
- `get(url, config?)`
- `post(url, data, config?)`
- `put(url, data, config?)`
- `del(url, config?)`
- `setToken(token: string)` → establecer/rotar un token manualmente

### `MediaLibrary`

API de alto nivel para la Media Library.

```ts
const media = new MediaLibrary(http);
```

- `listChildFolders(parentId: Id | null)` → `Promise<AdminFolder[]>`
- `getChildFolderByName(parentId: Id | null, name: string)` → `Promise<AdminFolder | null>`
- `createFolder(name: string, parentId: Id | null)` → `Promise<AdminFolder>`
- `ensureFolderPath(path: string)` → `Promise<AdminFolder>`
- `listFilesInFolder(folderId: Id)` → `Promise<AdminFile[]>`
- `moveFile(fileId: Id, newFolderId: Id | null)` → `Promise<AdminFile>`
- `deleteFile(fileId: Id)` → `Promise<void>`
- `uploadLocalFile(filePath: string, opts?: UploadOptions)` → `Promise<AdminFile[]>`

---

## Tipos

```ts
import type {
  Id,
  AdminFolder,
  AdminFile,
  UploadOptions,
  AdminLoginPayload,
  AdminLoginResponse,
  Page,
} from '@moto125/admin-api-client';
```

### `AdminFolder`
```ts
interface AdminFolder {
  id: Id;
  name: string;
  parentId: Id | null;
}
```

### `AdminFile`
```ts
interface AdminFile {
  id: Id;
  name: string;
  alternativeText?: string | null;
  caption?: string | null;
  folderId: Id | null;
  url?: string;
  ext?: string;
  mime?: string;
  size?: number;
  width?: number | null;
  height?: number | null;
  createdAt?: string;
  updatedAt?: string;
}
```

### `UploadOptions`
```ts
interface UploadOptions {
  folderId?: Id | null;
  filename?: string;
  fileInfo?: Record<string, any>;
}
```

---

## Manejo de errores

Todas las peticiones intentan autenticarse automáticamente si no hay un token establecido.  
Los errores lanzan objetos estándar `Error` con detalles de Strapi.

---