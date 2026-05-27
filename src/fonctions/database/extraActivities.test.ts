import { describe, it, expect, vi, beforeEach } from 'vitest';

const queryMock = vi.fn();
vi.mock('./connection.js', () => ({
  query: (sql: string, params?: unknown[]): unknown => queryMock(sql, params),
}));

import { GestionnaireActivitesExtras } from './extraActivities.js';

const manager = GestionnaireActivitesExtras.getInstance();

beforeEach(() => queryMock.mockReset());

describe('GestionnaireActivitesExtras.obtenirActivites', () => {
  it('filtre les actives uniquement quand demandé', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await manager.obtenirActivites('guild-1', true);
    expect(queryMock.mock.calls[0]?.[0]).toContain('actif = TRUE');
    expect(queryMock.mock.calls[0]?.[1]).toEqual(['guild-1']);
  });

  it('renvoie tout par défaut et mappe cree_par/cree_le', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 'a1',
          nom: 'Act',
          description: null,
          categorie: 'Général',
          actif: true,
          cree_par: 'u',
          cree_le: new Date('2026-01-01'),
        },
      ],
    });
    const res = await manager.obtenirActivites('guild-1');
    expect(queryMock.mock.calls[0]?.[0]).not.toContain('actif = TRUE');
    expect(res[0]).toMatchObject({ id: 'a1', creeePar: 'u', categorie: 'Général' });
  });
});

describe('GestionnaireActivitesExtras.ajouterActivite', () => {
  it('insère avec guild_id', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    await manager.ajouterActivite({ id: 'a1', guildId: 'guild-1', nom: 'Act', creeePar: 'u' });
    const [sql, params] = queryMock.mock.calls[0] ?? [];
    expect(sql).toContain('INSERT INTO activities');
    expect(params).toEqual(['a1', 'guild-1', 'Act', null, null, true, 'u']);
  });
});

describe('GestionnaireActivitesExtras.modifierActivite', () => {
  it('construit un SET paramétré scopé au serveur', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    const ok = await manager.modifierActivite('a1', 'guild-1', { actif: false, nom: 'X' });
    const [sql, params] = queryMock.mock.calls[0] ?? [];
    expect(ok).toBe(true);
    expect(sql).toContain('WHERE id = $3 AND guild_id = $4');
    expect(params).toEqual([false, 'X', 'a1', 'guild-1']);
  });

  it('renvoie false sans colonne valide', async () => {
    expect(await manager.modifierActivite('a1', 'guild-1', {})).toBe(false);
    expect(queryMock).not.toHaveBeenCalled();
  });
});

describe('GestionnaireActivitesExtras.supprimerActivite', () => {
  it('renvoie false si aucune ligne', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 0 });
    expect(await manager.supprimerActivite('a1', 'guild-1')).toBe(false);
  });
});
