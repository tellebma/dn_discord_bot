import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';
import type { CommandeBot, ClientEtendu } from './types/bot.js';
import { GestionnaireVotes } from './fonctions/voting/voteManager.js';
import { GestionnaireStats } from './fonctions/analytics/statsManager.js';
import { runMigrations } from './fonctions/database/migrations.js';
import { testConnection, closePool } from './fonctions/database/connection.js';
import { demarrerCronVotes } from './fonctions/scheduler/voteCron.js';
import { Logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenvConfig();

// Initialisation du client Discord avec les intentions nécessaires
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
}) as ClientEtendu;

client.commands = new Collection<string, CommandeBot>();

/**
 * Charge toutes les commandes depuis le répertoire commands
 */
async function chargerCommandes(): Promise<void> {
  const commandes: any[] = [];
  const cheminCommandes = join(__dirname, 'commands');

  try {
    const fichiersCommandes = readdirSync(cheminCommandes).filter(
      fichier => (fichier.endsWith('.ts') || fichier.endsWith('.js')) && !fichier.endsWith('.d.ts')
    );

    for (const fichier of fichiersCommandes) {
      const cheminFichier = join(cheminCommandes, fichier);

      try {
        // Import dynamique pour la compatibilité des modules ES
        const moduleCommande = await import(cheminFichier);
        const commande = moduleCommande.default ?? moduleCommande;

        if ('data' in commande && 'execute' in commande) {
          client.commands.set(commande.data.name, commande as CommandeBot);
          commandes.push(commande.data.toJSON());
          console.log(`✅ Commande chargée : ${commande.data.name}`);
        } else {
          console.log(
            `⚠️ La commande ${cheminFichier} n'a pas les propriétés requises "data" ou "execute".`
          );
        }
      } catch (erreur) {
        console.error(`❌ Erreur lors du chargement de la commande ${fichier} :`, erreur);
      }
    }
  } catch {
    console.log('Répertoire des commandes introuvable, création en cours...');
  }

  // Le déploiement des commandes (REST) est volontairement hors du runtime :
  // il est effectué une seule fois par `npm run deploy:commands` (dev) ou par
  // `node dist/deploy-commands.js` au démarrage du conteneur. Redéployer à
  // chaque boot consommerait le quota global Discord (~200 créations/jour).
  console.log(`📦 ${commandes.length} commande(s) chargée(s) en mémoire.`);
}

/**
 * Charge tous les événements depuis le répertoire events
 */
async function chargerEvenements(): Promise<void> {
  const cheminEvenements = join(__dirname, 'events');

  try {
    const fichiersEvenements = readdirSync(cheminEvenements).filter(
      fichier => (fichier.endsWith('.ts') || fichier.endsWith('.js')) && !fichier.endsWith('.d.ts')
    );

    for (const fichier of fichiersEvenements) {
      const cheminFichier = join(cheminEvenements, fichier);

      try {
        const moduleEvenement = await import(cheminFichier);
        const evenement = moduleEvenement.default ?? moduleEvenement;

        if (evenement.once) {
          client.once(evenement.name, (...args: any[]) => evenement.execute(...args));
        } else {
          client.on(evenement.name, (...args: any[]) => evenement.execute(...args));
        }

        console.log(`✅ Événement chargé : ${evenement.name}`);
      } catch (erreur) {
        console.error(`❌ Erreur lors du chargement de l'événement ${fichier} :`, erreur);
      }
    }
  } catch {
    console.log('Répertoire des événements introuvable, création en cours...');
  }
}

