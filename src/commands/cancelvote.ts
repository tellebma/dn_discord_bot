import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { GestionnaireVotes } from '../fonctions/voting/voteManager.js';

/**
 * Commande pour annuler un vote
 */
export const data = new SlashCommandBuilder()
  .setName('cancelvote')
  .setDescription('Annuler le vote en cours')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addBooleanOption(option =>
    option.setName('confirmer').setDescription("Confirmer l'annulation").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const confirmer = interaction.options.getBoolean('confirmer', true);

  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      content: '❌ Cette commande doit être utilisée dans un serveur.',
      flags: 64,
    });
    return;
  }

  if (!confirmer) {
    await interaction.reply({
      content: "❌ Annulation du vote annulée. Veuillez confirmer l'annulation.",
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

    const success = await gestionnaireVotes.supprimerVote(voteActif.id, guildId);

    if (success) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Vote annulé')
        .setDescription('Le vote en cours a été annulé avec succès.')
        .addFields(
          { name: '🆔 ID du vote', value: voteActif.id, inline: true },
          { name: '📅 Créé le', value: voteActif.creeLe.toLocaleString(), inline: true },
          { name: '👤 Créé par', value: `<@${voteActif.creePar}>`, inline: true }
        )
        .setColor('#ff0000')
        .setTimestamp()
        .setFooter({ text: `Annulé par ${interaction.user.tag}` });

      await interaction.reply({ embeds: [embed], flags: 64 });
    } else {
      await interaction.reply({
        content: "❌ Erreur lors de l'annulation du vote.",
        flags: 64,
      });
    }
  } catch (error) {
    console.error("Erreur lors de l'annulation du vote:", error);
    await interaction.reply({
      content: "❌ Une erreur est survenue lors de l'annulation du vote.",
      flags: 64,
    });
  }
}
