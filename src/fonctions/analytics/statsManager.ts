/**
 * Gestionnaire des statistiques
 */
export class GestionnaireStats {
  private static instance: GestionnaireStats;
  private stats: any = {};

  private constructor() {}

  public static getInstance(): GestionnaireStats {
    if (!GestionnaireStats.instance) {
      GestionnaireStats.instance = new GestionnaireStats();
    }
    return GestionnaireStats.instance;
  }

  public async obtenirStats(): Promise<any> {
    return {
      jeuxVotes: 0,
      activitesCreees: 0,
      utilisateursActifs: 0,
      serveurs: 0,
      ...this.stats
    };
  }

  public async enregistrerVote(_jeuId: string, _userId: string): Promise<void> {
    this.stats.jeuxVotes = (this.stats.jeuxVotes || 0) + 1;
  }

  public async enregistrerActivite(_activiteId: string): Promise<void> {
    this.stats.activitesCreees = (this.stats.activitesCreees || 0) + 1;
  }
}