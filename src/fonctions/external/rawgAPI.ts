import { JeuTendance } from '@/types/stats';

const RAWG_API_BASE = 'https://api.rawg.io/api';

/**
 * Client pour l'API RAWG (base de données de jeux)
 */
export class ClientRAWG {
  private static instance: ClientRAWG;
  private apiKey: string | null;
  private cache: Map<string, { data: any; expiration: number }> = new Map();
  private cacheDuration = 3600000; // 1 heure

  private constructor() {
    this.apiKey = process.env.RAWG_API_KEY || null;
  }

  public static getInstance(): ClientRAWG {
    if (!ClientRAWG.instance) {
      ClientRAWG.instance = new ClientRAWG();
    }
    return ClientRAWG.instance;
  }

  /**
   * Vérifie si l'API RAWG est configurée
   */
  public estDisponible(): boolean {
    return this.apiKey !== null;
  }

  /**
   * Récupère les jeux tendance
   */
  public async obtenirJeuxTendance(limite: number = 10): Promise<JeuTendance[]> {
    if (!this.estDisponible()) {
      console.warn('⚠️ RAWG API non configurée');
      return [];
    }

    const cacheKey = `tendances_${limite}`;
    const cached = this.obtenirDuCache(cacheKey);
    if (cached) return cached;

    try {
      // Récupérer les jeux tendance (popularité récente)
      const url = `${RAWG_API_BASE}/games?key=${this.apiKey}&dates=${this.obtenirDatesDernierMois()}&ordering=-added&page_size=${limite}`;

      const response = await fetch(url);
      const data = (await response.json()) as any;

      if (!data.results) {
        return [];
      }

      const jeux: JeuTendance[] = data.results.map((jeu: any) => ({
        nom: jeu.name,
        popularite: jeu.added || 0,
        note: jeu.rating || 0,
        plateforme: this.formaterPlateformes(jeu.platforms),
        imageUrl: jeu.background_image,
      }));

      this.mettreEnCache(cacheKey, jeux);
      return jeux;
    } catch (erreur) {
      console.error('Erreur RAWG API :', erreur);
      return [];
    }
  }

  /**
   * Recherche un jeu sur RAWG
   */
  public async rechercherJeu(nomJeu: string): Promise<any | null> {
    if (!this.estDisponible()) {
      return null;
    }

    try {
      const url = `${RAWG_API_BASE}/games?key=${this.apiKey}&search=${encodeURIComponent(nomJeu)}&page_size=1`;
      const response = await fetch(url);
      const data = (await response.json()) as any;

      if (data.results && data.results.length > 0) {
        return data.results[0];
      }

      return null;
    } catch (erreur) {
      console.error('Erreur recherche RAWG :', erreur);
      return null;
    }
  }

  /**
   * Récupère les dates du dernier mois pour les tendances
   */
  private obtenirDatesDernierMois(): string {
    const fin = new Date();
    const debut = new Date();
    debut.setMonth(debut.getMonth() - 1);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    return `${formatDate(debut)},${formatDate(fin)}`;
  }

  /**
   * Formate la liste des plateformes
   */
  private formaterPlateformes(platforms: any[]): string {
    if (!platforms || platforms.length === 0) return 'Multi-plateformes';

    const noms = platforms.slice(0, 3).map((p: any) => p.platform.name);

    return noms.join(', ') + (platforms.length > 3 ? '...' : '');
  }

  private obtenirDuCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiration) {
      return cached.data;
    }
    return null;
  }

  private mettreEnCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expiration: Date.now() + this.cacheDuration,
    });
  }
}
