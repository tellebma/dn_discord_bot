/** Représente un jeu dans le pool */
export interface Jeu {
  id: string;
  nom: string;
  description?: string;
  categorie?: string;
  joueursMin?: number;
  joueursMax?: number;
  ajoutePar: string;
  ajouteLe: Date;
}

/** Pool de jeux */
export interface PoolDeJeux {
  jeux: Jeu[];
}

/** Activité extra hebdomadaire */
export interface ActiviteExtra {
  id: string;
  nom: string;
  description?: string;
  lieu?: string;
  heure?: string;
  jourSemaine: number; // 0 = Dimanche, 1 = Lundi, etc.
  estActif: boolean;
  ajoutePar: string;
  ajouteLe: Date;
}

/** Pool d'activités extras */
export interface PoolActivitesExtras {
  activites: ActiviteExtra[];
}

/** Plan hebdomadaire */
export interface PlanHebdomadaire {
  semaine: string;
  jeux: Jeu[];
  activitesExtras: ActiviteExtra[];
  genereLe: Date;
}
