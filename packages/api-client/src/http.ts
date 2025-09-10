export interface ApiClientOptions {
  baseUrl: string;
  token?: string | null;
  defaultHeaders?: Record<string, string>;
  fetchImpl?: typeof fetch;
}

export class ApiClient {
  private baseUrl: string;
  private token?: string | null;
  private headers: Record<string, string>;
  private fetchImpl: typeof fetch;

  constructor(opts: ApiClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '');
    this.token = opts.token ?? null;
    this.headers = { 'Content-Type': 'application/json', ...(opts.defaultHeaders ?? {}) };
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  async get<T>(path: string, qs?: string): Promise<T> {
    const url = qs ? `${this.baseUrl}${path}?${qs}` : `${this.baseUrl}${path}`;
    const res = await this.fetchImpl(url, {
      method: 'GET',
      headers: this.authHeaders(),
    });
    if (!res.ok) throw await this.toError(res);
    return res.json();
  }

  async post<T>(path: string, body: any): Promise<T> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw await this.toError(res);
    return res.json();
  }

  async put<T>(path: string, body: any): Promise<T> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: this.authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw await this.toError(res);
    return res.json();
  }

  async del<T>(path: string): Promise<T> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: this.authHeaders(),
    });
    if (!res.ok) throw await this.toError(res);
    return res.json();
  }

  private authHeaders() {
    return this.token
      ? { ...this.headers, Authorization: `Bearer ${this.token}` }
      : this.headers;
  }

  private async toError(res: Response) {
    let detail: any = null;
    try { detail = await res.json(); } catch {}
    const err = new Error(`HTTP ${res.status} ${res.statusText}`);
    (err as any).status = res.status;
    (err as any).detail = detail;
    return err;
  }
}
