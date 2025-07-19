import { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits } from 'discord.js';
import { WeeklyPlanner } from '@/fonctions/scheduler/weeklyPlanner';

export const data = new SlashCommandBuilder()
  .setName('weeklyplan')
  .setDescription('Generate and send a weekly game plan')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction: CommandInteraction) {
  if (!interaction.channelId) {
    await interaction.reply({
      content: '❌ This command must be used in a channel!',
      ephemeral: true
    });
    return;
  }

  await interaction.deferReply();

  try {
    const weeklyPlanner = WeeklyPlanner.getInstance(interaction.client);
    const plan = await weeklyPlanner.manualWeeklyPlan(interaction.channelId);

    await interaction.editReply({
      content: `✅ Weekly plan generated for the week: ${plan.week}\nSelected ${plan.games.length} games and ${plan.extraActivities.length} extra activities.`
    });
  } catch (error) {
    console.error('Error generating weekly plan:', error);
    await interaction.editReply({
      content: '❌ An error occurred while generating the weekly plan.'
    });
  }
}