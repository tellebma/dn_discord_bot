import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RawgAPI } from './rawgAPI.js';

function resetSingleton(): void {
  (RawgAPI as unknown as { instance?: RawgAPI }).instance = undefined;
}

beforeEach(resetSingleton);
afterEach(() => vi.unstubAllGlobals());

describe('RawgAPI.estConfigure', () => {
  it('false sans clé', () => {
    expect(RawgAPI.getInstance(undefined).estConfigure()).toBe(false);
  });
  it('true avec clé', () => {
    expect(RawgAPI.getInstance('k').estConfigure()).toBe(true);
  });
});

describe('RawgAPI.rechercherJeu', () => {
  it('ne fait aucun appel réseau sans clé', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const res = await RawgAPI.getInstance(undefined).rechercherJeu('Halo');
    expect(res).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('mappe les résultats RAWG (genres + plateformes)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            id: 1,
            name: 'Elden Ring',
            rating: 4.9,
            genres: [{ name: 'RPG' }, { name: 'Action' }],
            platforms: [{ platform: { name: 'PC' } }, { platform: { name: 'PS5' } }],
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await RawgAPI.getInstance('k').rechercherJeu('Elden', 1);

    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain('api.rawg.io/api/games');
    expect(url).toContain('search=Elden');
    expect(res[0]).toEqual({
      id: 1,
      nom: 'Elden Ring',
      note: 4.9,
      genres: ['RPG', 'Action'],
      plateformes: ['PC', 'PS5'],
    });
  });

  it('renvoie [] sur réponse non OK', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    expect(await RawgAPI.getInstance('k').rechercherJeu('x')).toEqual([]);
  });

  it('renvoie [] et avale les erreurs réseau', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));
    expect(await RawgAPI.getInstance('k').rechercherJeu('x')).toEqual([]);
  });
});
