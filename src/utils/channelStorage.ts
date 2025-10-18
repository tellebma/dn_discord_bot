/**
 * Stockage des canaux
 */
export class StockageCanal {
  private static instance: StockageCanal;
  private canaux: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): StockageCanal {
    if (!StockageCanal.instance) {
      StockageCanal.instance = new StockageCanal();
    }
    return StockageCanal.instance;
  }

  public async definirCanal(serveurId: string, type: string, canalId: string): Promise<void> {
    this.canaux.set(`${serveurId}-${type}`, canalId);
  }

  public async obtenirCanal(serveurId: string, type: string): Promise<string | null> {
    return this.canaux.get(`${serveurId}-${type}`) || null;
  }

  public async supprimerCanal(serveurId: string, type: string): Promise<boolean> {
    return this.canaux.delete(`${serveurId}-${type}`);
  }
}
