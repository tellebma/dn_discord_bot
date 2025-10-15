import { config as dotenvConfig } from 'dotenv';
import type { TypeConfiguration } from '@/types/bot';

dotenvConfig();

/** Variables d'environnement requises pour le fonctionnement du bot */
const variablesEnvRequises = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID'] as const;

/**
 * Valide que toutes les variables d'environnement requises sont présentes
 * @throws {Error} Si des variables sont manquantes
 */
export function validerEnvironnement(): void {
  const manquantes = variablesEnvRequises.filter(nomVar => !process.env[nomVar]);

  if (manquantes.length > 0) {
    console.error('❌ Variables d\'environnement requises manquantes :');
    manquantes.forEach(nomVar => {
      console.error(`   - ${nomVar}`);
    });
    console.error('\nVeuillez vérifier votre fichier .env et assurez-vous que toutes les variables requises sont définies.');
    process.exit(1);
  }

  console.log('✅ Variables d\'environnement validées avec succès');
}

/**
 * Configuration globale de l'application
 */
export const config: TypeConfiguration = {
  discord: {
    token: process.env.DISCORD_TOKEN!,
    clientId: process.env.DISCORD_CLIENT_ID!,
  },
  bot: {
    estDeveloppement: process.env.NODE_ENV === 'development',
  },
};
