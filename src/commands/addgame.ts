import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';
import { GestionnairePoolJeux } from '../fonctions/database/gamePool.js';
import { RawgAPI } from '../fonctions/external/rawgAPI.js';

/**
 * Commande pour ajouter un jeu au pool
 */
export const data = new SlashCommandBuilder()
  .setName('addgame')
  .setDescription('Ajouter un jeu au pool de jeux')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addStringOption(option =>
    option.setName('nom').setDescription('Nom du jeu').setRequired(true).setMaxLength(100)
  )
  .addStringOption(option =>
    option
      .setName('description')
      .setDescription('Description du jeu')
      .setRequired(false)
      .setMaxLength(500)
  )
  .addStringOption(option =>
    option
      .setName('plateforme')
      .setDescription('Plateforme du jeu')
      .setRequired(false)
      .setMaxLength(50)
  )
  .addStringOption(option =>
    option.setName('genre').setDescription('Genre du jeu').setRequired(false).setMaxLength(50)
  )
  .addIntegerOption(option =>
    option
      .setName('joueursmin')
      .setDescription('Nombre minimum de joueurs')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(100)
  )
  .addIntegerOption(option =>
    option
      .setName('joueursmax')
      .setDescription('Nombre maximum de joueurs')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(100)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const nom = interaction.options.getString('nom', true);
  const descriptionInput = interaction.options.getString('description');
  const plateformeInput = interaction.options.getString('plateforme');
  const genreInput = interaction.options.getString('genre');
  const joueursMin = interaction.options.getInteger('joueursmin') ?? 1;
  const joueursMax = interaction.options.getInteger('joueursmax') ?? joueursMin;

  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      content: '❌ Cette commande doit être utilisée dans un serveur.',
      flags: 64,
    });
    return;
  }

  // L'enrichissement RAWG fait un appel réseau (jusqu'à 8s) : on défère pour ne
  // pas dépasser la fenêtre de réponse de 3s de Discord.
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const description = descriptionInput ?? 'Aucune description';
    let plateforme = plateformeInput ?? 'Multi-plateforme';
    let genre = genreInput ?? 'Non spécifié';
    let enrichi = false;

    // Si l'utilisateur n'a pas renseigné genre/plateforme, on tente RAWG.
    const rawg = RawgAPI.getInstance();
    if (rawg.estConfigure() && (genreInput === null || plateformeInput === null)) {
      const [premier] = await rawg.rechercherJeu(nom, 1);
      if (premier) {
        if (genreInput === null && premier.genres.length > 0) {
          genre = premier.genres.slice(0, 3).join(', ');
          enrichi = true;
        }
        if (plateformeInput === null && premier.plateformes.length > 0) {
          plateforme = premier.plateformes.slice(0, 3).join(', ');
          enrichi = true;
        }
      }
    }

    const gestionnaire = GestionnairePoolJeux.getInstance();

    const nouveauJeu = {
      id: Date.now().toString(),
      guildId,
      nom,
      description,
      plateforme,
      genre,
      joueursMin,
      joueursMax,
      actif: true,
      ajouteLe: new Date(),
      ajoutePar: interaction.user.id,
      votes: 0,
    };

    await gestionnaire.ajouterJeu(nouveauJeu);

    const embed = new EmbedBuilder()
      .setTitle('🎮 Jeu ajouté avec succès !')
      .setDescription(`**${nom}** a été ajouté au pool de jeux.`)
      .addFields(
        { name: '📝 Description', value: description, inline: false },
        { name: '🖥️ Plateforme', value: plateforme, inline: true },
        { name: '🎯 Genre', value: genre, inline: true },
        { name: '👥 Joueurs', value: `${joueursMin}-${joueursMax}`, inline: true },
        { name: '🆔 ID', value: nouveauJeu.id, inline: true }
      )
      .setColor('#00ff00')
      .setTimestamp()
      .setFooter({
        text: enrichi
          ? `Ajouté par ${interaction.user.tag} • enrichi via RAWG`
          : `Ajouté par ${interaction.user.tag}`,
      });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Erreur lors de l'ajout de jeu:", error);
    await interaction.editReply({
      content: "❌ Une erreur est survenue lors de l'ajout du jeu.",
    });
  }
}
