import { JeuTendance } from '@/types/stats';

const TWITCH_API_BASE = 'https://api.twitch.tv/helix';
const TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2/token';

/**
 * Client pour l'API Twitch
 */
export class ClientTwitch {
  private static instance: ClientTwitch;
  private clientId: string | null;
  private clientSecret: string | null;
  private accessToken: string | null = null;
  private tokenExpiration: number = 0;
  private cache: Map<string, { data: any; expiration: number }> = new Map();
  private cacheDuration = 1800000; // 30 minutes en ms

  private constructor() {
    this.clientId = process.env.TWITCH_CLIENT_ID || null;
    this.clientSecret = process.env.TWITCH_CLIENT_SECRET || null;
  }

  public static getInstance(): ClientTwitch {
    if (!ClientTwitch.instance) {
      ClientTwitch.instance = new ClientTwitch();
    }
    return ClientTwitch.instance;
  }

  /**
   * Vérifie si l'API Twitch est configurée
   */
  public estDisponible(): boolean {
    return this.clientId !== null && this.clientSecret !== null;
  }

  /**
   * Obtient un token d'accès OAuth
   */
  private async obtenirTokenAcces(): Promise<string | null> {
    if (this.accessToken && Date.now() < this.tokenExpiration) {
      return this.accessToken;
    }

    if (!this.estDisponible()) {
      return null;
    }

    try {
      const params = new URLSearchParams({
        client_id: this.clientId!,
        client_secret: this.clientSecret!,
        grant_type: 'client_credentials',
      });

      const response = await fetch(`${TWITCH_AUTH_URL}?${params}`, {
        method: 'POST',
      });

      const data = (await response.json()) as any;

      if (data.access_token) {
        this.accessToken = data.access_token;
        this.tokenExpiration = Date.now() + data.expires_in * 1000;
        console.log('✅ Token Twitch obtenu avec succès');
        return this.accessToken;
      }

      return null;
    } catch (erreur) {
      console.error('Erreur obtention token Twitch :', erreur);
      return null;
    }
  }

  /**
   * Effectue une requête vers l'API Twitch
   */
  private async requeteAPI(endpoint: string): Promise<any | null> {
    const token = await this.obtenirTokenAcces();
    if (!token || !this.clientId) {
      return null;
    }

    try {
      const response = await fetch(`${TWITCH_API_BASE}${endpoint}`, {
        headers: {
          'Client-ID': this.clientId,
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      return await response.json();
    } catch (erreur) {
      console.error('Erreur requête Twitch API :', erreur);
      return null;
    }
  }

  /**
   * Récupère les jeux les plus streamés sur Twitch
   */
  public async obtenirJeuxTendance(limite: number = 10): Promise<JeuTendance[]> {
    if (!this.estDisponible()) {
      console.warn('⚠️ Twitch API non configurée');
      return [];
    }

    const cacheKey = `tendances_${limite}`;
    const cached = this.obtenirDuCache(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.requeteAPI(`/games/top?first=${limite}`);

      if (!data || !data.data) {
        return [];
      }

      // Pour chaque jeu, récupérer le nombre de spectateurs
      const jeuxAvecStats = await Promise.all(
        data.data.map(async (jeu: any) => {
          const streams = await this.obtenirNombreSpectateurs(jeu.id);
          return {
            nom: jeu.name,
            popularite: streams.totalSpectateurs,
            spectateurs: streams.totalSpectateurs,
            plateforme: 'Multi-plateformes',
            imageUrl: jeu.box_art_url.replace('{width}', '285').replace('{height}', '380'),
          };
        })
      );

      this.mettreEnCache(cacheKey, jeuxAvecStats);
      return jeuxAvecStats;
    } catch (erreur) {
      console.error('Erreur obtention tendances Twitch :', erreur);
      return [];
    }
  }

  /**
   * Récupère le nombre total de spectateurs pour un jeu
   */
  private async obtenirNombreSpectateurs(
    gameId: string
  ): Promise<{ totalSpectateurs: number; nbStreams: number }> {
    try {
      const data = await this.requeteAPI(`/streams?game_id=${gameId}&first=100`);

      if (!data || !data.data) {
        return { totalSpectateurs: 0, nbStreams: 0 };
      }

      const totalSpectateurs = data.data.reduce(
        (sum: number, stream: any) => sum + stream.viewer_count,
        0
      );

      return {
        totalSpectateurs,
        nbStreams: data.data.length,
      };
    } catch {
      return { totalSpectateurs: 0, nbStreams: 0 };
    }
  }

  /**
   * Recherche un jeu sur Twitch
   */
  public async rechercherJeu(nomJeu: string): Promise<any | null> {
    if (!this.estDisponible()) {
      return null;
    }

    try {
      const data = await this.requeteAPI(
        `/search/categories?query=${encodeURIComponent(nomJeu)}&first=1`
      );

      if (data && data.data && data.data.length > 0) {
        return data.data[0];
      }

      return null;
    } catch (erreur) {
      console.error('Erreur recherche Twitch :', erreur);
      return null;
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
