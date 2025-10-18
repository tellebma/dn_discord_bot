import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { GestionnaireActivitesExtras } from '../fonctions/database/extraActivities.js';

/**
 * Commande pour gérer les activités extras
 */
export const data = new SlashCommandBuilder()
  .setName('activities')
  .setDescription('Gérer les activités extras')
  .addSubcommand(subcommand =>
    subcommand
      .setName('list')
      .setDescription('Lister toutes les activités')
      .addBooleanOption(option =>
        option
          .setName('actives')
          .setDescription('Afficher seulement les activités actives')
          .setRequired(false)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('add')
      .setDescription('Ajouter une nouvelle activité')
      .addStringOption(option =>
        option.setName('nom').setDescription("Nom de l'activité").setRequired(true)
      )
      .addStringOption(option =>
        option.setName('description').setDescription("Description de l'activité").setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('remove')
      .setDescription('Supprimer une activité')
      .addStringOption(option =>
        option.setName('id').setDescription("ID de l'activité à supprimer").setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const gestionnaire = GestionnaireActivitesExtras.getInstance();
  const subcommand = interaction.options.getSubcommand();

  try {
    switch (subcommand) {
      case 'list': {
        const activesUniquement = interaction.options.getBoolean('actives') ?? false;
        const activites = await gestionnaire.obtenirActivites(activesUniquement);

        const embed = new EmbedBuilder()
          .setTitle('📋 Liste des activités')
          .setColor('#0099ff')
          .setTimestamp();

        if (activites.length === 0) {
          embed.setDescription('Aucune activité trouvée.');
        } else {
          const liste = activites
            .map(
              (activite, index) =>
                `**${index + 1}.** ${activite.nom} - ${activite.description ?? 'Aucune description'}`
            )
            .join('\n');
          embed.setDescription(liste);
        }

        await interaction.reply({ embeds: [embed], flags: 64 });
        break;
      }

      case 'add': {
        const nom = interaction.options.getString('nom', true);
        const description = interaction.options.getString('description', true);

        const nouvelleActivite = {
          id: Date.now().toString(),
          nom,
          description,
          actif: true,
          creeeLe: new Date(),
        };

        await gestionnaire.ajouterActivite(nouvelleActivite);

        const embed = new EmbedBuilder()
          .setTitle('✅ Activité ajoutée')
          .setDescription(`**${nom}** a été ajoutée avec succès !`)
          .setColor('#00ff00')
          .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
        break;
      }

      case 'remove': {
        const id = interaction.options.getString('id', true);
        const supprimee = await gestionnaire.supprimerActivite(id);

        if (supprimee) {
          const embed = new EmbedBuilder()
            .setTitle('✅ Activité supprimée')
            .setDescription(`L'activité avec l'ID **${id}** a été supprimée.`)
            .setColor('#00ff00')
            .setTimestamp();

          await interaction.reply({ embeds: [embed], flags: 64 });
        } else {
          await interaction.reply({
            content: `❌ Aucune activité trouvée avec l'ID **${id}**.`,
            flags: 64,
          });
        }
        break;
      }

      default:
        await interaction.reply({
          content: '❌ Sous-commande inconnue.',
          flags: 64,
        });
    }
  } catch (error) {
    console.error('Erreur dans la commande activities:', error);
    await interaction.reply({
      content: "❌ Une erreur est survenue lors de l'exécution de la commande.",
      flags: 64,
    });
  }
}
