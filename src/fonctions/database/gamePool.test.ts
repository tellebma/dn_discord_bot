import { describe, it, expect, vi, beforeEach } from 'vitest';

const queryMock = vi.fn();
vi.mock('./connection.js', () => ({
  query: (sql: string, params?: unknown[]): unknown => queryMock(sql, params),
}));

import { GestionnairePoolJeux } from './gamePool.js';

const manager = GestionnairePoolJeux.getInstance();

beforeEach(() => queryMock.mockReset());

describe('GestionnairePoolJeux.obtenirJeux', () => {
  it('filtre par guild et mappe les colonnes snake_case', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 'g1',
          nom: 'Jeu',
          description: null,
          plateforme: 'PC',
          genre: null,
          joueurs_min: 1,
          joueurs_max: 4,
          actif: true,
          ajoute_par: 'u',
          ajoute_le: new Date('2026-01-01'),
        },
      ],
    });

    const jeux = await manager.obtenirJeux('guild-1');

    expect(queryMock.mock.calls[0]?.[0]).toContain('WHERE guild_id = $1');
    expect(queryMock.mock.calls[0]?.[1]).toEqual(['guild-1']);
    expect(jeux[0]).toMatchObject({ id: 'g1', plateforme: 'PC', joueursMin: 1, votes: 0 });
  });
});

describe('GestionnairePoolJeux.ajouterJeu', () => {
  it('insère avec guild_id et valeurs par défaut nulles', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });

    await manager.ajouterJeu({ id: 'g1', guildId: 'guild-1', nom: 'Jeu', ajoutePar: 'u' });

    const [sql, params] = queryMock.mock.calls[0] ?? [];
    expect(sql).toContain('INSERT INTO games');
    expect(params).toEqual(['g1', 'guild-1', 'Jeu', null, null, null, null, null, true, 'u']);
  });
});

describe('GestionnairePoolJeux.supprimerJeu', () => {
  it('scope la suppression au serveur et renvoie true si une ligne supprimée', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    expect(await manager.supprimerJeu('g1', 'guild-1')).toBe(true);
    expect(queryMock.mock.calls[0]?.[0]).toContain('AND guild_id = $2');
    expect(queryMock.mock.calls[0]?.[1]).toEqual(['g1', 'guild-1']);
  });

  it('renvoie false si aucune ligne (mauvais serveur)', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 0 });
    expect(await manager.supprimerJeu('g1', 'autre')).toBe(false);
  });
});

describe('GestionnairePoolJeux.modifierJeu', () => {
  it('ignore les colonnes hors liste blanche et construit le SET paramétré', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });

    const ok = await manager.modifierJeu('g1', 'guild-1', {
      nom: 'Nouveau',
      plateforme: 'PS5',
      colonneInterdite: 'DROP TABLE games',
    });

    const [sql, params] = queryMock.mock.calls[0] ?? [];
    expect(ok).toBe(true);
    expect(sql).toContain('UPDATE games SET nom = $1, plateforme = $2');
    expect(sql).not.toContain('colonneInterdite');
    expect(sql).toContain('WHERE id = $3 AND guild_id = $4');
    expect(params).toEqual(['Nouveau', 'PS5', 'g1', 'guild-1']);
  });

  it('renvoie false sans requête si aucune colonne valide', async () => {
    const ok = await manager.modifierJeu('g1', 'guild-1', { inconnu: 1 });
    expect(ok).toBe(false);
    expect(queryMock).not.toHaveBeenCalled();
  });
});

describe('GestionnairePoolJeux.obtenirJeuxAleatoires', () => {
  it('utilise RANDOM() et limite par guild + nombre', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    await manager.obtenirJeuxAleatoires('guild-1', 3);
    expect(queryMock.mock.calls[0]?.[0]).toContain('ORDER BY RANDOM()');
    expect(queryMock.mock.calls[0]?.[1]).toEqual(['guild-1', 3]);
  });
});
