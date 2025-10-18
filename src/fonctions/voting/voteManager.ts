/**
 * Gestionnaire des votes
 */
export class GestionnaireVotes {
  private static instance: GestionnaireVotes;
  private votes: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): GestionnaireVotes {
    if (!GestionnaireVotes.instance) {
      GestionnaireVotes.instance = new GestionnaireVotes();
    }
    return GestionnaireVotes.instance;
  }

  public async creerVote(vote: any): Promise<string> {
    const id = Date.now().toString();
    this.votes.set(id, vote);
    return id;
  }

  public async obtenirVote(id: string): Promise<any | undefined> {
    return this.votes.get(id);
  }

  public async supprimerVote(id: string): Promise<boolean> {
    return this.votes.delete(id);
  }

  public async obtenirVotesActifs(): Promise<any[]> {
    return Array.from(this.votes.values());
  }

  public async obtenirSessionActive(): Promise<any | null> {
    const votes = await this.obtenirVotesActifs();
    return votes.find(v => v.actif) || null;
  }

  public async gererVote(voteId: string, _jeuId: string, _userId: string): Promise<boolean> {
    const vote = await this.obtenirVote(voteId);
    if (vote && vote.actif) {
      // Simuler l'enregistrement du vote
      return true;
    }
      return false;
  }
}