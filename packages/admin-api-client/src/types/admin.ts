export interface AdminLoginPayload {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
}

export type Id = number;

export interface AdminFolder {
  id: Id;
  name: string;
  parentId: Id | null;
}

export interface AdminFile {
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

export interface Page<T> {
  results: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface UploadOptions {
  folderId?: Id | null;
  filename?: string;
  fileInfo?: Record<string, any>;
}
