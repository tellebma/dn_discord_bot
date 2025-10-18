/**
 * API Twitch
 */
export class TwitchAPI {
  private static instance: TwitchAPI;
  private constructor(_clientId: string, _clientSecret: string) {
    // API credentials stored for future use
  }

  public static getInstance(clientId?: string, clientSecret?: string): TwitchAPI {
    if (!TwitchAPI.instance && clientId && clientSecret) {
      TwitchAPI.instance = new TwitchAPI(clientId, clientSecret);
    }
    return TwitchAPI.instance;
  }

  public async obtenirJeuxPopulaires(): Promise<any[]> {
    // Simulation - remplacer par vraie API
    return [
      { nom: 'Just Chatting', spectateurs: 500000 },
      { nom: 'League of Legends', spectateurs: 300000 },
      { nom: 'Fortnite', spectateurs: 200000 },
    ];
  }
}
