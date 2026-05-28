import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { GestionnaireVotes } from '../fonctions/voting/voteManager.js';

/**
 * Commande pour afficher le statut du vote
 */
export const data = new SlashCommandBuilder()
  .setName('votestatus')
  .setDescription('Afficher le statut du vote en cours');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      content: '❌ Cette commande doit être utilisée dans un serveur.',
      flags: 64,
    });
    return;
  }

  try {
    const gestionnaireVotes = GestionnaireVotes.getInstance();
    const voteActif = await gestionnaireVotes.obtenirSessionActive(guildId);

    if (!voteActif) {
      await interaction.reply({
        content: '❌ Aucun vote actif trouvé.',
        flags: 64,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🗳️ Statut du vote')
      .setColor('#0099ff')
      .setTimestamp();

    // Calculer le temps restant
    const maintenant = new Date();
    const dureeMs = voteActif.duree * 60 * 60 * 1000;
    const finVote = new Date(voteActif.creeLe.getTime() + dureeMs);
    const tempsRestant = finVote.getTime() - maintenant.getTime();

    if (tempsRestant <= 0) {
      embed.setDescription('⏰ Le vote est terminé.');
    } else {
      const heures = Math.floor(tempsRestant / (1000 * 60 * 60));
      const minutes = Math.floor((tempsRestant % (1000 * 60 * 60)) / (1000 * 60));
      embed.setDescription(`⏰ Temps restant : **${heures}h ${minutes}m**`);
    }

    // Afficher les jeux et leurs votes
    const jeuxAvecVotes = voteActif.jeux
      .map((jeu: any) => {
        const votes = voteActif.votes.get(jeu.id)?.size || 0;
        return {
          nom: jeu.nom,
          votes: votes,
        };
      })
      .sort((a: any, b: any) => b.votes - a.votes);

    embed.addFields(
      { name: '📅 Créé le', value: voteActif.creeLe.toLocaleString(), inline: true },
      { name: '⏱️ Durée', value: `${voteActif.duree} heures`, inline: true },
      { name: '👤 Créé par', value: `<@${voteActif.creePar}>`, inline: true }
    );

    // Afficher les résultats
    if (jeuxAvecVotes.length > 0) {
      const resultats = jeuxAvecVotes
        .map((jeu: any, index: number) => `**${index + 1}.** ${jeu.nom} - **${jeu.votes} vote(s)**`)
        .join('\n');

      embed.addFields({
        name: '📊 Résultats actuels',
        value: resultats,
        inline: false,
      });
    }

    await interaction.reply({ embeds: [embed], flags: 64 });
  } catch (error) {
    console.error("Erreur lors de l'affichage du statut du vote:", error);
    await interaction.reply({
      content: "❌ Une erreur est survenue lors de l'affichage du statut du vote.",
      flags: 64,
    });
  }
}
