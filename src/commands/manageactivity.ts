import {
  SlashCommandBuilder,
  EmbedBuilder,
  CommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { GestionnaireActivitesExtras } from '@/fonctions/database/extraActivities';

/**
 * Commande pour gérer les activités extras (admin)
 */
export const data = new SlashCommandBuilder()
  .setName('manageactivity')
  .setDescription('Gérer les activités extras')
  .addSubcommand((subcommand: any) =>
    subcommand
      .setName('basculer')
      .setDescription('Basculer une activité entre active/inactive')
      .addStringOption((option: any) =>
        option.setName('activite').setDescription("Nom ou ID de l'activité").setRequired(true)
      )
  )
  .addSubcommand((subcommand: any) =>
    subcommand
      .setName('supprimer')
      .setDescription('Supprimer définitivement une activité')
      .addStringOption((option: any) =>
        option.setName('activite').setDescription("Nom ou ID de l'activité").setRequired(true)
      )
  )
  .addSubcommand((subcommand: any) =>
    subcommand
      .setName('modifier')
      .setDescription('Modifier une activité')
      .addStringOption((option: any) =>
        option.setName('activite').setDescription("Nom ou ID de l'activité").setRequired(true)
      )
      .addStringOption((option: any) =>
        option.setName('nom').setDescription("Nouveau nom pour l'activité").setRequired(false)
      )
      .addStringOption((option: any) =>
        option
          .setName('description')
          .setDescription("Nouvelle description pour l'activité")
          .setRequired(false)
      )
      .addStringOption((option: any) =>
        option.setName('lieu').setDescription("Nouveau lieu pour l'activité").setRequired(false)
      )
      .addStringOption((option: any) =>
        option.setName('heure').setDescription("Nouvelle heure pour l'activité").setRequired(false)
      )
      .addIntegerOption((option: any) =>
        option
          .setName('jour')
          .setDescription('Nouveau jour de la semaine')
          .setRequired(false)
          .addChoices(
            { name: 'Dimanche', value: 0 },
            { name: 'Lundi', value: 1 },
            { name: 'Mardi', value: 2 },
            { name: 'Mercredi', value: 3 },
            { name: 'Jeudi', value: 4 },
            { name: 'Vendredi', value: 5 },
            { name: 'Samedi', value: 6 }
          )
      )
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction: CommandInteraction) {
  const sousCommande = interaction.options.data[0].name;
  const entreeActivite = interaction.options.get('activite')?.value as string;

  const gestionnaireActivites = GestionnaireActivitesExtras.getInstance();
  const activite = gestionnaireActivites.trouverActivite(entreeActivite);

  if (!activite) {
    await interaction.reply({
      content: `❌ Activité "${entreeActivite}" introuvable !`,
      ephemeral: true,
    });
    return;
  }

  switch (sousCommande) {
    case 'basculer': {
      const activiteBasculee = gestionnaireActivites.basculerActivite(activite.id);
      if (activiteBasculee) {
        const statut = activiteBasculee.estActif ? '🟢 Active' : '🔴 Inactive';
        const embed = new EmbedBuilder()
          .setTitle("✅ Statut de l'Activité Mis à Jour")
          .setDescription(`**${activiteBasculee.nom}** est maintenant ${statut}`)
          .setColor(activiteBasculee.estActif ? 0x00ff00 : 0xff0000)
          .addFields(
            {
              name: 'Jour',
              value: gestionnaireActivites.obtenirNomJour(activiteBasculee.jourSemaine),
              inline: true,
            },
            { name: 'Statut', value: statut, inline: true }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
      break;
    }

    case 'supprimer': {
      const supprimee = gestionnaireActivites.supprimerActivite(activite.id);
      if (supprimee) {
        const embed = new EmbedBuilder()
          .setTitle('🗑️ Activité Supprimée')
          .setDescription(
            `**${activite.nom}** a été définitivement supprimée de l'emploi du temps.`
          )
          .setColor(0xff0000)
          .addFields(
            {
              name: 'Jour',
              value: gestionnaireActivites.obtenirNomJour(activite.jourSemaine),
              inline: true,
            },
            { name: 'ID', value: activite.id, inline: true }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
      break;
    }

    case 'modifier': {
      const nouveauNom = interaction.options.get('nom')?.value as string;
      const nouvelleDescription = interaction.options.get('description')?.value as string;
      const nouveauLieu = interaction.options.get('lieu')?.value as string;
      const nouvelleHeure = interaction.options.get('heure')?.value as string;
      const nouveauJour = interaction.options.get('jour')?.value as number;

      const miseAJour: any = {};
      if (nouveauNom) miseAJour.nom = nouveauNom;
      if (nouvelleDescription !== undefined) miseAJour.description = nouvelleDescription;
      if (nouveauLieu !== undefined) miseAJour.lieu = nouveauLieu;
      if (nouvelleHeure !== undefined) miseAJour.heure = nouvelleHeure;
      if (nouveauJour !== undefined) miseAJour.jourSemaine = nouveauJour;

      if (Object.keys(miseAJour).length === 0) {
        await interaction.reply({
          content:
            '❌ Aucune modification spécifiée ! Veuillez fournir au moins un champ à mettre à jour.',
          ephemeral: true,
        });
        return;
      }

      const activiteModifiee = gestionnaireActivites.mettreAJourActivite(activite.id, miseAJour);
      if (activiteModifiee) {
        const embed = new EmbedBuilder()
          .setTitle('✅ Activité Mise à Jour')
          .setDescription(`**${activiteModifiee.nom}** a été mise à jour avec succès.`)
          .setColor(0x00ff00)
          .addFields(
            {
              name: 'Jour',
              value: gestionnaireActivites.obtenirNomJour(activiteModifiee.jourSemaine),
              inline: true,
            },
            {
              name: 'Statut',
              value: activiteModifiee.estActif ? '🟢 Active' : '🔴 Inactive',
              inline: true,
            }
          )
          .setTimestamp();

        if (activiteModifiee.description) {
          embed.addFields({ name: 'Description', value: activiteModifiee.description });
        }

        if (activiteModifiee.lieu) {
          embed.addFields({ name: 'Lieu', value: activiteModifiee.lieu, inline: true });
        }

        if (activiteModifiee.heure) {
          embed.addFields({ name: 'Heure', value: activiteModifiee.heure, inline: true });
        }

        await interaction.reply({ embeds: [embed] });
      }
      break;
    }

    default:
      await interaction.reply({
        content: '❌ Sous-commande inconnue !',
        ephemeral: true,
      });
  }
}
