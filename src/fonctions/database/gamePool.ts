import fs from 'fs';
import path from 'path';
import { Jeu, PoolDeJeux } from '@/types/game';

const FICHIER_POOL_JEUX = path.join(process.cwd(), 'data', 'gamePool.json');

/**
 * Gestionnaire du pool de jeux
 * Singleton qui gère la persistance et les opérations sur les jeux
 */
export class GestionnairePoolJeux {
  private static instance: GestionnairePoolJeux;
  private poolJeux: PoolDeJeux;

  private constructor() {
    this.poolJeux = this.chargerPoolJeux();
  }

  /**
   * Récupère l'instance unique du gestionnaire
   */
  public static getInstance(): GestionnairePoolJeux {
    if (!GestionnairePoolJeux.instance) {
      GestionnairePoolJeux.instance = new GestionnairePoolJeux();
    }
    return GestionnairePoolJeux.instance;
  }

  /**
   * Charge le pool de jeux depuis le fichier JSON
   */
  private chargerPoolJeux(): PoolDeJeux {
    try {
      if (fs.existsSync(FICHIER_POOL_JEUX)) {
        const donnees = fs.readFileSync(FICHIER_POOL_JEUX, 'utf-8');
        const parse = JSON.parse(donnees);
        return {
          jeux:
            parse.games?.map((jeu: any) => ({
              id: jeu.id,
              nom: jeu.name,
              description: jeu.description,
              categorie: jeu.category,
              joueursMin: jeu.minPlayers,
              joueursMax: jeu.maxPlayers,
              ajoutePar: jeu.addedBy,
              ajouteLe: new Date(jeu.addedAt),
            })) || [],
        };
      }
    } catch (erreur) {
      console.error('Erreur lors du chargement du pool de jeux :', erreur);
    }

    return { jeux: [] };
  }

  /**
   * Sauvegarde le pool de jeux dans le fichier JSON
   */
  private sauvegarderPoolJeux(): void {
    try {
      const repertoire = path.dirname(FICHIER_POOL_JEUX);
      if (!fs.existsSync(repertoire)) {
        fs.mkdirSync(repertoire, { recursive: true });
      }
      // Conversion au format anglais pour compatibilité
      const donnees = {
        games: this.poolJeux.jeux.map(jeu => ({
          id: jeu.id,
          name: jeu.nom,
          description: jeu.description,
          category: jeu.categorie,
          minPlayers: jeu.joueursMin,
          maxPlayers: jeu.joueursMax,
          addedBy: jeu.ajoutePar,
          addedAt: jeu.ajouteLe,
        })),
      };
      fs.writeFileSync(FICHIER_POOL_JEUX, JSON.stringify(donnees, null, 2));
    } catch (erreur) {
      console.error('Erreur lors de la sauvegarde du pool de jeux :', erreur);
    }
  }

  /**
   * Ajoute un nouveau jeu au pool
   * @returns Le jeu créé avec son ID
   */
  public ajouterJeu(jeu: Omit<Jeu, 'id' | 'ajouteLe'>): Jeu {
    const nouveauJeu: Jeu = {
      ...jeu,
      id: Date.now().toString(),
      ajouteLe: new Date(),
    };

    this.poolJeux.jeux.push(nouveauJeu);
    this.sauvegarderPoolJeux();
    return nouveauJeu;
  }

  /**
   * Supprime un jeu du pool par son ID
   * @returns true si le jeu a été supprimé, false sinon
   */
  public supprimerJeu(idJeu: string): boolean {
    const longueurInitiale = this.poolJeux.jeux.length;
    this.poolJeux.jeux = this.poolJeux.jeux.filter(jeu => jeu.id !== idJeu);

    if (this.poolJeux.jeux.length < longueurInitiale) {
      this.sauvegarderPoolJeux();
      return true;
    }
    return false;
  }

  /**
   * Met à jour un jeu existant
   * @param idJeu ID du jeu à modifier
   * @param miseAJour Champs à mettre à jour
   * @returns Le jeu modifié ou undefined si non trouvé
   */
  public mettreAJourJeu(
    idJeu: string,
    miseAJour: Partial<Omit<Jeu, 'id' | 'ajouteLe' | 'ajoutePar'>>
  ): Jeu | undefined {
    const jeu = this.poolJeux.jeux.find(j => j.id === idJeu);
    if (jeu) {
      Object.assign(jeu, miseAJour);
      this.sauvegarderPoolJeux();
      return jeu;
    }
    return undefined;
  }

  /**
   * Récupère tous les jeux du pool
   */
  public obtenirJeux(): Jeu[] {
    return [...this.poolJeux.jeux];
  }

  /**
   * Récupère un nombre aléatoire de jeux
   * @param nombre Nombre de jeux à récupérer
   */
  public obtenirJeuxAleatoires(nombre: number): Jeu[] {
    const melanges = [...this.poolJeux.jeux].sort(() => 0.5 - Math.random());
    return melanges.slice(0, Math.min(nombre, melanges.length));
  }

  /**
   * Recherche un jeu par nom ou ID
   */
  public trouverJeu(nomOuId: string): Jeu | undefined {
    return this.poolJeux.jeux.find(
      jeu => jeu.id === nomOuId || jeu.nom.toLowerCase().includes(nomOuId.toLowerCase())
    );
  }
}
