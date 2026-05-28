/**
 * Gestionnaire des activités extras — persisté en PostgreSQL, cloisonné par serveur.
 */
import { query } from './connection.js';

export interface ActiviteExtra {
  id: string;
  nom: string;
  description: string | null;
  categorie: string | null;
  actif: boolean;
  creeePar: string;
  creeeLe: Date;
}

interface LigneActivite {
  id: string;
  nom: string;
  description: string | null;
  categorie: string | null;
  actif: boolean;
  cree_par: string;
  cree_le: Date;
}

function versActivite(ligne: LigneActivite): ActiviteExtra {
  return {
    id: ligne.id,
    nom: ligne.nom,
    description: ligne.description,
    categorie: ligne.categorie,
    actif: ligne.actif,
    creeePar: ligne.cree_par,
    creeeLe: ligne.cree_le,
  };
}

const COLONNES_MODIFIABLES: Record<string, string> = {
  nom: 'nom',
  description: 'description',
  categorie: 'categorie',
  actif: 'actif',
};

export class GestionnaireActivitesExtras {
  private static instance: GestionnaireActivitesExtras;

  private constructor() {}

  public static getInstance(): GestionnaireActivitesExtras {
    if (!GestionnaireActivitesExtras.instance) {
      GestionnaireActivitesExtras.instance = new GestionnaireActivitesExtras();
    }
    return GestionnaireActivitesExtras.instance;
  }

  public async obtenirActivites(
    guildId: string,
    activesUniquement: boolean = false
  ): Promise<ActiviteExtra[]> {
    const res = activesUniquement
      ? await query<LigneActivite>(
          'SELECT * FROM activities WHERE guild_id = $1 AND actif = TRUE ORDER BY cree_le DESC',
          [guildId]
        )
      : await query<LigneActivite>(
          'SELECT * FROM activities WHERE guild_id = $1 ORDER BY cree_le DESC',
          [guildId]
        );
    return res.rows.map(versActivite);
  }

  public async ajouterActivite(activite: {
    id: string;
    guildId: string;
    nom: string;
    description?: string;
    categorie?: string;
    actif?: boolean;
    creeePar: string;
  }): Promise<void> {
    await query(
      `INSERT INTO activities (id, guild_id, nom, description, categorie, actif, cree_par)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        activite.id,
        activite.guildId,
        activite.nom,
        activite.description ?? null,
        activite.categorie ?? null,
        activite.actif ?? true,
        activite.creeePar,
      ]
    );
  }

  public async supprimerActivite(id: string, guildId: string): Promise<boolean> {
    const res = await query('DELETE FROM activities WHERE id = $1 AND guild_id = $2', [
      id,
      guildId,
    ]);
    return (res.rowCount ?? 0) > 0;
  }

  public async modifierActivite(
    id: string,
    guildId: string,
    modifications: Record<string, unknown>
  ): Promise<boolean> {
    const sets: string[] = [];
    const valeurs: unknown[] = [];

    for (const [cle, valeur] of Object.entries(modifications)) {
      const colonne = COLONNES_MODIFIABLES[cle];
      if (!colonne) continue;
      valeurs.push(valeur);
      sets.push(`${colonne} = $${valeurs.length}`);
    }

    if (sets.length === 0) return false;

    valeurs.push(id);
    valeurs.push(guildId);
    const res = await query(
      `UPDATE activities SET ${sets.join(', ')} WHERE id = $${valeurs.length - 1} AND guild_id = $${valeurs.length}`,
      valeurs
    );
    return (res.rowCount ?? 0) > 0;
  }
}
