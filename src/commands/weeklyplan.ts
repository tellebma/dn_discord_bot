import { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits } from 'discord.js';
import { PlanificateurHebdomadaire } from '@/fonctions/scheduler/weeklyPlanner';

/**
 * Commande pour générer et envoyer manuellement un plan hebdomadaire
 */
export const data = new SlashCommandBuilder()
  .setName('weeklyplan')
  .setDescription('Générer et envoyer un plan de jeux hebdomadaire')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction: CommandInteraction) {
  if (!interaction.channelId) {
    await interaction.reply({
      content: '❌ Cette commande doit être utilisée dans un canal !',
      ephemeral: true
    });
    return;
  }

  await interaction.deferReply();

  try {
    const planificateur = PlanificateurHebdomadaire.getInstance(interaction.client);
    const plan = await planificateur.planHebdomadaireManuel(interaction.channelId);

    await interaction.editReply({
      content: `✅ Plan hebdomadaire généré pour la semaine : ${plan.semaine}\nSélectionné ${plan.jeux.length} jeu(x) et ${plan.activitesExtras.length} activité(s) extra(s).`
    });
  } catch (erreur) {
    console.error('Erreur lors de la génération du plan hebdomadaire :', erreur);
    await interaction.editReply({
      content: '❌ Une erreur s\'est produite lors de la génération du plan hebdomadaire.'
    });
  }
}
