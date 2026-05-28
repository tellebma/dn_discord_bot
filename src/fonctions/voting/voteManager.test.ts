import { describe, it, expect, vi, beforeEach } from 'vitest';

const queryMock = vi.fn();
vi.mock('../database/connection.js', () => ({
  query: (sql: string, params?: unknown[]): unknown => queryMock(sql, params),
}));

import { GestionnaireVotes } from './voteManager.js';

const votes = GestionnaireVotes.getInstance();

beforeEach(() => queryMock.mockReset());

describe('GestionnaireVotes.creerVote', () => {
  it('upsert la session puis insère chaque jeu proposé', async () => {
    queryMock.mockResolvedValue({ rowCount: 1 });

    await votes.creerVote({
      id: 'v1',
      guildId: 'guild-1',
      channelId: 'chan-1',
      messageId: 'msg-1',
      duree: 24,
      actif: true,
      creePar: 'u',
      jeux: [
        { id: 'g1', nom: 'A' },
        { id: 'g2', nom: 'B' },
      ],
    });

    expect(queryMock).toHaveBeenCalledTimes(3); // 1 vote + 2 vote_games
    expect(queryMock.mock.calls[0]?.[0]).toContain('INSERT INTO votes');
    expect(queryMock.mock.calls[0]?.[0]).toContain('ON CONFLICT (id) DO UPDATE');
    expect(queryMock.mock.calls[1]?.[0]).toContain('INSERT INTO vote_games');
    expect(queryMock.mock.calls[1]?.[1]).toEqual(['v1', 'g1', 'A']);
  });
});

describe('GestionnaireVotes.gererVote', () => {
  it('enregistre le bulletin si le vote est actif', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ actif: true }] }) // SELECT actif
      .mockResolvedValueOnce({ rowCount: 1 }); // INSERT ballot

    const ok = await votes.gererVote('v1', 'g1', 'u1');

    expect(ok).toBe(true);
    expect(queryMock.mock.calls[1]?.[0]).toContain('INSERT INTO vote_ballots');
    expect(queryMock.mock.calls[1]?.[1]).toEqual(['v1', 'g1', 'u1']);
  });

  it('refuse si le vote est inactif ou inexistant', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ actif: false }] });
    expect(await votes.gererVote('v1', 'g1', 'u1')).toBe(false);

    queryMock.mockResolvedValueOnce({ rows: [] });
    expect(await votes.gererVote('vX', 'g1', 'u1')).toBe(false);
    // aucun INSERT de bulletin déclenché
    expect(queryMock.mock.calls.every(c => !String(c[0]).includes('vote_ballots'))).toBe(true);
  });
});

describe('GestionnaireVotes.obtenirSessionActive', () => {
  it('réhydrate jeux + Map de votants distincts', async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'v1',
            guild_id: 'guild-1',
            channel_id: 'chan-1',
            message_id: 'msg-1',
            duree: 24,
            actif: true,
            cree_par: 'u',
            cree_le: new Date('2026-01-01'),
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ jeu_id: 'g1', nom: 'A' }] }) // vote_games
      .mockResolvedValueOnce({
        rows: [
          { jeu_id: 'g1', user_id: 'u1' },
          { jeu_id: 'g1', user_id: 'u2' },
        ],
      }); // vote_ballots

    const session = await votes.obtenirSessionActive('guild-1');

    expect(session?.id).toBe('v1');
    expect(session?.jeux).toEqual([{ id: 'g1', nom: 'A' }]);
    expect(session?.votes.get('g1')?.size).toBe(2);
    expect(queryMock.mock.calls[0]?.[1]).toEqual(['guild-1']);
  });

  it('renvoie null si aucun vote actif', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    expect(await votes.obtenirSessionActive('guild-1')).toBeNull();
  });
});

describe('GestionnaireVotes.obtenirVotesEchus', () => {
  it('sélectionne les votes actifs dont la durée est dépassée', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await votes.obtenirVotesEchus();
    const sql = String(queryMock.mock.calls[0]?.[0]);
    expect(sql).toContain('actif = TRUE');
    expect(sql).toContain("(duree || ' hours')::interval");
  });
});

describe('GestionnaireVotes.supprimerVote', () => {
  it('clôture en restant cloisonné au serveur', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    expect(await votes.supprimerVote('v1', 'guild-1')).toBe(true);
    expect(queryMock.mock.calls[0]?.[0]).toContain('AND guild_id = $2');
    expect(queryMock.mock.calls[0]?.[1]).toEqual(['v1', 'guild-1']);
  });
});
