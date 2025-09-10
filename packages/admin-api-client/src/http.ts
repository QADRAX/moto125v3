import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { AdminLoginPayload } from './types/admin';

export class StrapiAdminHttp {
  private ax: AxiosInstance;
  private credentials?: { email: string; password: string };
  private _token?: string;

  constructor(opts: {
    baseURL: string;
    email?: string;
    password?: string;
    token?: string;
    timeoutMs?: number;
  }) {
    this.ax = axios.create({
      baseURL: opts.baseURL,
      timeout: opts.timeoutMs ?? 60_000,
      headers: { 'Content-Type': 'application/json' },
    });

    if (opts.token) this.setToken(opts.token);
    if (opts.email && opts.password) this.credentials = { email: opts.email, password: opts.password };
  }

  get token(): string | undefined {
    return this._token;
  }

  setToken(token: string) {
    this._token = token;
    this.ax.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  async login(creds?: AdminLoginPayload): Promise<string> {
    const body = creds ?? this.credentials;
    if (!body) throw new Error('Admin login: faltan email y password');

    const res = await this.ax.post('/admin/login', body);
    const token: string =
      res.data?.data?.token ??
      res.data?.token ??
      (res.headers?.authorization?.startsWith('Bearer ') ? res.headers.authorization.slice(7) : '');

    if (!token) throw new Error('Admin login: no se encontró token en la respuesta');
    this.setToken(token);
    return token;
  }

  private async ensureAuth() {
    if (!this._token) await this.login();
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    await this.ensureAuth();
    const { data } = await this.ax.get(url, config);
    return data;
  }
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    await this.ensureAuth();
    const res = await this.ax.post(url, data, config);
    return res.data;
  }
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    await this.ensureAuth();
    const res = await this.ax.put(url, data, config);
    return res.data;
  }
  async del<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    await this.ensureAuth();
    const res = await this.ax.delete(url, config);
    return res.data;
  }
}
