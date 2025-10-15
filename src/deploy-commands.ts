import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

/**
 * Déploie toutes les commandes du bot sur Discord
 * Ce script est exécuté séparément pour enregistrer les commandes slash
 */
async function deployerCommandes(): Promise<void> {
  const commandes: any[] = [];
  const cheminCommandes = join(__dirname, 'commands');

  try {
    const fichiersCommandes = readdirSync(cheminCommandes).filter(
      fichier => fichier.endsWith('.ts') || fichier.endsWith('.js')
    );

    console.log('🔍 Chargement des commandes pour le déploiement...');

    for (const fichier of fichiersCommandes) {
      const cheminFichier = join(cheminCommandes, fichier);

      try {
        const moduleCommande = await import(cheminFichier);
        const commande = moduleCommande.default || moduleCommande;

        if ('data' in commande && 'execute' in commande) {
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
  } catch (erreur) {
    console.error('❌ Erreur lors de la lecture du répertoire des commandes :', erreur);
    process.exit(1);
  }

  if (commandes.length === 0) {
    console.log('⚠️ Aucune commande trouvée à déployer.');
    return;
  }

  if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_CLIENT_ID) {
    console.error(
      "❌ Variables d'environnement requises manquantes : DISCORD_TOKEN ou DISCORD_CLIENT_ID"
    );
    process.exit(1);
  }

  const rest = new REST().setToken(process.env.DISCORD_TOKEN);

  try {
    console.log(
      `🔄 Début de l'actualisation de ${commandes.length} commande(s) (/) de l'application.`
    );

    const donnees = (await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), {
      body: commandes,
    })) as any[];

    console.log(`✅ ${donnees.length} commande(s) (/) de l'application rechargée(s) avec succès.`);
  } catch (erreur) {
    console.error('❌ Erreur lors du déploiement des commandes :', erreur);
    process.exit(1);
  }
}

// Exécution du déploiement
void deployerCommandes();
