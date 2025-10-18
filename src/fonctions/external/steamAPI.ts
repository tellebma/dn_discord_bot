/**
 * API Steam
 */
export class SteamAPI {
  private static instance: SteamAPI;
  private constructor(_apiKey: string) {
    // API key stored for future use
  }

  public static getInstance(apiKey?: string): SteamAPI {
    if (!SteamAPI.instance && apiKey) {
      SteamAPI.instance = new SteamAPI(apiKey);
    }
    return SteamAPI.instance;
  }

  public async obtenirJeuxPopulaires(): Promise<any[]> {
    // Simulation - remplacer par vraie API
    return [
      { nom: 'Counter-Strike 2', joueurs: 1500000 },
      { nom: 'Dota 2', joueurs: 800000 },
      { nom: 'Apex Legends', joueurs: 500000 },
    ];
  }

  public async rechercherJeu(nom: string): Promise<any[]> {
    // Simulation - remplacer par vraie API
    return [{ nom, appid: Math.floor(Math.random() * 1000000) }];
  }
}