// Gestion des interactions (commandes, autocomplétion, boutons)
client.on('interactionCreate', async (interaction: any) => {
  // Gestion de l'autocomplétion
  if (interaction.isAutocomplete()) {
    const commande = client.commands.get(interaction.commandName);

    if (!commande) {
      console.error(`Aucune commande correspondant à ${interaction.commandName} n'a été trouvée.`);
      return;
    }

    try {
      // Si la commande a une fonction autocomplete, l'exécuter
      if ('autocomplete' in commande && typeof (commande as any).autocomplete === 'function') {
        await (commande as any).autocomplete(interaction);
      }
    } catch (erreur) {
      console.error(`Erreur lors de l'autocomplétion de ${interaction.commandName} :`, erreur);
    }
    return;
  }

  // Gestion des boutons (pour les votes)
  if (interaction.isButton()) {
    const customId = interaction.customId;

    if (customId.startsWith('vote_')) {
      const [, voteId, jeuId] = customId.split('_');

      try {
        const gestionnaireVotes = GestionnaireVotes.getInstance();
        const success = await gestionnaireVotes.gererVote(voteId, jeuId, interaction.user.id);

        if (success) {
          await GestionnaireStats.getInstance().enregistrerVote(jeuId, interaction.user.id);
          await interaction.reply({
            content: '✅ Votre vote a été enregistré !',
            flags: 64,
          });
        } else {
          await interaction.reply({
            content: "❌ Impossible d'enregistrer votre vote. Le vote n'est peut-être plus actif.",
            flags: 64,
          });
        }
      } catch (error) {
        console.error('Erreur lors du vote:', error);
        await interaction.reply({
          content: "❌ Une erreur est survenue lors de l'enregistrement de votre vote.",
          flags: 64,
        });
      }
    } else {
      await interaction.reply({
        content: '❌ Interaction de bouton non reconnue.',
        flags: 64,
      });
    }
    return;
  }

  // Gestion des commandes normales
  if (!interaction.isChatInputCommand()) return;

  const commande = client.commands.get(interaction.commandName);

  if (!commande) {
    console.error(`Aucune commande correspondant à ${interaction.commandName} n'a été trouvée.`);
    return;
  }

  try {
    await commande.execute(interaction);
  } catch (erreur) {
    console.error(`Erreur lors de l'exécution de ${interaction.commandName} :`, erreur);

    const messageErreur = {
      content: "Une erreur s'est produite lors de l'exécution de cette commande !",
      flags: 64,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(messageErreur);
    } else {
      await interaction.reply(messageErreur);
    }
  }
});

// Événement déclenché une fois que le bot est prêt
client.once('clientReady', () => {
  console.log(`🤖 Le bot est prêt ! Connecté en tant que ${client.user?.tag}`);
  demarrerCronVotes(client);
});

// Gestionnaires d'erreurs globaux
process.on('unhandledRejection', (erreur: Error) => {
  console.error('Erreur non gérée :', erreur);
});

process.on('uncaughtException', (erreur: Error) => {
  console.error('Exception non capturée :', erreur);
  process.exit(1);
});

/**
 * Arrêt propre : ferme le pool PostgreSQL et déconnecte le client Discord.
 */
async function arretPropre(signal: string): Promise<void> {
  Logger.info('Arrêt du bot en cours', { signal });
  try {
    await client.destroy();
    await closePool();
  } catch (erreur) {
    Logger.error("Erreur lors de l'arrêt", {
      error: erreur instanceof Error ? erreur.message : String(erreur),
    });
  } finally {
    process.exit(0);
  }
}

process.on('SIGINT', () => void arretPropre('SIGINT'));
process.on('SIGTERM', () => void arretPropre('SIGTERM'));

/**
 * Initialise et démarre le bot
 */
async function demarrer(): Promise<void> {
  try {
    if (!process.env.DISCORD_TOKEN) {
      throw new Error('DISCORD_TOKEN est requis');
    }

    // 1. Base de données : applique les migrations puis vérifie la connexion.
    await runMigrations();
    const dbOk = await testConnection();
    if (!dbOk) {
      throw new Error('Impossible de se connecter à la base de données PostgreSQL');
    }

    // 2. Chargement des événements et commandes en mémoire.
    await chargerEvenements();
    await chargerCommandes();

    // 3. Connexion à Discord.
    await client.login(process.env.DISCORD_TOKEN);
  } catch (erreur) {
    console.error('Échec du démarrage du bot :', erreur);
    await closePool().catch(() => undefined);
    process.exit(1);
  }
}

void demarrer();
