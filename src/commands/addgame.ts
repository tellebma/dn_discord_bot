import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { GestionnairePoolJeux } from '../fonctions/database/gamePool.js';

/**
 * Commande pour ajouter un jeu au pool
 */
export const data = new SlashCommandBuilder()
  .setName('addgame')
  .setDescription('Ajouter un jeu au pool de jeux')
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
  const description = interaction.options.getString('description') ?? 'Aucune description';
  const plateforme = interaction.options.getString('plateforme') ?? 'Multi-plateforme';
  const genre = interaction.options.getString('genre') ?? 'Non spécifié';
  const joueursMin = interaction.options.getInteger('joueursmin') ?? 1;
  const joueursMax = interaction.options.getInteger('joueursmax') ?? joueursMin;

  try {
    const gestionnaire = GestionnairePoolJeux.getInstance();

    const nouveauJeu = {
      id: Date.now().toString(),
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
      .setFooter({ text: `Ajouté par ${interaction.user.tag}` });

    await interaction.reply({ embeds: [embed], flags: 64 });
  } catch (error) {
    console.error("Erreur lors de l'ajout de jeu:", error);
    await interaction.reply({
      content: "❌ Une erreur est survenue lors de l'ajout du jeu.",
      flags: 64,
    });
  }
}
