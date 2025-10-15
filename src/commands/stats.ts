import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { GestionnaireStatistiques } from '@/fonctions/analytics/statsManager';

/**
 * Commande pour afficher les statistiques et tendances
 */
export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('Afficher les statistiques du bot et les tendances du moment')
  .addStringOption((option: any) =>
    option
      .setName('type')
      .setDescription('Type de statistiques à afficher')
      .setRequired(false)
      .addChoices(
        { name: "📊 Vue d'ensemble", value: 'overview' },
        { name: '🎮 Jeux du Pool', value: 'games' },
        { name: '🔥 Tendances du Moment', value: 'trending' },
        { name: '👥 Utilisateurs', value: 'users' }
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const type = (interaction.options.get('type')?.value as string) || 'overview';

  await interaction.deferReply();

  const gestionnaireStats = GestionnaireStatistiques.getInstance();

  try {
    let embeds: EmbedBuilder[] = [];

    switch (type) {
      case 'overview':
        embeds = [await creerStatsGenerales(gestionnaireStats)];
        break;
      case 'games':
        embeds = [await creerStatsJeux(gestionnaireStats)];
        break;
      case 'trending':
        embeds = await creerStatsTendances(gestionnaireStats);
        break;
      case 'users':
        embeds = [await creerStatsUtilisateurs(gestionnaireStats)];
        break;
      default:
        embeds = [await creerStatsGenerales(gestionnaireStats)];
    }

    if (embeds.length === 0) {
      await interaction.editReply({
        content: '❌ Aucune statistique disponible pour le moment.',
      });
      return;
    }

    await interaction.editReply({ embeds });
  } catch (erreur) {
    console.error('Erreur lors de la génération des stats :', erreur);
    await interaction.editReply({
      content: '❌ Erreur lors de la génération des statistiques.',
    });
  }
}

/**
 * Crée l'embed des statistiques générales
 */
async function creerStatsGenerales(gestionnaire: GestionnaireStatistiques): Promise<EmbedBuilder> {
  const stats = gestionnaire.obtenirStatsGenerales();

  const embed = new EmbedBuilder()
    .setTitle('📊 Statistiques Générales')
    .setDescription("Vue d'ensemble de l'activité du bot")
    .setColor(0x0099ff)
    .addFields(
      { name: '🎮 Total Jeux', value: stats.totalJeux.toString(), inline: true },
      { name: '📅 Total Activités', value: stats.totalActivites.toString(), inline: true },
      { name: '📋 Plans Générés', value: stats.plansGeneres.toString(), inline: true },
      { name: '👥 Contributeurs', value: stats.contributeurs.toString(), inline: true },
      { name: '📂 Catégories', value: stats.categories.toString(), inline: true },
      { name: '🔥 Popularité Moy.', value: stats.populariteMoyenne.toFixed(1), inline: true }
    )
    .setTimestamp()
    .setFooter({ text: 'Statistiques mises à jour en temps réel' });

  if (stats.topJeux.length > 0) {
    const topJeux = stats.topJeux
      .map(
        (j, i) =>
          `${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} **${j.nom}** - ${j.selections} sélection(s)`
      )
      .join('\n');

    embed.addFields({
      name: '🏆 Top 5 Jeux les Plus Sélectionnés',
      value: topJeux,
      inline: false,
    });
  }

  return embed;
}

/**
 * Crée l'embed des statistiques des jeux
 */
async function creerStatsJeux(gestionnaire: GestionnaireStatistiques): Promise<EmbedBuilder> {
  const stats = gestionnaire.obtenirStatsJeux();

  const embed = new EmbedBuilder()
    .setTitle('🎮 Statistiques des Jeux')
    .setDescription(`Analyse détaillée de votre pool de ${stats.total} jeu(x)`)
    .setColor(0x00ff00)
    .addFields(
      { name: 'Total Jeux', value: stats.total.toString(), inline: true },
      { name: 'Jeux Actifs', value: stats.actifs.toString(), inline: true },
      { name: 'Catégories', value: stats.categories.toString(), inline: true }
    );

  if (stats.parCategorie.length > 0) {
    const categoriesText = stats.parCategorie
      .sort((a, b) => b.nombre - a.nombre)
      .map(c => `• **${c.categorie}** : ${c.nombre} (${c.pourcentage}%)`)
      .join('\n');

    embed.addFields({
      name: '📊 Répartition par Catégorie',
      value: categoriesText,
      inline: false,
    });
  }

  const repartition =
    `• 👥 2 joueurs : ${stats.deuxJoueurs}\n` +
    `• 👨‍👨‍👦 2-4 joueurs : ${stats.petitGroupe}\n` +
    `• 👨‍👨‍👧‍👦 5-8 joueurs : ${stats.moyenGroupe}\n` +
    `• 👨‍👩‍👧‍👦 8+ joueurs : ${stats.grandGroupe}`;

  embed.addFields({
    name: '👥 Répartition par Nombre de Joueurs',
    value: repartition,
    inline: false,
  });

  embed.setTimestamp();
  return embed;
}

/**
 * Crée les embeds des tendances externes
 */
async function creerStatsTendances(
  gestionnaire: GestionnaireStatistiques
): Promise<EmbedBuilder[]> {
  const tendances = await gestionnaire.obtenirTendancesExternes();

  if (tendances.length === 0) {
    const embedVide = new EmbedBuilder()
      .setTitle('🔥 Tendances du Moment')
      .setDescription(
        '⚠️ Aucune source de tendances configurée.\n\n' +
          '**Pour activer les tendances, configurez les APIs suivantes :**\n' +
          '• Steam API - Jeux PC les plus joués\n' +
          '• Twitch API - Jeux les plus streamés\n' +
          '• RAWG API - Jeux tendance multi-plateformes\n\n' +
          '📄 Voir `API_KEYS_REQUIRED.md` pour les instructions.'
      )
      .setColor(0xffaa00);

    return [embedVide];
  }

  const embeds: EmbedBuilder[] = [];

  for (const tendance of tendances) {
    const emoji: any = {
      steam: '🎮',
      twitch: '📺',
      rawg: '🌐',
      igdb: '📊',
    };

    const titre: any = {
      steam: 'Steam - Jeux PC les Plus Joués',
      twitch: 'Twitch - Jeux les Plus Streamés',
      rawg: 'RAWG - Nouveautés Populaires',
      igdb: 'IGDB - Jeux Tendance',
    };

    const couleur: any = {
      steam: 0x1b2838,
      twitch: 0x9146ff,
      rawg: 0x0f1419,
      igdb: 0xff5722,
    };

    const embed = new EmbedBuilder()
      .setTitle(`${emoji[tendance.source]} ${titre[tendance.source]}`)
      .setColor(couleur[tendance.source])
      .setTimestamp(tendance.derniereMAJ);

    const jeuxText = tendance.jeux
      .slice(0, 10)
      .map((jeu, i) => {
        let text = `${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} **${jeu.nom}**`;

        if (tendance.source === 'steam' && jeu.joueursActuels) {
          text += `\n   👥 ${jeu.joueursActuels.toLocaleString('fr-FR')} joueurs actuels`;
        }

        if (tendance.source === 'twitch' && jeu.spectateurs) {
          text += `\n   👀 ${jeu.spectateurs.toLocaleString('fr-FR')} spectateurs`;
        }

        if (jeu.note) {
          text += `\n   ⭐ Note: ${jeu.note.toFixed(1)}/5`;
        }

        if (jeu.plateforme) {
          text += `\n   🎯 ${jeu.plateforme}`;
        }

        return text;
      })
      .join('\n\n');

    embed.setDescription(jeuxText || 'Aucune donnée disponible');

    embed.setFooter({
      text: `Mis à jour toutes les heures • Source: ${tendance.source.toUpperCase()}`,
    });

    embeds.push(embed);
  }

  // Ajouter un embed récapitulatif
  const recapEmbed = new EmbedBuilder()
    .setTitle('🔥 Tendances du Moment - Résumé')
    .setDescription(
      `**${tendances.length} source(s) de données active(s)**\n\n` +
        'Ces tendances sont mises à jour automatiquement et peuvent vous aider à découvrir de nouveaux jeux populaires !\n\n' +
        '💡 **Astuce :** Utilisez `/addgame` pour ajouter ces jeux tendance à votre pool.'
    )
    .setColor(0xff6600);

  embeds.unshift(recapEmbed);

  return embeds;
}

/**
 * Crée l'embed des statistiques utilisateurs
 */
async function creerStatsUtilisateurs(
  gestionnaire: GestionnaireStatistiques
): Promise<EmbedBuilder> {
  const stats = gestionnaire.obtenirStatsGenerales();

  const embed = new EmbedBuilder()
    .setTitle('👥 Statistiques des Utilisateurs')
    .setDescription('Activité et engagement de la communauté')
    .setColor(0x9966ff)
    .addFields(
      { name: 'Contributeurs Actifs', value: stats.contributeurs.toString(), inline: true },
      { name: 'Plans Générés', value: stats.plansGeneres.toString(), inline: true }
    )
    .setTimestamp();

  // À enrichir avec plus de stats utilisateurs quand profils implémentés

  return embed;
}
