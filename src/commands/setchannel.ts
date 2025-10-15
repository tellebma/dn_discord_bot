import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';
import { PlanificateurHebdomadaire } from '@/fonctions/scheduler/weeklyPlanner';

/**
 * Commande pour définir le canal des plans hebdomadaires automatiques
 */
export const data = new SlashCommandBuilder()
  .setName('setchannel')
  .setDescription('Définir le canal pour les plans de jeux hebdomadaires automatiques')
  .addChannelOption((option: any) =>
    option
      .setName('canal')
      .setDescription('Le canal où envoyer les plans hebdomadaires')
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildText)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function execute(interaction: ChatInputCommandInteraction) {
  const canal = interaction.options.get('canal')?.channel;

  if (!canal) {
    await interaction.reply({
      content: '❌ Veuillez fournir un canal textuel valide !',
      ephemeral: true,
    });
    return;
  }

  try {
    const planificateur = PlanificateurHebdomadaire.getInstance(interaction.client);
    planificateur.definirCanal(canal.id, interaction.user.id);
    planificateur.demarrerPlanificateur();

    await interaction.reply({
      content:
        `✅ Les plans de jeux hebdomadaires seront maintenant automatiquement envoyés dans <#${canal.id}> chaque lundi à 10h !\n\n` +
        `📝 Cette configuration est sauvegardée et persistera après un redémarrage du bot.`,
      ephemeral: true,
    });
  } catch (erreur) {
    console.error('Erreur lors de la définition du canal :', erreur);
    await interaction.reply({
      content: "❌ Une erreur s'est produite lors de la définition du canal.",
      ephemeral: true,
    });
  }
}
