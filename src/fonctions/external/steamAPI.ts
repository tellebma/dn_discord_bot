import { JeuTendance } from '@/types/stats';

const STEAM_API_BASE = 'https://api.steampowered.com';
const STEAM_CHARTS_URL = 'https://steamcharts.com/top';

/**
 * Client pour l'API Steam
 */
export class ClientSteam {
  private static instance: ClientSteam;
  private apiKey: string | null;
  private cache: Map<string, { data: any; expiration: number }> = new Map();
  private cacheDuration = 3600000; // 1 heure en ms

  private constructor() {
    this.apiKey = process.env.STEAM_API_KEY || null;
  }

  public static getInstance(): ClientSteam {
    if (!ClientSteam.instance) {
      ClientSteam.instance = new ClientSteam();
    }
    return ClientSteam.instance;
  }

  /**
   * Vérifie si l'API Steam est configurée
   */
  public estDisponible(): boolean {
    return this.apiKey !== null;
  }

  /**
   * Récupère les jeux tendance depuis Steam
   */
  public async obtenirJeuxTendance(limite: number = 10): Promise<JeuTendance[]> {
    if (!this.estDisponible()) {
      console.warn('⚠️ Steam API non configurée');
      return [];
    }

    const cacheKey = `tendances_${limite}`;
    const cached = this.obtenirDuCache(cacheKey);
    if (cached) return cached;

    try {
      // Steam n'a pas d'endpoint "trending" direct
      // On utilise l'endpoint des jeux les plus joués via steamcharts
      const tendances = await this.obtenirTopJeux(limite);

      this.mettreEnCache(cacheKey, tendances);
      return tendances;
    } catch (erreur) {
      console.error('Erreur API Steam :', erreur);
      return [];
    }
  }

  /**
   * Recherche un jeu sur Steam par nom
   */
  public async rechercherJeu(nomJeu: string): Promise<any | null> {
    if (!this.estDisponible()) {
      return null;
    }

    try {
      // Utilisation de l'API Steam Store pour la recherche
      const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(nomJeu)}&l=french&cc=FR`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        return data.items[0]; // Premier résultat
      }

      return null;
    } catch (erreur) {
      console.error('Erreur recherche Steam :', erreur);
      return null;
    }
  }

  /**
   * Récupère les jeux les plus joués actuellement
   */
  private async obtenirTopJeux(limite: number): Promise<JeuTendance[]> {
    try {
      // Utilisation de Steam Spy API (gratuit, pas de clé)
      const url = 'https://steamspy.com/api.php?request=top100in2weeks';
      const response = await fetch(url);
      const data = await response.json();

      const jeux: JeuTendance[] = Object.values(data)
        .slice(0, limite)
        .map((jeu: any) => ({
          nom: jeu.name,
          popularite: jeu.ccu || 0, // Concurrent users
          joueursActuels: jeu.ccu,
          plateforme: 'PC (Steam)',
          imageUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${jeu.appid}/header.jpg`,
        }));

      return jeux;
    } catch (erreur) {
      console.error('Erreur obtention top jeux Steam :', erreur);
      return [];
    }
  }

  /**
   * Récupère depuis le cache si valide
   */
  private obtenirDuCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiration) {
      return cached.data;
    }
    return null;
  }

  /**
   * Met en cache les données
   */
  private mettreEnCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expiration: Date.now() + this.cacheDuration,
    });
  }
}
