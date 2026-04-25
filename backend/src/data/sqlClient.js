import sql from 'mssql';
import { config } from '../config/config.js';

let poolPromise = null;

export function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect({
      server: config.sql.server,
      database: config.sql.database,
      user: config.sql.user || undefined,
      password: config.sql.password || undefined,
      port: config.sql.port,
      options: {
        encrypt: config.sql.encrypt,
        trustServerCertificate: config.sql.trustServerCertificate
      },
      pool: {
        max: config.sql.poolMax,
        min: 0,
        idleTimeoutMillis: 30_000
      }
    });
  }

  return poolPromise;
}

export { sql };
