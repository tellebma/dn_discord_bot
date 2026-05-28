import { describe, it, expect, vi, beforeEach } from 'vitest';

const queryMock = vi.fn();
vi.mock('../fonctions/database/connection.js', () => ({
  query: (sql: string, params?: unknown[]): unknown => queryMock(sql, params),
}));

import { StockageCanal } from './channelStorage.js';

const storage = StockageCanal.getInstance();

beforeEach(() => queryMock.mockReset());

describe('StockageCanal.definirCanal', () => {
  it('upsert sur (guild_id, type)', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    await storage.definirCanal('guild-1', 'votes', 'chan-1');
    const [sql, params] = queryMock.mock.calls[0] ?? [];
    expect(sql).toContain('ON CONFLICT (guild_id, type) DO UPDATE');
    expect(params).toEqual(['guild-1', 'votes', 'chan-1']);
  });
});

describe('StockageCanal.obtenirCanal', () => {
  it('renvoie le canal_id de la ligne', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ canal_id: 'chan-1' }] });
    expect(await storage.obtenirCanal('guild-1', 'votes')).toBe('chan-1');
  });

  it('renvoie null si absent', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    expect(await storage.obtenirCanal('guild-1', 'votes')).toBeNull();
  });
});

describe('StockageCanal.supprimerCanal', () => {
  it('renvoie true si une ligne supprimée', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    expect(await storage.supprimerCanal('guild-1', 'votes')).toBe(true);
  });
});
