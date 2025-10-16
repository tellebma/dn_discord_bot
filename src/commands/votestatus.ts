import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { GestionnaireVotes } from '@/fonctions/voting/voteManager';

/**
 * Commande pour voir le statut du vote en cours
 */
export const data = new SlashCommandBuilder()
  .setName('votestatus')
  .setDescription('Afficher le statut du vote en cours');

export async function execute(interaction: ChatInputCommandInteraction) {
  const gestionnaireVotes = GestionnaireVotes.getInstance(interaction.client);
  const sessionActive = gestionnaireVotes.obtenirSessionActive();

  if (!sessionActive) {
    await interaction.reply({
      content:
        '📭 Aucune session de vote en cours.\n\n' +
        '💡 Les admins peuvent démarrer un vote avec `/startvote`',
      ephemeral: true,
    });
    return;
  }

  const totalVotes = Array.from(sessionActive.votes.values()).reduce(
    (sum, v) => sum + v.votesUtilisateurs.length,
    0
  );

  const tempsRestant = sessionActive.dateFin.getTime() - Date.now();
  const heuresRestantes = Math.max(0, Math.floor(tempsRestant / (1000 * 60 * 60)));
  const minutesRestantes = Math.max(0, Math.floor((tempsRestant % (1000 * 60 * 60)) / (1000 * 60)));

  const embed = new EmbedBuilder()
    .setTitle('🗳️ Statut du Vote en Cours')
    .setDescription(
      `**Semaine :** ${sessionActive.semaine}\n` +
        `**Démarré le :** <t:${Math.floor(sessionActive.dateDebut.getTime() / 1000)}:F>\n` +
        `**Fin :** <t:${Math.floor(sessionActive.dateFin.getTime() / 1000)}:F>\n` +
        `**Temps restant :** ${heuresRestantes}h ${minutesRestantes}min`
    )
    .setColor(0x9966ff)
    .addFields(
      {
        name: '🎮 Jeux Proposés',
        value: sessionActive.jeuxProposes.length.toString(),
        inline: true,
      },
      { name: '📊 Total Votes', value: totalVotes.toString(), inline: true },
      { name: '🔒 Anonymat', value: 'Garanti', inline: true }
    )
    .addFields({
      name: '💡 Comment voter ?',
      value:
        `Cliquez sur le bouton du jeu de votre choix dans le message de vote ci-dessus.\n\n` +
        `🔒 Votre vote est **100% anonyme** - personne ne peut voir qui vote pour quoi.\n` +
        `🔄 Vous pouvez changer votre vote à tout moment avant la fin.`,
      inline: false,
    })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

