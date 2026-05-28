import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { GestionnaireActivitesExtras } from '../fonctions/database/extraActivities.js';

/**
 * Commande pour ajouter une activité
 */
export const data = new SlashCommandBuilder()
  .setName('addactivity')
  .setDescription('Ajouter une nouvelle activité extra')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addStringOption(option =>
    option.setName('nom').setDescription("Nom de l'activité").setRequired(true).setMaxLength(100)
  )
  .addStringOption(option =>
    option
      .setName('description')
      .setDescription("Description de l'activité")
      .setRequired(true)
      .setMaxLength(500)
  )
  .addStringOption(option =>
    option
      .setName('categorie')
      .setDescription("Catégorie de l'activité")
      .setRequired(false)
      .setMaxLength(50)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const nom = interaction.options.getString('nom', true);
  const description = interaction.options.getString('description', true);
  const categorie = interaction.options.getString('categorie') ?? 'Général';

  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      content: '❌ Cette commande doit être utilisée dans un serveur.',
      flags: 64,
    });
    return;
  }

  try {
    const gestionnaire = GestionnaireActivitesExtras.getInstance();

    const nouvelleActivite = {
      id: Date.now().toString(),
      guildId,
      nom,
      description,
      categorie,
      actif: true,
      creeeLe: new Date(),
      creeePar: interaction.user.id,
    };

    await gestionnaire.ajouterActivite(nouvelleActivite);

    const embed = new EmbedBuilder()
      .setTitle('✅ Activité ajoutée avec succès !')
      .setDescription(`**${nom}** a été ajoutée à la liste des activités.`)
      .addFields(
        { name: '📝 Description', value: description, inline: false },
        { name: '🏷️ Catégorie', value: categorie, inline: true },
        { name: '🆔 ID', value: nouvelleActivite.id, inline: true }
      )
      .setColor('#00ff00')
      .setTimestamp()
      .setFooter({ text: `Ajoutée par ${interaction.user.tag}` });

    await interaction.reply({ embeds: [embed], flags: 64 });
  } catch (error) {
    console.error("Erreur lors de l'ajout d'activité:", error);
    await interaction.reply({
      content: "❌ Une erreur est survenue lors de l'ajout de l'activité.",
      flags: 64,
    });
  }
}
