import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { GestionnaireStats } from '../fonctions/analytics/statsManager.js';
import { GestionnairePoolJeux } from '../fonctions/database/gamePool.js';
import { GestionnaireActivitesExtras } from '../fonctions/database/extraActivities.js';
import { GestionnaireVotes } from '../fonctions/voting/voteManager.js';

/**
 * Commande pour afficher les statistiques
 */
export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('Afficher les statistiques du bot')
  .addStringOption(option =>
    option
      .setName('type')
      .setDescription('Type de statistiques à afficher')
      .setRequired(false)
      .addChoices(
        { name: 'Générales', value: 'general' },
        { name: 'Jeux', value: 'games' },
        { name: 'Activités', value: 'activities' },
        { name: 'Votes', value: 'votes' }
      )
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const type = interaction.options.getString('type') ?? 'general';

  try {
    const gestionnaireStats = GestionnaireStats.getInstance();
    const gestionnaireJeux = GestionnairePoolJeux.getInstance();
    const gestionnaireActivites = GestionnaireActivitesExtras.getInstance();
    const gestionnaireVotes = GestionnaireVotes.getInstance();

    const embed = new EmbedBuilder()
      .setTitle('📊 Statistiques du bot')
      .setColor('#9b59b6')
      .setTimestamp()
      .setFooter({ text: `Demandé par ${interaction.user.tag}` });

    switch (type) {
      case 'general': {
        const stats = await gestionnaireStats.obtenirStats();
        const jeux = await gestionnaireJeux.obtenirJeux();
        const activites = await gestionnaireActivites.obtenirActivites();
        const votes = await gestionnaireVotes.obtenirVotesActifs();

        embed.setDescription('Statistiques générales du bot')
          .addFields(
            { name: '🎮 Jeux dans le pool', value: jeux.length.toString(), inline: true },
            { name: '🎯 Activités disponibles', value: activites.length.toString(), inline: true },
            { name: '🗳️ Votes actifs', value: votes.length.toString(), inline: true },
            { name: '📈 Jeux votés', value: stats.jeuxVotes.toString(), inline: true },
            { name: '📝 Activités créées', value: stats.activitesCreees.toString(), inline: true },
            { name: '👥 Utilisateurs actifs', value: stats.utilisateursActifs.toString(), inline: true }
          );
        break;
      }

      case 'games': {
        const jeux = await gestionnaireJeux.obtenirJeux();
        const jeuxActifs = jeux.filter(j => j.actif !== false);
        const jeuxPopulaires = jeux.sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 5);

        embed.setDescription('Statistiques des jeux')
          .addFields(
            { name: '📊 Total des jeux', value: jeux.length.toString(), inline: true },
            { name: '✅ Jeux actifs', value: jeuxActifs.length.toString(), inline: true },
            { name: '❌ Jeux inactifs', value: (jeux.length - jeuxActifs.length).toString(), inline: true }
          );

        if (jeuxPopulaires.length > 0) {
          const topJeux = jeuxPopulaires.map((jeu, index) => 
            `**${index + 1}.** ${jeu.nom} - ${jeu.votes || 0} vote(s)`
          ).join('\n');
          
          embed.addFields({
            name: '🏆 Top 5 des jeux populaires',
            value: topJeux,
            inline: false
          });
        }
        break;
      }

      case 'activities': {
        const activites = await gestionnaireActivites.obtenirActivites();
        const activitesActives = activites.filter(a => a.actif !== false);

        embed.setDescription('Statistiques des activités')
          .addFields(
            { name: '📊 Total des activités', value: activites.length.toString(), inline: true },
            { name: '✅ Activités actives', value: activitesActives.length.toString(), inline: true },
            { name: '❌ Activités inactives', value: (activites.length - activitesActives.length).toString(), inline: true }
          );

        if (activites.length > 0) {
          const categories = activites.reduce((acc: any, activite) => {
            const cat = activite.categorie || 'Non spécifié';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
          }, {});

          const categoriesListe = Object.entries(categories)
            .map(([cat, count]) => `**${cat}:** ${count}`)
            .join('\n');

          embed.addFields({
            name: '🏷️ Par catégorie',
            value: categoriesListe,
            inline: false
          });
        }
        break;
      }

      case 'votes': {
        const votes = await gestionnaireVotes.obtenirVotesActifs();
        const voteActif = await gestionnaireVotes.obtenirSessionActive();

        embed.setDescription('Statistiques des votes')
          .addFields(
            { name: '📊 Votes créés', value: votes.length.toString(), inline: true },
            { name: '✅ Vote actif', value: voteActif ? 'Oui' : 'Non', inline: true }
          );

        if (voteActif) {
          const totalVotes = Array.from(voteActif.votes.values()).reduce((acc: number, votes: any) => acc + (votes.size || 0), 0);
          embed.addFields({
            name: '🗳️ Vote en cours',
            value: `**ID:** ${voteActif.id}\n**Durée:** ${voteActif.duree}h\n**Total votes:** ${totalVotes}`,
            inline: false
          });
        }
        break;
      }

      default:
        await interaction.reply({
          content: '❌ Type de statistiques inconnu.',
          flags: 64
        });
        return;
    }

    await interaction.reply({ embeds: [embed], flags: 64 });
  } catch (error) {
    console.error('Erreur lors de l\'affichage des statistiques:', error);
    await interaction.reply({
      content: '❌ Une erreur est survenue lors de l\'affichage des statistiques.',
      flags: 64
    });
  }
}