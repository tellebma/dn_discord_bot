import { describe, it, expect, vi, beforeEach } from 'vitest';

const obtenirJeuxAleatoires = vi.fn();
const obtenirActivites = vi.fn();

vi.mock('../database/gamePool.js', () => ({
  GestionnairePoolJeux: { getInstance: () => ({ obtenirJeuxAleatoires }) },
}));
vi.mock('../database/extraActivities.js', () => ({
  GestionnaireActivitesExtras: { getInstance: () => ({ obtenirActivites }) },
}));

import { PlanificateurHebdomadaire } from './weeklyPlanner.js';

const planner = PlanificateurHebdomadaire.getInstance();

beforeEach(() => {
  obtenirJeuxAleatoires.mockReset();
  obtenirActivites.mockReset();
});

describe('PlanificateurHebdomadaire.genererPlanHebdomadaire', () => {
  it('assemble jeux aléatoires + activités actives du serveur', async () => {
    obtenirJeuxAleatoires.mockResolvedValueOnce([{ id: 'g1', nom: 'Jeu' }]);
    obtenirActivites.mockResolvedValueOnce([{ id: 'a1', nom: 'Act' }]);

    const plan = await planner.genererPlanHebdomadaire('guild-1', 3);

    expect(obtenirJeuxAleatoires).toHaveBeenCalledWith('guild-1', 3);
    expect(obtenirActivites).toHaveBeenCalledWith('guild-1', true);
    expect(plan.jeux).toHaveLength(1);
    expect(plan.activites).toHaveLength(1);
    expect(plan.periode).toBe('Cette semaine');
    expect(plan.date).toBeInstanceOf(Date);
  });
});
