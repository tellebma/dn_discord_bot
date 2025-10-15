/**
 * Types pour le système de statistiques
 */

export interface StatistiquesGenerales {
  totalJeux: number;
  totalActivites: number;
  plansGeneres: number;
  contributeurs: number;
  categories: number;
  populariteMoyenne: number;
  topJeux: JeuPopulaire[];
}

export interface JeuPopulaire {
  id: string;
  nom: string;
  selections: number;
  categorie?: string;
}

export interface StatistiquesJeux {
  total: number;
  actifs: number;
  categories: number;
  parCategorie: StatCategorie[];
  deuxJoueurs: number;
  petitGroupe: number;
  moyenGroupe: number;
  grandGroupe: number;
}

export interface StatCategorie {
  categorie: string;
  nombre: number;
  pourcentage: number;
}

export interface TendanceExterne {
  source: 'steam' | 'twitch' | 'rawg' | 'igdb';
  jeux: JeuTendance[];
  derniereMAJ: Date;
}

export interface JeuTendance {
  nom: string;
  popularite: number;
  spectateurs?: number;  // Pour Twitch
  joueursActuels?: number;  // Pour Steam
  note?: number;  // Pour RAWG/IGDB
  plateforme?: string;
  imageUrl?: string;
}

export interface DonneesStatistiques {
  jeuxSelectionnes: { [idJeu: string]: number };
  participations: { [idUtilisateur: string]: number };
  votesCasts: { [idUtilisateur: string]: number };
  derniereMAJ: Date;
}



