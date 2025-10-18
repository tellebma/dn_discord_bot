import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { GestionnaireActivitesExtras } from '../fonctions/database/extraActivities.js';

/**
 * Commande pour gérer les activités
 */
export const data = new SlashCommandBuilder()
  .setName('manageactivity')
  .setDescription('Gérer une activité existante')
  .addStringOption(option =>
    option.setName('id').setDescription("ID de l'activité à modifier").setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('action')
      .setDescription('Action à effectuer')
      .setRequired(true)
      .addChoices(
        { name: 'Activer', value: 'activate' },
        { name: 'Désactiver', value: 'deactivate' },
        { name: 'Modifier le nom', value: 'rename' },
        { name: 'Modifier la description', value: 'redesc' }
      )
  )
  .addStringOption(option =>
    option
      .setName('valeur')
      .setDescription('Nouvelle valeur (pour rename et redesc)')
      .setRequired(false)
      .setMaxLength(500)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const id = interaction.options.getString('id', true);
  const action = interaction.options.getString('action', true);
  const valeur = interaction.options.getString('valeur');

  try {
    const gestionnaire = GestionnaireActivitesExtras.getInstance();
    const activites = await gestionnaire.obtenirActivites();
    const activite = activites.find(a => a.id === id);

    if (!activite) {
      await interaction.reply({
        content: `❌ Aucune activité trouvée avec l'ID **${id}**.`,
        flags: 64,
      });
      return;
    }

    const modifications: any = {};
    let message = '';

    switch (action) {
      case 'activate':
        modifications.actif = true;
        message = `✅ L'activité **${activite.nom}** a été activée.`;
        break;
      case 'deactivate':
        modifications.actif = false;
        message = `✅ L'activité **${activite.nom}** a été désactivée.`;
        break;
      case 'rename':
        if (!valeur) {
          await interaction.reply({
            content: '❌ Veuillez fournir une nouvelle valeur pour le nom.',
            flags: 64,
          });
          return;
        }
        modifications.nom = valeur;
        message = `✅ Le nom de l'activité a été changé de **${activite.nom}** vers **${valeur}**.`;
        break;
      case 'redesc':
        if (!valeur) {
          await interaction.reply({
            content: '❌ Veuillez fournir une nouvelle valeur pour la description.',
            flags: 64,
          });
          return;
        }
        modifications.description = valeur;
        message = `✅ La description de l'activité **${activite.nom}** a été mise à jour.`;
        break;
      default:
        await interaction.reply({
          content: '❌ Action inconnue.',
          flags: 64,
        });
        return;
    }

    const success = await gestionnaire.modifierActivite(id, modifications);

    if (success) {
      const embed = new EmbedBuilder()
        .setTitle('✅ Activité modifiée')
        .setDescription(message)
        .setColor('#00ff00')
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: 64 });
    } else {
      await interaction.reply({
        content: "❌ Erreur lors de la modification de l'activité.",
        flags: 64,
      });
    }
  } catch (error) {
    console.error("Erreur lors de la gestion d'activité:", error);
    await interaction.reply({
      content: "❌ Une erreur est survenue lors de la modification de l'activité.",
      flags: 64,
    });
  }
}
