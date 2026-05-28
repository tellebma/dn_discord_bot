/**
 * Stockage des canaux configurés — persisté en PostgreSQL, clé (serveur, type).
 */
import { query } from '../fonctions/database/connection.js';

export class StockageCanal {
  private static instance: StockageCanal;

  private constructor() {}

  public static getInstance(): StockageCanal {
    if (!StockageCanal.instance) {
      StockageCanal.instance = new StockageCanal();
    }
    return StockageCanal.instance;
  }

  public async definirCanal(serveurId: string, type: string, canalId: string): Promise<void> {
    await query(
      `INSERT INTO channels (guild_id, type, canal_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (guild_id, type) DO UPDATE SET canal_id = EXCLUDED.canal_id`,
      [serveurId, type, canalId]
    );
  }

  public async obtenirCanal(serveurId: string, type: string): Promise<string | null> {
    const res = await query<{ canal_id: string }>(
      'SELECT canal_id FROM channels WHERE guild_id = $1 AND type = $2',
      [serveurId, type]
    );
    return res.rows[0]?.canal_id ?? null;
  }

  public async supprimerCanal(serveurId: string, type: string): Promise<boolean> {
    const res = await query('DELETE FROM channels WHERE guild_id = $1 AND type = $2', [
      serveurId,
      type,
    ]);
    return (res.rowCount ?? 0) > 0;
  }
}
