import { createPool, Pool } from 'mysql2/promise';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const {
      WP_DB_HOST,
      WP_DB_PORT,
      WP_DB_USER,
      WP_DB_PASSWORD,
      WP_DB_NAME,
    } = process.env;

    if (!WP_DB_HOST || !WP_DB_USER || !WP_DB_NAME) {
      throw new Error('Missing required DB env vars: WP_DB_HOST, WP_DB_USER, WP_DB_NAME');
    }

    pool = createPool({
      host: WP_DB_HOST,
      port: WP_DB_PORT ? Number(WP_DB_PORT) : 3306,
      user: WP_DB_USER,
      password: WP_DB_PASSWORD ?? undefined,
      database: WP_DB_NAME,
      connectionLimit: 5,
      waitForConnections: true,
      namedPlaceholders: true,
      // Azure MySQL suele requerir TLS
      ssl: {
        // Lo mínimo que suele pedir Azure. Si tu servidor exige cadena CA,
        // añade aquí `ca: fs.readFileSync('BaltimoreCyberTrustRoot.crt.pem', 'utf8')`
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      },
    });
  }
  return pool;
}
