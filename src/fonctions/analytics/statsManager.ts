/**
 * Gestionnaire des statistiques — compteurs persistés en PostgreSQL.
 */
import { query } from '../database/connection.js';

export interface StatsBot {
  jeuxVotes: number;
  activitesCreees: number;
  utilisateursActifs: number;
  serveurs: number;
  [cle: string]: number;
}

export class GestionnaireStats {
  private static instance: GestionnaireStats;

  private constructor() {}

  public static getInstance(): GestionnaireStats {
    if (!GestionnaireStats.instance) {
      GestionnaireStats.instance = new GestionnaireStats();
    }
    return GestionnaireStats.instance;
  }

  public async obtenirStats(): Promise<StatsBot> {
    const res = await query<{ cle: string; valeur: string }>('SELECT cle, valeur FROM stats');
    const base: StatsBot = {
      jeuxVotes: 0,
      activitesCreees: 0,
      utilisateursActifs: 0,
      serveurs: 0,
    };
    for (const ligne of res.rows) {
      base[ligne.cle] = Number.parseInt(ligne.valeur, 10);
    }
    return base;
  }

  private async incrementer(cle: string): Promise<void> {
    await query(
      `INSERT INTO stats (cle, valeur) VALUES ($1, 1)
       ON CONFLICT (cle) DO UPDATE SET valeur = stats.valeur + 1`,
      [cle]
    );
  }

  public async enregistrerVote(_jeuId: string, _userId: string): Promise<void> {
    await this.incrementer('jeuxVotes');
  }

  public async enregistrerActivite(_activiteId: string): Promise<void> {
    await this.incrementer('activitesCreees');
  }
}
