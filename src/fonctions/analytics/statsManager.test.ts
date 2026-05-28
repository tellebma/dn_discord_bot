import { describe, it, expect, vi, beforeEach } from 'vitest';

const queryMock = vi.fn();
vi.mock('../database/connection.js', () => ({
  query: (sql: string, params?: unknown[]): unknown => queryMock(sql, params),
}));

import { GestionnaireStats } from './statsManager.js';

const stats = GestionnaireStats.getInstance();

beforeEach(() => queryMock.mockReset());

describe('GestionnaireStats.obtenirStats', () => {
  it('fusionne les compteurs en base sur la base par défaut (entiers)', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        { cle: 'jeuxVotes', valeur: '7' },
        { cle: 'activitesCreees', valeur: '3' },
      ],
    });
    const res = await stats.obtenirStats();
    expect(res).toMatchObject({
      jeuxVotes: 7,
      activitesCreees: 3,
      utilisateursActifs: 0,
      serveurs: 0,
    });
  });
});

describe('GestionnaireStats.enregistrerVote', () => {
  it('incrémente le compteur jeuxVotes via UPSERT', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    await stats.enregistrerVote('g1', 'u1');
    const [sql, params] = queryMock.mock.calls[0] ?? [];
    expect(sql).toContain('ON CONFLICT (cle) DO UPDATE SET valeur = stats.valeur + 1');
    expect(params).toEqual(['jeuxVotes']);
  });
});

describe('GestionnaireStats.enregistrerActivite', () => {
  it('incrémente le compteur activitesCreees', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    await stats.enregistrerActivite('a1');
    expect(queryMock.mock.calls[0]?.[1]).toEqual(['activitesCreees']);
  });
});
