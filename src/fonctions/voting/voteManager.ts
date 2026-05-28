/**
 * Gestionnaire des votes — persisté en PostgreSQL.
 *
 * Les bulletins sont stockés un par (vote, jeu, utilisateur) : un utilisateur ne
 * peut pas voter deux fois pour le même jeu (PK), mais peut voter pour plusieurs
 * jeux. La réhydratation reconstruit l'objet attendu par les commandes :
 *   { id, guildId, channelId, messageId, duree, actif, creeLe: Date, creePar,
 *     jeux: [{id, nom}], votes: Map<jeuId, Set<userId>> }
 */
import { query } from '../database/connection.js';

export interface JeuPropose {
  id: string;
  nom: string;
}

export interface SessionVoteHydratee {
  id: string;
  guildId: string | null;
  channelId: string | null;
  messageId: string | null;
  duree: number;
  actif: boolean;
  creeLe: Date;
  creePar: string;
  jeux: JeuPropose[];
  votes: Map<string, Set<string>>;
}

interface LigneVote {
  id: string;
  guild_id: string | null;
  channel_id: string | null;
  message_id: string | null;
  duree: number;
  actif: boolean;
  cree_par: string;
  cree_le: Date;
}

/** Objet vote accepté par creerVote (création ou mise à jour de statut). */
interface EntreeVote {
  id: string;
  guildId: string;
  channelId: string;
  messageId: string;
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
   * appel ne fait que mettre à jour le statut / les métadonnées.
   */
  public async creerVote(vote: EntreeVote): Promise<string> {
    await query(
      `INSERT INTO votes (id, guild_id, channel_id, message_id, duree, actif, cree_par)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         actif = EXCLUDED.actif,
         duree = EXCLUDED.duree,
         channel_id = EXCLUDED.channel_id,
         message_id = EXCLUDED.message_id`,
      [vote.id, vote.guildId, vote.channelId, vote.messageId, vote.duree, vote.actif, vote.creePar]
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

  /** Clôture un vote en restant cloisonné au serveur (commande /cancelvote). */
  public async supprimerVote(id: string, guildId: string): Promise<boolean> {
    const res = await query('UPDATE votes SET actif = FALSE WHERE id = $1 AND guild_id = $2', [
      id,
      guildId,
    ]);
    return (res.rowCount ?? 0) > 0;
  }

  /** Clôture un vote sans contrôle de serveur (usage interne : cron). */
  public async cloturerVote(id: string): Promise<void> {
    await query('UPDATE votes SET actif = FALSE WHERE id = $1', [id]);
  }

  public async obtenirVotesActifs(guildId: string): Promise<SessionVoteHydratee[]> {
    const res = await query<LigneVote>(
      'SELECT * FROM votes WHERE guild_id = $1 AND actif = TRUE ORDER BY cree_le DESC',
      [guildId]
    );
    return Promise.all(res.rows.map(ligne => this.hydrater(ligne)));
  }

  public async obtenirSessionActive(guildId: string): Promise<SessionVoteHydratee | null> {
    const res = await query<LigneVote>(
      'SELECT * FROM votes WHERE guild_id = $1 AND actif = TRUE ORDER BY cree_le DESC LIMIT 1',
      [guildId]
    );
    const ligne = res.rows[0];
    return ligne ? this.hydrater(ligne) : null;
  }

  /**
   * Votes actifs dont la durée est écoulée (cree_le + duree heures < maintenant).
   * Utilisé par le cron de clôture, tous serveurs confondus.
   */
  public async obtenirVotesEchus(): Promise<SessionVoteHydratee[]> {
    const res = await query<LigneVote>(
      `SELECT * FROM votes
       WHERE actif = TRUE
         AND cree_le + (duree || ' hours')::interval < NOW()`
    );
    return Promise.all(res.rows.map(ligne => this.hydrater(ligne)));
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
      guildId: ligne.guild_id,
      channelId: ligne.channel_id,
      messageId: ligne.message_id,
      duree: ligne.duree,
      actif: ligne.actif,
      creeLe: ligne.cree_le,
      creePar: ligne.cree_par,
      jeux: jeuxRes.rows.map(j => ({ id: j.jeu_id, nom: j.nom })),
      votes,
    };
  }
}
