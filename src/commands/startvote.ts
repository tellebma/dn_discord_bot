import { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits } from 'discord.js';
import { GestionnaireVotes } from '@/fonctions/voting/voteManager';

/**
 * Commande pour démarrer une session de vote
 */
export const data = new SlashCommandBuilder()
  .setName('startvote')
  .setDescription('Démarrer une session de vote pour choisir les jeux de la semaine')
  .addIntegerOption((option: any) =>
    option.setName('nombre_jeux')
      .setDescription('Nombre de jeux à proposer (défaut: 10)')
      .setMinValue(3)
      .setMaxValue(20)
      .setRequired(false))
  .addIntegerOption((option: any) =>
    option.setName('duree')
      .setDescription('Durée du vote en heures (défaut: 24h)')
      .setMinValue(1)
      .setMaxValue(168)
      .setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction: CommandInteraction) {
  const nombreJeux = (interaction.options.get('nombre_jeux')?.value as number) || 
                     parseInt(process.env.DEFAULT_VOTE_GAMES_COUNT || '10');
  const duree = (interaction.options.get('duree')?.value as number) || 
                parseInt(process.env.DEFAULT_VOTE_DURATION || '24');

  if (!interaction.channelId) {
    await interaction.reply({
      content: '❌ Cette commande doit être utilisée dans un canal !',
      ephemeral: true
    });
    return;
  }

  // Vérifier s'il n'y a pas déjà un vote en cours
  const gestionnaireVotes = GestionnaireVotes.getInstance(interaction.client);
  const sessionActive = gestionnaireVotes.obtenirSessionActive();

  if (sessionActive) {
    await interaction.reply({
      content: 
        `⚠️ Une session de vote est déjà en cours !\n\n` +
        `**Semaine :** ${sessionActive.semaine}\n` +
        `**Fin :** <t:${Math.floor(sessionActive.dateFin.getTime() / 1000)}:R>\n\n` +
        `Attendez la fin de celle-ci ou utilisez \`/cancelvote\` pour l'annuler.`,
      ephemeral: true
    });
    return;
  }

  await interaction.deferReply();

  try {
    const session = await gestionnaireVotes.demarrerSessionVote(
      interaction.channelId,
      nombreJeux,
      duree,
      interaction.user.id
    });

    await interaction.editReply({
      content:
        `✅ **Session de vote démarrée !**\n\n` +
        `🗳️ **${nombreJeux} jeux** proposés pour le vote\n` +
        `⏰ Vote ouvert pendant **${duree}h**\n` +
        `🏁 Fin du vote : <t:${Math.floor(session.dateFin.getTime() / 1000)}:F>\n\n` +
        `🔒 **Les votes sont anonymes** - personne ne voit qui vote pour quoi.\n` +
        `📊 Les **5 jeux les plus votés** seront dans le plan de la semaine.\n` +
        `🔔 Un rappel sera envoyé **6h avant la fin** du vote.\n\n` +
        `👉 Votez en cliquant sur les boutons ci-dessous !`
    });
  } catch (erreur) {
    console.error('Erreur lors du démarrage du vote :', erreur);
    await interaction.editReply({
      content: '❌ Erreur lors du démarrage du vote. Vérifiez qu\'il y a des jeux dans le pool.'
    });
  }
}



