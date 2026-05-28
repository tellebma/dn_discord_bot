/**
 * Client RAWG (https://rawg.io/apidocs) — recherche de jeux.
 *
 * Hôte fixe (api.rawg.io), seule la query est saisie par l'utilisateur et passe
 * en paramètre encodé : pas de SSRF. Timeout dur via AbortSignal. En l'absence
 * de clé ou en cas d'erreur réseau, renvoie [] (l'appelant garde ses valeurs par
 * défaut) — jamais d'exception propagée vers la commande.
 */
import { Logger } from '../../utils/logger.js';

const RAWG_BASE = 'https://api.rawg.io/api';
const TIMEOUT_MS = 8000;

export interface ResultatJeuRawg {
  id: number;
  nom: string;
  note: number;
  genres: string[];
  plateformes: string[];
}

interface RawgGame {
  id: number;
  name: string;
  rating: number;
  genres?: Array<{ name: string }>;
  platforms?: Array<{ platform: { name: string } }>;
}

interface RawgSearchResponse {
  results?: RawgGame[];
}

export class RawgAPI {
  private static instance: RawgAPI;
  private readonly apiKey: string | undefined;

  private constructor(apiKey: string | undefined) {
    this.apiKey = apiKey;
  }

  public static getInstance(apiKey: string | undefined = process.env['RAWG_API_KEY']): RawgAPI {
    if (!RawgAPI.instance) {
      RawgAPI.instance = new RawgAPI(apiKey);
    }
    return RawgAPI.instance;
  }

  public estConfigure(): boolean {
    return Boolean(this.apiKey);
  }

  public async rechercherJeu(nom: string, limite: number = 5): Promise<ResultatJeuRawg[]> {
    if (!this.apiKey) return [];

    const params = new URLSearchParams({
      key: this.apiKey,
      search: nom,
      page_size: String(limite),
    });

    try {
      const reponse = await fetch(`${RAWG_BASE}/games?${params.toString()}`, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!reponse.ok) {
        Logger.warn('RAWG: réponse non OK', { status: reponse.status });
        return [];
      }

      const data = (await reponse.json()) as RawgSearchResponse;
      return (data.results ?? []).map(jeu => ({
        id: jeu.id,
        nom: jeu.name,
        note: jeu.rating,
        genres: (jeu.genres ?? []).map(g => g.name),
        plateformes: (jeu.platforms ?? []).map(p => p.platform.name),
      }));
    } catch (error) {
      Logger.warn('RAWG: échec de la recherche', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }
}
