import fs from 'fs';
import path from 'path';
import { ActiviteExtra, PoolActivitesExtras } from '@/types/game';

const FICHIER_ACTIVITES_EXTRAS = path.join(process.cwd(), 'data', 'extraActivities.json');

/**
 * Gestionnaire des activités extras hebdomadaires
 * Singleton qui gère la persistance et les opérations sur les activités
 */
export class GestionnaireActivitesExtras {
  private static instance: GestionnaireActivitesExtras;
  private poolActivites: PoolActivitesExtras;

  private constructor() {
    this.poolActivites = this.chargerActivites();
  }

  /**
   * Récupère l'instance unique du gestionnaire
   */
  public static getInstance(): GestionnaireActivitesExtras {
    if (!GestionnaireActivitesExtras.instance) {
      GestionnaireActivitesExtras.instance = new GestionnaireActivitesExtras();
    }
    return GestionnaireActivitesExtras.instance;
  }

  /**
   * Charge les activités depuis le fichier JSON
   */
  private chargerActivites(): PoolActivitesExtras {
    try {
      if (fs.existsSync(FICHIER_ACTIVITES_EXTRAS)) {
        const donnees = fs.readFileSync(FICHIER_ACTIVITES_EXTRAS, 'utf-8');
        const parse = JSON.parse(donnees);
        return {
          activites:
            parse.activities?.map((activite: any) => ({
              id: activite.id,
              nom: activite.name,
              description: activite.description,
              lieu: activite.location,
              heure: activite.time,
              jourSemaine: activite.dayOfWeek,
              estActif: activite.isActive,
              ajoutePar: activite.addedBy,
              ajouteLe: new Date(activite.addedAt),
            })) || [],
        };
      }
    } catch (erreur) {
      console.error('Erreur lors du chargement des activités extras :', erreur);
    }

    return { activites: [] };
  }

  /**
   * Sauvegarde les activités dans le fichier JSON
   */
  private sauvegarderActivites(): void {
    try {
      const repertoire = path.dirname(FICHIER_ACTIVITES_EXTRAS);
      if (!fs.existsSync(repertoire)) {
        fs.mkdirSync(repertoire, { recursive: true });
      }
      // Conversion au format anglais pour compatibilité
      const donnees = {
        activities: this.poolActivites.activites.map(activite => ({
          id: activite.id,
          name: activite.nom,
          description: activite.description,
          location: activite.lieu,
          time: activite.heure,
          dayOfWeek: activite.jourSemaine,
          isActive: activite.estActif,
          addedBy: activite.ajoutePar,
          addedAt: activite.ajouteLe,
        })),
      };
      fs.writeFileSync(FICHIER_ACTIVITES_EXTRAS, JSON.stringify(donnees, null, 2));
    } catch (erreur) {
      console.error('Erreur lors de la sauvegarde des activités extras :', erreur);
    }
  }

  /**
   * Ajoute une nouvelle activité
   * @returns L'activité créée avec son ID
   */
  public ajouterActivite(activite: Omit<ActiviteExtra, 'id' | 'ajouteLe'>): ActiviteExtra {
    const nouvelleActivite: ActiviteExtra = {
      ...activite,
      id: Date.now().toString(),
      ajouteLe: new Date(),
    };

    this.poolActivites.activites.push(nouvelleActivite);
    this.sauvegarderActivites();
    return nouvelleActivite;
  }

  /**
   * Supprime une activité par son ID
   * @returns true si l'activité a été supprimée, false sinon
   */
  public supprimerActivite(idActivite: string): boolean {
    const longueurInitiale = this.poolActivites.activites.length;
    this.poolActivites.activites = this.poolActivites.activites.filter(
      activite => activite.id !== idActivite
    );

    if (this.poolActivites.activites.length < longueurInitiale) {
      this.sauvegarderActivites();
      return true;
    }
    return false;
  }

  /**
   * Inverse le statut actif/inactif d'une activité
   * @returns L'activité modifiée ou null si non trouvée
   */
  public basculerActivite(idActivite: string): ActiviteExtra | null {
    const activite = this.poolActivites.activites.find(a => a.id === idActivite);
    if (activite) {
      activite.estActif = !activite.estActif;
      this.sauvegarderActivites();
      return activite;
    }
    return null;
  }

  /**
   * Récupère toutes les activités
   */
  public obtenirActivites(): ActiviteExtra[] {
    return [...this.poolActivites.activites];
  }

  /**
   * Récupère uniquement les activités actives
   */
  public obtenirActivitesActives(): ActiviteExtra[] {
    return this.poolActivites.activites.filter(activite => activite.estActif);
  }

  /**
   * Récupère les activités pour un jour spécifique
   * @param jourSemaine Jour de la semaine (0 = Dimanche, 1 = Lundi, etc.)
   */
  public obtenirActivitesPourJour(jourSemaine: number): ActiviteExtra[] {
    return this.poolActivites.activites.filter(
      activite => activite.estActif && activite.jourSemaine === jourSemaine
    );
  }

  /**
   * Recherche une activité par nom ou ID
   */
  public trouverActivite(nomOuId: string): ActiviteExtra | undefined {
    return this.poolActivites.activites.find(
      activite =>
        activite.id === nomOuId || activite.nom.toLowerCase().includes(nomOuId.toLowerCase())
    );
  }

  /**
   * Récupère le nom du jour en français
   * @param jourSemaine Numéro du jour (0-6)
   */
  public obtenirNomJour(jourSemaine: number): string {
    const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return jours[jourSemaine] || 'Inconnu';
  }

  /**
   * Met à jour une activité existante
   * @returns L'activité mise à jour ou null si non trouvée
   */
  public mettreAJourActivite(
    idActivite: string,
    miseAJour: Partial<Omit<ActiviteExtra, 'id' | 'ajouteLe' | 'ajoutePar'>>
  ): ActiviteExtra | null {
    const activite = this.poolActivites.activites.find(a => a.id === idActivite);
    if (activite) {
      Object.assign(activite, miseAJour);
      this.sauvegarderActivites();
      return activite;
    }
    return null;
  }
}
