import pg from 'pg';
import { Logger } from '../../utils/logger.js';
import { DatabaseError } from '../../utils/errors.js';

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({
      host: process.env['POSTGRES_HOST'] ?? 'postgres',
      port: Number.parseInt(process.env['POSTGRES_PORT'] ?? '5432', 10),
      database: process.env['POSTGRES_DB'] ?? 'database',
      user: process.env['POSTGRES_USER'] ?? 'user',
      password: process.env['POSTGRES_PASSWORD'],
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', err => {
      Logger.error('Erreur inattendue du pool PostgreSQL', { error: err.message });
    });

    pool.on('connect', () => {
      Logger.debug('Nouvelle connexion PostgreSQL établie');
    });
  }

  return pool;
}

/**
 * Exécute une requête paramétrée. Les valeurs passent TOUJOURS par `params`
 * ($1, $2, ...) — jamais d'interpolation dans `text` (anti-injection SQL).
 */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now();

  try {
    const result = await getPool().query<T>(text, params);
    Logger.debug('Requête exécutée', {
      query: text.substring(0, 100),
      duration: `${Date.now() - start}ms`,
      rows: result.rowCount,
    });
    return result;
  } catch (error) {
    const err = error as Error;
    Logger.error('Erreur de requête base de données', {
      query: text.substring(0, 100),
      error: err.message,
    });
    throw new DatabaseError(`Échec de la requête base de données: ${err.message}`, {}, err);
  }
}

export async function getClient(): Promise<pg.PoolClient> {
  return getPool().connect();
}

/** Exécute un callback dans une transaction (BEGIN / COMMIT / ROLLBACK). */
export async function transaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    Logger.info('Pool PostgreSQL fermé');
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    await query('SELECT 1');
    Logger.info('Test de connexion à la base de données réussi');
    return true;
  } catch (error) {
    Logger.error('Échec du test de connexion à la base de données', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
