/**
 * Types pour les statistiques
 */
export interface StatsBot {
  jeuxVotes: number;
  activitesCreees: number;
  utilisateursActifs: number;
  serveurs: number;
  commandesUtilisees: number;
  votesCrees: number;
}

export interface StatsJeu {
  id: string;
  nom: string;
  votes: number;
  derniereUtilisation: Date;
}

export interface StatsActivite {
  id: string;
  nom: string;
  utilisations: number;
  derniereUtilisation: Date;
}