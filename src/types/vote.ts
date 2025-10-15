/**
 * Types pour le système de votes
 */

export interface SessionVote {
  id: string;
  semaine: string;
  jeuxProposes: string[]; // IDs des jeux
  votes: Map<string, VoteJeu>; // idJeu -> VoteJeu
  messageId: string; // ID du message de vote principal
  canalId: string;
  dateDebut: Date;
  dateFin: Date;
  statut: 'en_cours' | 'termine' | 'annule';
  planGenere: boolean;
  creerPar: string;
}

export interface VoteJeu {
  idJeu: string;
  votesUtilisateurs: string[]; // IDs des utilisateurs qui ont voté
  score: number; // Score total
}

export interface ResultatVote {
  idJeu: string;
  nomJeu: string;
  score: number;
  nbVotes: number;
  pourcentage: number;
}

export interface RappelVote {
  sessionId: string;
  dernierRappel: Date;
  prochainRappel: Date;
  rappelsEnvoyes: number;
}
