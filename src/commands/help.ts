import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';

/**
 * Commande d'aide qui explique le fonctionnement du bot
 */
export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription("Affiche l'aide et les commandes disponibles")
  .addStringOption(option =>
    option
      .setName('categorie')
      .setDescription('Catégorie spécifique à afficher')
      .setRequired(false)
      .addChoices(
        { name: '🎮 Gestion des Jeux', value: 'jeux' },
        { name: '📅 Gestion des Activités', value: 'activites' },
        { name: '🗓️ Planification', value: 'planification' },
        { name: '🛠️ Utilitaires', value: 'utilitaires' }
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const categorie = interaction.options.get('categorie')?.value as string;

  // Si une catégorie spécifique est demandée
  if (categorie) {
    await envoyerAideCategorie(interaction, categorie);
    return;
  }

  // Embed principal d'aide
  const embedPrincipal = new EmbedBuilder()
    .setTitle("🤖 Bot Discord Divnum - Guide d'Utilisation")
    .setDescription(
      '**Bienvenue !** Je suis un bot pour gérer vos jeux et activités hebdomadaires.\n\n' +
        '🎮 **Gérez votre pool de jeux**\n' +
        '📅 **Planifiez des activités extras**\n' +
        '🗓️ **Recevez des plans hebdomadaires automatiques**\n\n' +
        'Utilisez les commandes ci-dessous ou `/help categorie` pour plus de détails.'
    )
    .setColor(0x9966ff)
    .setTimestamp()
    .setFooter({ text: "Utilisez /help categorie:<nom> pour plus d'informations" });

  // Section Gestion des Jeux
  embedPrincipal.addFields({
    name: '🎮 Gestion des Jeux',
    value:
      '`/addgame` - Ajouter un jeu au pool\n' +
      '`/gamepool` - Afficher tous les jeux disponibles\n' +
      '\n*Pour plus de détails : `/help categorie:jeux`*',
    inline: false,
  });

  // Section Gestion des Activités
  embedPrincipal.addFields({
    name: '📅 Gestion des Activités',
    value:
      '`/addactivity` - Ajouter une activité hebdomadaire\n' +
      '`/activities` - Afficher toutes les activités\n' +
      '`/manageactivity` - Gérer les activités (Admin)\n' +
      '\n*Pour plus de détails : `/help categorie:activites`*',
    inline: false,
  });

  // Section Planification
  embedPrincipal.addFields({
    name: '🗓️ Planification Hebdomadaire',
    value:
      '`/weeklyplan` - Générer un plan manuel (Admin)\n' +
      '`/setchannel` - Configurer les plans automatiques (Admin)\n' +
      '\n*Plans automatiques : Chaque lundi à 10h*\n' +
      '*Pour plus de détails : `/help categorie:planification`*',
    inline: false,
  });

  // Section Utilitaires
  embedPrincipal.addFields({
    name: '🛠️ Utilitaires',
    value:
      '`/ping` - Vérifier la latence du bot\n' +
      '`/serverinfo` - Informations du serveur\n' +
      "`/userinfo` - Informations d'un utilisateur\n" +
      '`/echo` - Répéter un message\n' +
      '\n*Pour plus de détails : `/help categorie:utilitaires`*',
    inline: false,
  });

  // Section Permissions
  embedPrincipal.addFields({
    name: '🔐 Permissions',
    value:
      '**Tous les membres :** Ajouter des jeux/activités, voir les listes\n' +
      '**Administrateurs :** Gérer les activités, configurer les plans automatiques\n' +
      '\n*Les commandes Admin nécessitent la permission "Gérer les messages"*',
    inline: false,
  });

  // Section Liens Utiles
  embedPrincipal.addFields({
    name: '🔗 Liens Utiles',
    value:
      '📚 [Documentation Complète](https://github.com/votre-repo)\n' +
      '🐛 [Signaler un Bug](https://github.com/votre-repo/issues)\n' +
      '💡 [Suggérer une Fonctionnalité](https://github.com/votre-repo/issues)',
    inline: false,
  });

  await interaction.reply({ embeds: [embedPrincipal], flags: 64 });
}

/**
 * Envoie l'aide détaillée pour une catégorie spécifique
 */
async function envoyerAideCategorie(interaction: ChatInputCommandInteraction, categorie: string) {
  let embed: EmbedBuilder;

  switch (categorie) {
    case 'jeux':
      embed = creerAideJeux();
      break;
    case 'activites':
      embed = creerAideActivites();
      break;
    case 'planification':
      embed = creerAidePlanification();
      break;
    case 'utilitaires':
      embed = creerAideUtilitaires();
      break;
    default:
      await interaction.reply({
        content: '❌ Catégorie inconnue !',
        flags: 64,
      });
      return;
  }

  await interaction.reply({ embeds: [embed], flags: 64 });
}

/**
 * Crée l'embed d'aide pour la catégorie Jeux
 */
function creerAideJeux(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🎮 Gestion des Jeux')
    .setDescription('Gérez votre collection de jeux disponibles pour les sessions de jeu.')
    .setColor(0x00ff00)
    .addFields(
      {
        name: '📝 /addgame',
        value:
          '**Description :** Ajoute un nouveau jeu au pool\n\n' +
          '**Options :**\n' +
          '• `nom` (requis) - Nom du jeu\n' +
          '• `description` (optionnel) - Description du jeu\n' +
          '• `categorie` (optionnel) - Catégorie (ex: Stratégie, Action, Party)\n' +
          '• `joueursmin` (optionnel) - Nombre minimum de joueurs\n' +
          '• `joueursmax` (optionnel) - Nombre maximum de joueurs\n\n' +
          '**Exemple :**\n' +
          '```/addgame nom:"Among Us" description:"Jeu de déduction" categorie:"Party" joueursmin:4 joueursmax:10```',
        inline: false,
      },
      {
        name: '📋 /gamepool',
        value:
          '**Description :** Affiche la liste complète des jeux disponibles\n\n' +
          '**Informations affichées :**\n' +
          '• Nom et description du jeu\n' +
          '• Catégorie\n' +
          '• Nombre de joueurs (min-max)\n' +
          '• Qui a ajouté le jeu\n\n' +
          '**Exemple :**\n' +
          '```/gamepool```',
        inline: false,
      },
      {
        name: '💡 Conseils',
        value:
          '• Les noms de jeux doivent être uniques\n' +
          '• Le nombre minimum ne peut pas dépasser le maximum\n' +
          '• Les jeux sont sélectionnés aléatoirement pour les plans hebdomadaires\n' +
          "• Un plan hebdomadaire peut contenir jusqu'à 5 jeux",
        inline: false,
      }
    )
    .setTimestamp()
    .setFooter({ text: 'Retour : /help' });
}

/**
 * Crée l'embed d'aide pour la catégorie Activités
 */
function creerAideActivites(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('📅 Gestion des Activités')
    .setDescription('Planifiez des activités extras hebdomadaires (AfterWork, déjeuners, etc.).')
    .setColor(0xff9900)
    .addFields(
      {
        name: '➕ /addactivity',
        value:
          '**Description :** Ajoute une nouvelle activité récurrente\n\n' +
          '**Options :**\n' +
          "• `nom` (requis) - Nom de l'activité\n" +
          '• `jour` (requis) - Jour de la semaine (0=Dimanche, 1=Lundi...)\n' +
          "• `description` (optionnel) - Description de l'activité\n" +
          "• `lieu` (optionnel) - Lieu de l'activité\n" +
          '• `heure` (optionnel) - Heure (ex: "18:00" ou "18h")\n' +
          "• `actif` (optionnel) - Si l'activité est active (défaut: oui)\n\n" +
          '**Exemple :**\n' +
          '```/addactivity nom:"AfterWork" jour:1 description:"Apéro hebdo" lieu:"Le Pub" heure:"18:00"```',
        inline: false,
      },
      {
        name: '📋 /activities',
        value:
          '**Description :** Affiche toutes les activités planifiées\n\n' +
          '**Options :**\n' +
          '• `activeseulement` (optionnel) - Afficher uniquement les activités actives\n\n' +
          '**Affichage :**\n' +
          '• Organisé par jour de la semaine\n' +
          '• Indicateur 🟢 (actif) / 🔴 (inactif)\n' +
          '• Heure, lieu et description si disponibles\n\n' +
          '**Exemple :**\n' +
          '```/activities activeseulement:oui```',
        inline: false,
      },
      {
        name: '⚙️ /manageactivity (Admin)',
        value:
          '**Description :** Gère les activités existantes\n\n' +
          '**Sous-commandes :**\n' +
          '• `basculer` - Active/désactive une activité\n' +
          '• `supprimer` - Supprime définitivement une activité\n' +
          '• `modifier` - Modifie les détails (nom, lieu, heure, jour)\n\n' +
          '**Exemples :**\n' +
          '```/manageactivity basculer activite:"AfterWork"```\n' +
          '```/manageactivity modifier activite:"AfterWork" heure:"19:00"```\n' +
          '```/manageactivity supprimer activite:"AfterWork"```',
        inline: false,
      },
      {
        name: '💡 Conseils',
        value:
          "• Les activités inactives n'apparaissent pas dans les plans hebdomadaires\n" +
          "• Utilisez l'ID ou le nom pour gérer une activité\n" +
          '• Les jours : 0=Dimanche, 1=Lundi, 2=Mardi, 3=Mercredi, 4=Jeudi, 5=Vendredi, 6=Samedi',
        inline: false,
      }
    )
    .setTimestamp()
    .setFooter({ text: 'Retour : /help' });
}

/**
 * Crée l'embed d'aide pour la catégorie Planification
 */
function creerAidePlanification(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🗓️ Planification Hebdomadaire')
    .setDescription('Génération automatique et manuelle de plans de jeux hebdomadaires.')
    .setColor(0x9966ff)
    .addFields(
      {
        name: '📅 Plan Hebdomadaire Automatique',
        value:
          '**Fonctionnement :**\n' +
          '• Envoi automatique chaque **lundi à 10h00**\n' +
          "• Sélection aléatoire de **jusqu'à 5 jeux** du pool\n" +
          '• Inclut **toutes les activités actives** organisées par jour\n' +
          '• Format : Embed Discord riche et coloré\n\n' +
          '**Configuration requise :**\n' +
          'Utilisez `/setchannel` pour définir où envoyer les plans',
        inline: false,
      },
      {
        name: '🎲 /weeklyplan (Admin)',
        value:
          '**Description :** Génère et envoie un plan hebdomadaire immédiatement\n\n' +
          '**Utilisation :**\n' +
          '• Exécutez dans le canal où vous voulez le plan\n' +
          '• Génère un plan pour la semaine en cours\n' +
          '• Utile pour tester ou générer des plans manuellement\n\n' +
          '**Exemple :**\n' +
          '```/weeklyplan```\n\n' +
          '**Permissions :** Gérer les messages',
        inline: false,
      },
      {
        name: '⚙️ /setchannel (Admin)',
        value:
          '**Description :** Configure le canal pour les plans automatiques\n\n' +
          '**Options :**\n' +
          '• `canal` (requis) - Le canal textuel où envoyer les plans\n\n' +
          '**Effet :**\n' +
          '• Active la publication automatique chaque lundi à 10h\n' +
          '• Un seul canal peut être configuré à la fois\n\n' +
          '**Exemple :**\n' +
          '```/setchannel canal:#planning-hebdo```\n\n' +
          '**Permissions :** Gérer les canaux',
        inline: false,
      },
      {
        name: '📊 Contenu du Plan',
        value:
          '**Section Jeux :**\n' +
          '• 5 jeux maximum sélectionnés aléatoirement\n' +
          '• Nom, description, catégorie\n' +
          '• Nombre de joueurs (min-max)\n\n' +
          '**Section Activités :**\n' +
          '• Toutes les activités actives\n' +
          '• Organisées par jour de la semaine\n' +
          '• Heure, lieu, description\n\n' +
          '**Format :**\n' +
          '• Embed Discord avec code couleur\n' +
          '• Période : Lundi → Dimanche\n' +
          '• Émojis pour une meilleure lisibilité',
        inline: false,
      },
      {
        name: '💡 Conseils',
        value:
          '• Ajoutez au moins 5 jeux pour avoir de la variété\n' +
          '• Configurez vos activités avant le premier lundi\n' +
          "• Les plans sont sauvegardés dans l'historique\n" +
          '• Un backup des 10 derniers plans est conservé',
        inline: false,
      }
    )
    .setTimestamp()
    .setFooter({ text: 'Retour : /help' });
}

/**
 * Crée l'embed d'aide pour la catégorie Utilitaires
 */
function creerAideUtilitaires(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🛠️ Commandes Utilitaires')
    .setDescription('Commandes pratiques pour interagir avec le bot et obtenir des informations.')
    .setColor(0x0099ff)
    .addFields(
      {
        name: '🏓 /ping',
        value:
          '**Description :** Vérifie la latence du bot\n\n' +
          '**Affiche :**\n' +
          '• Latence de la réponse (temps de traitement)\n' +
          '• Latence API Discord (ping WebSocket)\n\n' +
          '**Exemple :**\n' +
          '```/ping```',
        inline: false,
      },
      {
        name: '📢 /echo',
        value:
          '**Description :** Fait répéter un message par le bot\n\n' +
          '**Options :**\n' +
          '• `message` (requis) - Le message à répéter (max 2000 caractères)\n' +
          '• `ephemere` (optionnel) - Si la réponse doit être privée\n\n' +
          '**Sécurité :**\n' +
          '• Les mentions @everyone et @here sont bloquées\n\n' +
          '**Exemple :**\n' +
          '```/echo message:"Bonjour tout le monde !" ephemere:non```',
        inline: false,
      },
      {
        name: '🏰 /serverinfo',
        value:
          '**Description :** Affiche les informations du serveur Discord\n\n' +
          '**Informations affichées :**\n' +
          '• Nom et icône du serveur\n' +
          '• Propriétaire du serveur\n' +
          '• Date de création\n' +
          '• Nombre de membres\n' +
          '• Nombre de canaux, rôles, émojis\n' +
          '• Niveau de vérification et de boost\n\n' +
          '**Exemple :**\n' +
          '```/serverinfo```',
        inline: false,
      },
      {
        name: '👤 /userinfo',
        value:
          "**Description :** Affiche les informations d'un utilisateur\n\n" +
          '**Options :**\n' +
          "• `cible` (optionnel) - L'utilisateur à afficher (défaut : vous-même)\n\n" +
          '**Informations affichées :**\n' +
          "• Nom d'utilisateur et avatar\n" +
          '• ID utilisateur\n' +
          '• Date de création du compte\n' +
          '• Date de rejoint du serveur (si applicable)\n' +
          '• Rôles sur le serveur (si applicable)\n\n' +
          '**Exemples :**\n' +
          '```/userinfo```\n' +
          '```/userinfo cible:@utilisateur```',
        inline: false,
      },
      {
        name: '❓ /help',
        value:
          '**Description :** Affiche cette aide (vous êtes ici !)\n\n' +
          '**Options :**\n' +
          '• `categorie` (optionnel) - Catégorie spécifique à afficher\n\n' +
          '**Catégories disponibles :**\n' +
          '• 🎮 Gestion des Jeux\n' +
          '• 📅 Gestion des Activités\n' +
          '• 🗓️ Planification\n' +
          '• 🛠️ Utilitaires\n\n' +
          '**Exemple :**\n' +
          '```/help categorie:jeux```',
        inline: false,
      }
    )
    .setTimestamp()
    .setFooter({ text: 'Retour : /help' });
}
