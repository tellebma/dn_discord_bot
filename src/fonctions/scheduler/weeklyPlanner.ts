/**
 * Planificateur hebdomadaire : génère un plan (jeux + activités) à partir du
 * contenu réellement présent en base pour le serveur.
 */
import { GestionnairePoolJeux, type Jeu } from '../database/gamePool.js';
import { GestionnaireActivitesExtras, type ActiviteExtra } from '../database/extraActivities.js';

export interface PlanHebdomadaire {
  jeux: Jeu[];
  activites: ActiviteExtra[];
  date: Date;
  periode: string;
}

export class PlanificateurHebdomadaire {
  private static instance: PlanificateurHebdomadaire;

  private constructor() {}

  public static getInstance(): PlanificateurHebdomadaire {
    if (!PlanificateurHebdomadaire.instance) {
      PlanificateurHebdomadaire.instance = new PlanificateurHebdomadaire();
    }
    return PlanificateurHebdomadaire.instance;
  }

  /**
   * Génère un plan pour le serveur : `nbJeux` jeux tirés au hasard dans le pool
   * actif + toutes les activités actives.
   */
  public async genererPlanHebdomadaire(
    guildId: string,
    nbJeux: number = 3
  ): Promise<PlanHebdomadaire> {
    const [jeux, activites] = await Promise.all([
      GestionnairePoolJeux.getInstance().obtenirJeuxAleatoires(guildId, nbJeux),
      GestionnaireActivitesExtras.getInstance().obtenirActivites(guildId, true),
    ]);

    return {
      jeux,
      activites,
      date: new Date(),
      periode: 'Cette semaine',
    };
  }
}
