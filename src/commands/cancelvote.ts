import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { GestionnaireVotes } from '@/fonctions/voting/voteManager';

/**
 * Commande pour annuler une session de vote en cours
 */
export const data = new SlashCommandBuilder()
  .setName('cancelvote')
  .setDescription('Annuler la session de vote en cours')
  .addStringOption((option: any) =>
    option.setName('raison').setDescription("Raison de l'annulation (optionnel)").setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction: ChatInputCommandInteraction) {
  const raison = interaction.options.get('raison')?.value as string;

  const gestionnaireVotes = GestionnaireVotes.getInstance(interaction.client);
  const sessionActive = gestionnaireVotes.obtenirSessionActive();

  if (!sessionActive) {
    await interaction.reply({
      content: '❌ Aucune session de vote en cours à annuler.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const annulee = await gestionnaireVotes.annulerSessionVote(sessionActive.id, raison);

    if (annulee) {
      await interaction.editReply({
        content:
          `✅ Session de vote annulée avec succès.\n\n` +
          `**Semaine :** ${sessionActive.semaine}\n` +
          (raison ? `**Raison :** ${raison}` : ''),
      });
    } else {
      await interaction.editReply({
        content: "❌ Impossible d'annuler la session de vote.",
      });
    }
  } catch (erreur) {
    console.error('Erreur annulation vote :', erreur);
    await interaction.editReply({
      content: "❌ Erreur lors de l'annulation du vote.",
    });
  }
}
