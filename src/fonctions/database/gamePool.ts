/**
 * Gestionnaire du pool de jeux
 */
export class GestionnairePoolJeux {
  private static instance: GestionnairePoolJeux;
  private jeux: any[] = [];

  private constructor() {}

  public static getInstance(): GestionnairePoolJeux {
    if (!GestionnairePoolJeux.instance) {
      GestionnairePoolJeux.instance = new GestionnairePoolJeux();
    }
    return GestionnairePoolJeux.instance;
  }

  public async obtenirJeux(): Promise<any[]> {
    return this.jeux;
  }

  public async ajouterJeu(jeu: any): Promise<void> {
    this.jeux.push(jeu);
  }

  public async supprimerJeu(id: string): Promise<boolean> {
    const index = this.jeux.findIndex(j => j.id === id);
    if (index !== -1) {
      this.jeux.splice(index, 1);
      return true;
    }
    return false;
  }

  public async modifierJeu(id: string, modifications: any): Promise<boolean> {
    const index = this.jeux.findIndex(j => j.id === id);
    if (index !== -1) {
      this.jeux[index] = { ...this.jeux[index], ...modifications };
      return true;
    }
    return false;
  }

  public async obtenirJeuxAleatoires(nombre: number = 5): Promise<any[]> {
    const jeuxMelanges = [...this.jeux].sort(() => Math.random() - 0.5);
    return jeuxMelanges.slice(0, nombre);
  }
}