import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { GestionnaireVotes } from '../fonctions/voting/voteManager.js';
import { GestionnairePoolJeux } from '../fonctions/database/gamePool.js';

/**
 * Commande pour démarrer un vote
 */
export const data = new SlashCommandBuilder()
  .setName('startvote')
  .setDescription('Démarrer un vote pour choisir les jeux')
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

  try {
    const gestionnaireVotes = GestionnaireVotes.getInstance();
    const gestionnaireJeux = GestionnairePoolJeux.getInstance();

    // Vérifier s'il y a déjà un vote actif
    const voteActif = await gestionnaireVotes.obtenirSessionActive();
    if (voteActif) {
      await interaction.reply({
        content: "❌ Un vote est déjà en cours. Veuillez d'abord l'annuler.",
        flags: 64,
      });
      return;
    }

    // Obtenir des jeux aléatoires
    const jeux = await gestionnaireJeux.obtenirJeuxAleatoires(nombre);

    if (jeux.length < 3) {
      await interaction.reply({
        content:
          '❌ Pas assez de jeux dans le pool. Ajoutez au moins 3 jeux avant de démarrer un vote.',
        flags: 64,
      });
      return;
    }

    // Créer le vote
    const vote = {
      id: Date.now().toString(),
      jeux: jeux.slice(0, nombre),
      duree: duree,
      actif: true,
      creeLe: new Date(),
      creePar: interaction.user.id,
      votes: new Map(),
    };

    await gestionnaireVotes.creerVote(vote);

    // Créer l'embed
    const embed = new EmbedBuilder()
      .setTitle('🗳️ Vote de jeux démarré !')
      .setDescription(`Votez pour vos jeux préférés ! Le vote durera **${duree} heures**.`)
      .setColor('#0099ff')
      .setTimestamp()
      .setFooter({ text: `Créé par ${interaction.user.tag}` });

    // Ajouter les jeux à l'embed
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
          .setCustomId(`vote_${vote.id}_${jeu.id}`)
          .setLabel(`${index + 1}. ${jeu.nom}`)
          .setStyle(ButtonStyle.Primary)
      );
    });

    await interaction.reply({ embeds: [embed], components: [row] });

    // Programmer la fin du vote
    setTimeout(
      async () => {
        const voteFinal = await gestionnaireVotes.obtenirVote(vote.id);
        if (voteFinal && voteFinal.actif) {
          // Terminer le vote
          voteFinal.actif = false;
          await gestionnaireVotes.creerVote(voteFinal);

          // Afficher les résultats
          const embedResultats = new EmbedBuilder()
            .setTitle('🏆 Résultats du vote')
            .setDescription('Le vote est terminé ! Voici les résultats :')
            .setColor('#ffd700')
            .setTimestamp();

          // Trier les jeux par nombre de votes
          const jeuxTries = jeux.sort((a, b) => {
            const votesA = voteFinal.votes.get(a.id)?.size ?? 0;
            const votesB = voteFinal.votes.get(b.id)?.size ?? 0;
            return votesB - votesA;
          });

          jeuxTries.forEach((jeu, index) => {
            const votes = voteFinal.votes.get(jeu.id)?.size ?? 0;
            embedResultats.addFields({
              name: `${index + 1}. ${jeu.nom}`,
              value: `**${votes} vote(s)**`,
              inline: true,
            });
          });

          await interaction.followUp({ embeds: [embedResultats] });
        }
      },
      duree * 60 * 60 * 1000
    ); // Convertir en millisecondes
  } catch (error) {
    console.error('Erreur lors du démarrage du vote:', error);
    await interaction.reply({
      content: '❌ Une erreur est survenue lors du démarrage du vote.',
      flags: 64,
    });
  }
}
