import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { GestionnairePoolJeux } from '../fonctions/database/gamePool.js';

/**
 * Commande pour supprimer un jeu
 */
export const data = new SlashCommandBuilder()
  .setName('removegame')
  .setDescription('Supprimer un jeu du pool')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addStringOption(option =>
    option.setName('id').setDescription('ID du jeu à supprimer').setRequired(true)
  )
  .addBooleanOption(option =>
    option.setName('confirmer').setDescription('Confirmer la suppression').setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const id = interaction.options.getString('id', true);
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
      content: '❌ Suppression annulée. Veuillez confirmer la suppression.',
      flags: 64,
    });
    return;
  }

  try {
    const gestionnaire = GestionnairePoolJeux.getInstance();
    const jeux = await gestionnaire.obtenirJeux(guildId);
    const jeu = jeux.find(j => j.id === id);

    if (!jeu) {
      await interaction.reply({
        content: `❌ Aucun jeu trouvé avec l'ID **${id}**.`,
        flags: 64,
      });
      return;
    }

    const success = await gestionnaire.supprimerJeu(id, guildId);

    if (success) {
      const embed = new EmbedBuilder()
        .setTitle('✅ Jeu supprimé')
        .setDescription(`Le jeu **${jeu.nom}** a été supprimé du pool.`)
        .addFields(
          { name: '🆔 ID', value: id, inline: true },
          { name: '📝 Description', value: jeu.description ?? 'Aucune description', inline: false }
        )
        .setColor('#ff0000')
        .setTimestamp()
        .setFooter({ text: `Supprimé par ${interaction.user.tag}` });

      await interaction.reply({ embeds: [embed], flags: 64 });
    } else {
      await interaction.reply({
        content: '❌ Erreur lors de la suppression du jeu.',
        flags: 64,
      });
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de jeu:', error);
    await interaction.reply({
      content: '❌ Une erreur est survenue lors de la suppression du jeu.',
      flags: 64,
    });
  }
}
