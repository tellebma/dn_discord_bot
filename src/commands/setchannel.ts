import { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, ChannelType } from 'discord.js';
import { WeeklyPlanner } from '@/fonctions/scheduler/weeklyPlanner';

export const data = new SlashCommandBuilder()
  .setName('setchannel')
  .setDescription('Set the channel for automatic weekly game plans')
  .addChannelOption(option =>
    option.setName('channel')
      .setDescription('The channel to send weekly plans to')
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildText))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function execute(interaction: CommandInteraction) {
  const channel = interaction.options.get('channel')?.channel;

  if (!channel) {
    await interaction.reply({
      content: '❌ Please provide a valid text channel!',
      ephemeral: true
    });
    return;
  }

  try {
    const weeklyPlanner = WeeklyPlanner.getInstance(interaction.client);
    weeklyPlanner.setChannel(channel.id);
    weeklyPlanner.startScheduler();

    await interaction.reply({
      content: `✅ Weekly game plans will now be automatically sent to <#${channel.id}> every Monday at 10 AM!`,
      ephemeral: true
    });
  } catch (error) {
    console.error('Error setting channel:', error);
    await interaction.reply({
      content: '❌ An error occurred while setting the channel.',
      ephemeral: true
    });
  }
}