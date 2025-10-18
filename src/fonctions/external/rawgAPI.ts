/**
 * API RAWG
 */
export class RawgAPI {
  private static instance: RawgAPI;
  private constructor(_apiKey: string) {
    // API key stored for future use
  }

  public static getInstance(apiKey?: string): RawgAPI {
    if (!RawgAPI.instance && apiKey) {
      RawgAPI.instance = new RawgAPI(apiKey);
    }
    return RawgAPI.instance;
  }

  public async rechercherJeu(nom: string): Promise<any[]> {
    // Simulation - remplacer par vraie API
    return [
      {
        nom,
        id: Math.floor(Math.random() * 1000000),
        note: Math.random() * 5,
        genres: ['Action', 'Aventure'],
      },
    ];
  }

  public async obtenirJeuxTendances(): Promise<any[]> {
    // Simulation - remplacer par vraie API
    return [
      { nom: "Baldur's Gate 3", note: 4.8 },
      { nom: 'Cyberpunk 2077', note: 4.2 },
      { nom: 'Elden Ring', note: 4.9 },
    ];
  }
}
