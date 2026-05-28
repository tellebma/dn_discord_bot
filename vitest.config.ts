import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/types/**', 'src/app.ts', 'src/deploy-commands.ts'],
      // Plancher de couverture. Ne JAMAIS descendre ces seuils : toute PR ajoutant
      // un module non testé doit compenser pour rester au-dessus.
      // Plan d'escalade : 15% (actuel, couche données+utils testée) → 30% → 50%
      // au fur et à mesure que les commandes Discord gagnent des tests.
      thresholds: {
        lines: 15,
        statements: 15,
        functions: 25,
        branches: 50,
      },
    },
  },
});
