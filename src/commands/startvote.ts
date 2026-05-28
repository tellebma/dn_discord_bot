import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} from 'discord.js';
import { GestionnaireVotes } from '../fonctions/voting/voteManager.js';
import { GestionnairePoolJeux } from '../fonctions/database/gamePool.js';

/**
 * Commande pour démarrer un vote
 */
export const data = new SlashCommandBuilder()
  .setName('startvote')
  .setDescription('Démarrer un vote pour choisir les jeux')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addIntegerOption(option =>
    option
      .setName('nombre')
      .setDescription('Nombre de jeux à proposer')
      .setRequired(false)
      .setMinValue(3)
      .setMaxValue(10)
  )
  .addIntegerOption(option =>
    option
      .setName('duree')
      .setDescription('Durée du vote en heures')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(168)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const nombre = interaction.options.getInteger('nombre') ?? 5;
  const duree = interaction.options.getInteger('duree') ?? 24;

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
    const gestionnaireJeux = GestionnairePoolJeux.getInstance();

    // Vérifier s'il y a déjà un vote actif
    const voteActif = await gestionnaireVotes.obtenirSessionActive(guildId);
    if (voteActif) {
      await interaction.reply({
        content: "❌ Un vote est déjà en cours. Veuillez d'abord l'annuler.",
        flags: 64,
      });
      return;
    }

    // Obtenir des jeux aléatoires
    const jeux = await gestionnaireJeux.obtenirJeuxAleatoires(guildId, nombre);

    if (jeux.length < 3) {
      await interaction.reply({
        content:
          '❌ Pas assez de jeux dans le pool. Ajoutez au moins 3 jeux avant de démarrer un vote.',
        flags: 64,
      });
      return;
    }

    const voteId = Date.now().toString();

    // Créer l'embed
    const embed = new EmbedBuilder()
      .setTitle('🗳️ Vote de jeux démarré !')
      .setDescription(`Votez pour vos jeux préférés ! Le vote durera **${duree} heures**.`)
      .setColor('#0099ff')
      .setTimestamp()
      .setFooter({ text: `Créé par ${interaction.user.tag}` });

    jeux.forEach((jeu, index) => {
      embed.addFields({
        name: `${index + 1}. ${jeu.nom}`,
        value: `${jeu.description ?? 'Aucune description'}\n🖥️ ${jeu.plateforme ?? 'Non spécifié'} | 🎯 ${jeu.genre ?? 'Non spécifié'}`,
        inline: false,
      });
    });

    // Créer les boutons
    const row = new ActionRowBuilder<ButtonBuilder>();
    jeux.forEach((jeu, index) => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`vote_${voteId}_${jeu.id}`)
          .setLabel(`${index + 1}. ${jeu.nom}`)
          .setStyle(ButtonStyle.Primary)
      );
    });

    // Publier le message de vote, puis persister le vote avec l'id du message.
    // La clôture et l'annonce des résultats sont gérées par le cron de votes
    // (channel.send), pas par un setTimeout volatil + interaction.followUp.
    const message = await interaction.reply({
      embeds: [embed],
      components: [row],
      withResponse: true,
    });
    const messageId = message.resource?.message?.id ?? '';

    await gestionnaireVotes.creerVote({
      id: voteId,
      guildId,
      channelId: interaction.channelId,
      messageId,
      duree,
      actif: true,
      creePar: interaction.user.id,
      jeux: jeux.map(j => ({ id: j.id, nom: j.nom })),
    });
  } catch (error) {
    console.error('Erreur lors du démarrage du vote:', error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: '❌ Une erreur est survenue lors du démarrage du vote.',
        flags: 64,
      });
    } else {
      await interaction.reply({
        content: '❌ Une erreur est survenue lors du démarrage du vote.',
        flags: 64,
      });
    }
  }
}
