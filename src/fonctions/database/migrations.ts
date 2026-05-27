import { join } from 'node:path';
import { runner } from 'node-pg-migrate';
import { Logger } from '../../utils/logger.js';
import { DatabaseError } from '../../utils/errors.js';

const MIGRATIONS_TABLE = 'pgmigrations';

function defaultMigrationsDir(): string {
  return process.env['MIGRATIONS_DIR'] ?? join(process.cwd(), 'migrations');
}

function buildDatabaseUrl(): string {
  const host = process.env['POSTGRES_HOST'] ?? 'postgres';
  const port = process.env['POSTGRES_PORT'] ?? '5432';
  const db = process.env['POSTGRES_DB'] ?? 'database';
  const user = process.env['POSTGRES_USER'] ?? 'user';
  const password = process.env['POSTGRES_PASSWORD'] ?? '';
  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${db}`;
}

/**
 * Applique toutes les migrations en attente au démarrage. Idempotent : les
 * migrations déjà appliquées sont suivies dans la table `pgmigrations`.
 */
export async function runMigrations(dir: string = defaultMigrationsDir()): Promise<void> {
  Logger.info('Exécution des migrations de base de données', { dir });
  const start = Date.now();
  try {
    const applied = await runner({
      databaseUrl: buildDatabaseUrl(),
      dir,
      direction: 'up',
      migrationsTable: MIGRATIONS_TABLE,
      log: msg => Logger.info(`[pg-migrate] ${msg}`),
      verbose: false,
    });
    Logger.info('Migrations de base de données terminées', {
      applied: applied.map(m => m.name),
      count: applied.length,
      duration: `${Date.now() - start}ms`,
    });
  } catch (err) {
    throw new DatabaseError(
      "Échec de l'exécution des migrations de base de données",
      { dir },
      err instanceof Error ? err : undefined
    );
  }
}
