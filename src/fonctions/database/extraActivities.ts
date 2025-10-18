/**
 * Gestionnaire des activités extras
 */
export class GestionnaireActivitesExtras {
  private static instance: GestionnaireActivitesExtras;
  private activites: any[] = [];

  private constructor() {}

  public static getInstance(): GestionnaireActivitesExtras {
    if (!GestionnaireActivitesExtras.instance) {
      GestionnaireActivitesExtras.instance = new GestionnaireActivitesExtras();
    }
    return GestionnaireActivitesExtras.instance;
  }

  public async obtenirActivites(activesUniquement: boolean = false): Promise<any[]> {
    if (activesUniquement) {
      return this.activites.filter(activite => activite.actif !== false);
    }
    return this.activites;
  }

  public async ajouterActivite(activite: any): Promise<void> {
    this.activites.push(activite);
  }

  public async supprimerActivite(id: string): Promise<boolean> {
    const index = this.activites.findIndex(a => a.id === id);
    if (index !== -1) {
      this.activites.splice(index, 1);
      return true;
    }
    return false;
  }

  public async modifierActivite(id: string, modifications: any): Promise<boolean> {
    const index = this.activites.findIndex(a => a.id === id);
    if (index !== -1) {
      this.activites[index] = { ...this.activites[index], ...modifications };
      return true;
    }
    return false;
  }
}