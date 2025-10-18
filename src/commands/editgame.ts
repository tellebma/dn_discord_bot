import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { GestionnairePoolJeux } from '../fonctions/database/gamePool.js';

/**
 * Commande pour modifier un jeu
 */
export const data = new SlashCommandBuilder()
  .setName('editgame')
  .setDescription('Modifier un jeu du pool')
  .addStringOption(option =>
    option
      .setName('id')
      .setDescription('ID du jeu à modifier')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('champ')
      .setDescription('Champ à modifier')
      .setRequired(true)
      .addChoices(
        { name: 'Nom', value: 'nom' },
        { name: 'Description', value: 'description' },
        { name: 'Plateforme', value: 'plateforme' },
        { name: 'Genre', value: 'genre' }
      )
  )
  .addStringOption(option =>
    option
      .setName('valeur')
      .setDescription('Nouvelle valeur')
      .setRequired(true)
      .setMaxLength(500)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const id = interaction.options.getString('id', true);
  const champ = interaction.options.getString('champ', true);
  const valeur = interaction.options.getString('valeur', true);

  try {
    const gestionnaire = GestionnairePoolJeux.getInstance();
    const jeux = await gestionnaire.obtenirJeux();
    const jeu = jeux.find(j => j.id === id);

    if (!jeu) {
      await interaction.reply({
        content: `❌ Aucun jeu trouvé avec l'ID **${id}**.`,
        flags: 64
      });
      return;
    }

    const ancienneValeur = jeu[champ];
    const modifications: any = {};
    modifications[champ] = valeur;

    const success = await gestionnaire.modifierJeu(id, modifications);

    if (success) {
      const embed = new EmbedBuilder()
        .setTitle('✅ Jeu modifié')
        .setDescription(`Le **${champ}** du jeu **${jeu.nom}** a été modifié.`)
        .addFields(
          { name: 'Ancienne valeur', value: ancienneValeur ?? 'Aucune', inline: true },
          { name: 'Nouvelle valeur', value: valeur, inline: true }
        )
        .setColor('#00ff00')
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });
    } else {
      await interaction.reply({
        content: '❌ Erreur lors de la modification du jeu.',
        flags: 64
      });
    }
  } catch (error) {
    console.error('Erreur lors de la modification de jeu:', error);
    await interaction.reply({
      content: '❌ Une erreur est survenue lors de la modification du jeu.',
      flags: 64
    });
  }
}