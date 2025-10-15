import { SlashCommandBuilder, EmbedBuilder, CommandInteraction } from 'discord.js';
import { GestionnaireActivitesExtras } from '@/fonctions/database/extraActivities';

/**
 * Commande pour ajouter une activité extra à l'emploi du temps hebdomadaire
 */
export const data = new SlashCommandBuilder()
  .setName('addactivity')
  .setDescription("Ajouter une activité extra à l'emploi du temps hebdomadaire")
  .addStringOption((option: any) =>
    option.setName('nom').setDescription("Nom de l'activité").setRequired(true)
  )
  .addIntegerOption((option: any) =>
    option
      .setName('jour')
      .setDescription('Jour de la semaine pour cette activité')
      .setRequired(true)
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
  .addStringOption((option: any) =>
    option.setName('description').setDescription("Description de l'activité").setRequired(false)
  )
  .addStringOption((option: any) =>
    option.setName('lieu').setDescription("Lieu de l'activité").setRequired(false)
  )
  .addStringOption((option: any) =>
    option
      .setName('heure')
      .setDescription('Heure de l\'activité (ex: "18:00" ou "18h")')
      .setRequired(false)
  )
  .addBooleanOption((option: any) =>
    option
      .setName('actif')
      .setDescription("Si l'activité est active (par défaut : oui)")
      .setRequired(false)
  );

export async function execute(interaction: CommandInteraction) {
  const nom = interaction.options.get('nom')?.value as string;
  const jourSemaine = interaction.options.get('jour')?.value as number;
  const description = interaction.options.get('description')?.value as string;
  const lieu = interaction.options.get('lieu')?.value as string;
  const heure = interaction.options.get('heure')?.value as string;
  const estActif = (interaction.options.get('actif')?.value as boolean) ?? true;

  const gestionnaireActivites = GestionnaireActivitesExtras.getInstance();

  // Vérifie si l'activité existe déjà
  const activiteExistante = gestionnaireActivites.trouverActivite(nom);
  if (activiteExistante) {
    await interaction.reply({
      content: `❌ Une activité avec le nom "${nom}" existe déjà !`,
      ephemeral: true,
    });
    return;
  }

  // Ajoute la nouvelle activité
  const nouvelleActivite = gestionnaireActivites.ajouterActivite({
    nom,
    description,
    lieu,
    heure,
    jourSemaine,
    estActif,
    ajoutePar: interaction.user.id,
  });

  const nomJour = gestionnaireActivites.obtenirNomJour(jourSemaine);

  // Crée l'embed de confirmation
  const embed = new EmbedBuilder()
    .setTitle('✅ Activité Ajoutée avec Succès !')
    .setColor(estActif ? 0x00ff00 : 0xffaa00)
    .addFields(
      { name: 'Nom', value: nouvelleActivite.nom, inline: true },
      { name: 'Jour', value: nomJour, inline: true },
      { name: 'Statut', value: estActif ? '🟢 Active' : '🟡 Inactive', inline: true },
      { name: 'Ajoutée par', value: `<@${nouvelleActivite.ajoutePar}>`, inline: true },
      { name: "ID de l'Activité", value: nouvelleActivite.id, inline: true }
    )
    .setTimestamp();

  if (nouvelleActivite.description) {
    embed.addFields({ name: 'Description', value: nouvelleActivite.description });
  }

  if (nouvelleActivite.lieu) {
    embed.addFields({ name: 'Lieu', value: nouvelleActivite.lieu, inline: true });
  }

  if (nouvelleActivite.heure) {
    embed.addFields({ name: 'Heure', value: nouvelleActivite.heure, inline: true });
  }

  await interaction.reply({ embeds: [embed] });
}
