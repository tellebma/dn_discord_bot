/**
 * Gestionnaire des votes — persisté en PostgreSQL.
 *
 * Les bulletins sont stockés un par (vote, jeu, utilisateur) : un utilisateur ne
 * peut pas voter deux fois pour le même jeu (PK), mais peut voter pour plusieurs
 * jeux. La réhydratation reconstruit l'objet attendu par les commandes :
 *   { id, duree, actif, creeLe: Date, creePar, jeux: [{id, nom}],
 *     votes: Map<jeuId, Set<userId>> }
 */
import { query } from '../database/connection.js';

export interface JeuPropose {
  id: string;
  nom: string;
}

export interface SessionVoteHydratee {
  id: string;
  duree: number;
  actif: boolean;
  creeLe: Date;
  creePar: string;
  jeux: JeuPropose[];
  votes: Map<string, Set<string>>;
}

interface LigneVote {
  id: string;
  duree: number;
  actif: boolean;
  cree_par: string;
  cree_le: Date;
}

/** Objet vote accepté par creerVote (création ou mise à jour de statut). */
interface EntreeVote {
  id: string;
  duree: number;
  actif: boolean;
  creePar: string;
  jeux: Array<{ id: string; nom: string }>;
}

export class GestionnaireVotes {
  private static instance: GestionnaireVotes;

  private constructor() {}

  public static getInstance(): GestionnaireVotes {
    if (!GestionnaireVotes.instance) {
      GestionnaireVotes.instance = new GestionnaireVotes();
    }
    return GestionnaireVotes.instance;
  }

  /**
   * Crée ou met à jour une session de vote. Idempotent sur l'id : un second
   * appel (ex. clôture avec actif=false) ne fait que mettre à jour le statut.
   */
  public async creerVote(vote: EntreeVote): Promise<string> {
    await query(
      `INSERT INTO votes (id, duree, actif, cree_par)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET actif = EXCLUDED.actif, duree = EXCLUDED.duree`,
      [vote.id, vote.duree, vote.actif, vote.creePar]
    );

    for (const jeu of vote.jeux) {
      await query(
        `INSERT INTO vote_games (vote_id, jeu_id, nom)
         VALUES ($1, $2, $3)
         ON CONFLICT (vote_id, jeu_id) DO NOTHING`,
        [vote.id, jeu.id, jeu.nom]
      );
    }

    return vote.id;
  }

  public async obtenirVote(id: string): Promise<SessionVoteHydratee | undefined> {
    const res = await query<LigneVote>('SELECT * FROM votes WHERE id = $1', [id]);
    const ligne = res.rows[0];
    if (!ligne) return undefined;
    return this.hydrater(ligne);
  }

  public async supprimerVote(id: string): Promise<boolean> {
    // On clôture (actif = false) plutôt que de supprimer, pour garder l'historique.
    const res = await query('UPDATE votes SET actif = FALSE WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  public async obtenirVotesActifs(): Promise<SessionVoteHydratee[]> {
    const res = await query<LigneVote>(
      'SELECT * FROM votes WHERE actif = TRUE ORDER BY cree_le DESC'
    );
    return Promise.all(res.rows.map(ligne => this.hydrater(ligne)));
  }

  public async obtenirSessionActive(): Promise<SessionVoteHydratee | null> {
    const res = await query<LigneVote>(
      'SELECT * FROM votes WHERE actif = TRUE ORDER BY cree_le DESC LIMIT 1'
    );
    const ligne = res.rows[0];
    return ligne ? this.hydrater(ligne) : null;
  }

  /**
   * Enregistre le bulletin d'un utilisateur. Retourne true si le vote était
   * actif et le bulletin pris en compte (ou déjà présent).
   */
  public async gererVote(voteId: string, jeuId: string, userId: string): Promise<boolean> {
    const res = await query<{ actif: boolean }>('SELECT actif FROM votes WHERE id = $1', [voteId]);
    const ligne = res.rows[0];
    if (!ligne || !ligne.actif) return false;

    await query(
      `INSERT INTO vote_ballots (vote_id, jeu_id, user_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (vote_id, jeu_id, user_id) DO NOTHING`,
      [voteId, jeuId, userId]
    );
    return true;
  }

  private async hydrater(ligne: LigneVote): Promise<SessionVoteHydratee> {
    const jeuxRes = await query<{ jeu_id: string; nom: string }>(
      'SELECT jeu_id, nom FROM vote_games WHERE vote_id = $1',
      [ligne.id]
    );
    const ballotsRes = await query<{ jeu_id: string; user_id: string }>(
      'SELECT jeu_id, user_id FROM vote_ballots WHERE vote_id = $1',
      [ligne.id]
    );

    const votes = new Map<string, Set<string>>();
    for (const b of ballotsRes.rows) {
      const ensemble = votes.get(b.jeu_id) ?? new Set<string>();
      ensemble.add(b.user_id);
      votes.set(b.jeu_id, ensemble);
    }

    return {
      id: ligne.id,
      duree: ligne.duree,
      actif: ligne.actif,
      creeLe: ligne.cree_le,
      creePar: ligne.cree_par,
      jeux: jeuxRes.rows.map(j => ({ id: j.jeu_id, nom: j.nom })),
      votes,
    };
  }
}
