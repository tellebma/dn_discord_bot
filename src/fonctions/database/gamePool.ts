/**
 * Gestionnaire du pool de jeux — persisté en PostgreSQL.
 */
import { query } from './connection.js';

export interface Jeu {
  id: string;
  nom: string;
  description: string | null;
  plateforme: string | null;
  genre: string | null;
  joueursMin: number | null;
  joueursMax: number | null;
  actif: boolean;
  ajoutePar: string;
  ajouteLe: Date;
  /** Compteur d'affichage. Le décompte réel des votes vit dans vote_ballots,
   *  par session ; ce champ reste à 0 (agrégation par jeu non implémentée). */
  votes: number;
}

interface LigneJeu {
  id: string;
  nom: string;
  description: string | null;
  plateforme: string | null;
  genre: string | null;
  joueurs_min: number | null;
  joueurs_max: number | null;
  actif: boolean;
  ajoute_par: string;
  ajoute_le: Date;
}

function versJeu(ligne: LigneJeu): Jeu {
  return {
    id: ligne.id,
    nom: ligne.nom,
    description: ligne.description,
    plateforme: ligne.plateforme,
    genre: ligne.genre,
    joueursMin: ligne.joueurs_min,
    joueursMax: ligne.joueurs_max,
    actif: ligne.actif,
    ajoutePar: ligne.ajoute_par,
    ajouteLe: ligne.ajoute_le,
    votes: 0,
  };
}

// Liste blanche colonne logique -> colonne SQL pour modifierJeu (anti-injection
// via nom de colonne : on n'interpole jamais une clé arbitraire dans le SQL).
const COLONNES_MODIFIABLES: Record<string, string> = {
  nom: 'nom',
  description: 'description',
  plateforme: 'plateforme',
  genre: 'genre',
  joueursMin: 'joueurs_min',
  joueursMax: 'joueurs_max',
  actif: 'actif',
};

export class GestionnairePoolJeux {
  private static instance: GestionnairePoolJeux;

  private constructor() {}

  public static getInstance(): GestionnairePoolJeux {
    if (!GestionnairePoolJeux.instance) {
      GestionnairePoolJeux.instance = new GestionnairePoolJeux();
    }
    return GestionnairePoolJeux.instance;
  }

  public async obtenirJeux(): Promise<Jeu[]> {
    const res = await query<LigneJeu>('SELECT * FROM games ORDER BY ajoute_le DESC');
    return res.rows.map(versJeu);
  }

  public async ajouterJeu(jeu: {
    id: string;
    nom: string;
    description?: string;
    plateforme?: string;
    genre?: string;
    joueursMin?: number;
    joueursMax?: number;
    actif?: boolean;
    ajoutePar: string;
  }): Promise<void> {
    await query(
      `INSERT INTO games
         (id, nom, description, plateforme, genre, joueurs_min, joueurs_max, actif, ajoute_par)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        jeu.id,
        jeu.nom,
        jeu.description ?? null,
        jeu.plateforme ?? null,
        jeu.genre ?? null,
        jeu.joueursMin ?? null,
        jeu.joueursMax ?? null,
        jeu.actif ?? true,
        jeu.ajoutePar,
      ]
    );
  }

  public async supprimerJeu(id: string): Promise<boolean> {
    const res = await query('DELETE FROM games WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  public async modifierJeu(id: string, modifications: Record<string, unknown>): Promise<boolean> {
    const sets: string[] = [];
    const valeurs: unknown[] = [];

    for (const [cle, valeur] of Object.entries(modifications)) {
      const colonne = COLONNES_MODIFIABLES[cle];
      if (!colonne) continue; // ignore les champs non autorisés
      valeurs.push(valeur);
      sets.push(`${colonne} = $${valeurs.length}`);
    }

    if (sets.length === 0) return false;

    valeurs.push(id);
    const res = await query(
      `UPDATE games SET ${sets.join(', ')} WHERE id = $${valeurs.length}`,
      valeurs
    );
    return (res.rowCount ?? 0) > 0;
  }

  public async obtenirJeuxAleatoires(nombre: number = 5): Promise<Jeu[]> {
    const res = await query<LigneJeu>(
      'SELECT * FROM games WHERE actif = TRUE ORDER BY RANDOM() LIMIT $1',
      [nombre]
    );
    return res.rows.map(versJeu);
  }
}
