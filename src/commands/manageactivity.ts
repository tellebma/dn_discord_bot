import { SlashCommandBuilder, EmbedBuilder, CommandInteraction, PermissionFlagsBits } from 'discord.js';
import { ExtraActivitiesManager } from '@/fonctions/database/extraActivities';

export const data = new SlashCommandBuilder()
  .setName('manageactivity')
  .setDescription('Manage extra activities')
  .addSubcommand(subcommand =>
    subcommand
      .setName('toggle')
      .setDescription('Toggle an activity active/inactive')
      .addStringOption(option =>
        option.setName('activity')
          .setDescription('Activity name or ID')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('remove')
      .setDescription('Remove an activity permanently')
      .addStringOption(option =>
        option.setName('activity')
          .setDescription('Activity name or ID')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('edit')
      .setDescription('Edit an activity')
      .addStringOption(option =>
        option.setName('activity')
          .setDescription('Activity name or ID')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('name')
          .setDescription('New name for the activity')
          .setRequired(false))
      .addStringOption(option =>
        option.setName('description')
          .setDescription('New description for the activity')
          .setRequired(false))
      .addStringOption(option =>
        option.setName('location')
          .setDescription('New location for the activity')
          .setRequired(false))
      .addStringOption(option =>
        option.setName('time')
          .setDescription('New time for the activity')
          .setRequired(false))
      .addIntegerOption(option =>
        option.setName('day')
          .setDescription('New day of the week')
          .setRequired(false)
          .addChoices(
            { name: 'Sunday', value: 0 },
            { name: 'Monday', value: 1 },
            { name: 'Tuesday', value: 2 },
            { name: 'Wednesday', value: 3 },
            { name: 'Thursday', value: 4 },
            { name: 'Friday', value: 5 },
            { name: 'Saturday', value: 6 }
          )))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction: CommandInteraction) {
  const subcommand = interaction.options.data[0].name;
  const activityInput = interaction.options.get('activity')?.value as string;
  
  const activitiesManager = ExtraActivitiesManager.getInstance();
  const activity = activitiesManager.findActivity(activityInput);
  
  if (!activity) {
    await interaction.reply({
      content: `❌ Activity "${activityInput}" not found!`,
      ephemeral: true
    });
    return;
  }

  switch (subcommand) {
    case 'toggle':
      const toggledActivity = activitiesManager.toggleActivity(activity.id);
      if (toggledActivity) {
        const status = toggledActivity.isActive ? '🟢 Active' : '🔴 Inactive';
        const embed = new EmbedBuilder()
          .setTitle('✅ Activity Status Updated')
          .setDescription(`**${toggledActivity.name}** is now ${status}`)
          .setColor(toggledActivity.isActive ? 0x00FF00 : 0xFF0000)
          .addFields(
            { name: 'Day', value: activitiesManager.getDayName(toggledActivity.dayOfWeek), inline: true },
            { name: 'Status', value: status, inline: true }
          )
          .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
      }
      break;

    case 'remove':
      const removed = activitiesManager.removeActivity(activity.id);
      if (removed) {
        const embed = new EmbedBuilder()
          .setTitle('🗑️ Activity Removed')
          .setDescription(`**${activity.name}** has been permanently removed from the schedule.`)
          .setColor(0xFF0000)
          .addFields(
            { name: 'Day', value: activitiesManager.getDayName(activity.dayOfWeek), inline: true },
            { name: 'ID', value: activity.id, inline: true }
          )
          .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
      }
      break;

    case 'edit':
      const newName = interaction.options.get('name')?.value as string;
      const newDescription = interaction.options.get('description')?.value as string;
      const newLocation = interaction.options.get('location')?.value as string;
      const newTime = interaction.options.get('time')?.value as string;
      const newDay = interaction.options.get('day')?.value as number;

      const updates: any = {};
      if (newName) updates.name = newName;
      if (newDescription !== undefined) updates.description = newDescription;
      if (newLocation !== undefined) updates.location = newLocation;
      if (newTime !== undefined) updates.time = newTime;
      if (newDay !== undefined) updates.dayOfWeek = newDay;

      if (Object.keys(updates).length === 0) {
        await interaction.reply({
          content: '❌ No changes specified! Please provide at least one field to update.',
          ephemeral: true
        });
        return;
      }

      const updatedActivity = activitiesManager.updateActivity(activity.id, updates);
      if (updatedActivity) {
        const embed = new EmbedBuilder()
          .setTitle('✅ Activity Updated')
          .setDescription(`**${updatedActivity.name}** has been updated successfully.`)
          .setColor(0x00FF00)
          .addFields(
            { name: 'Day', value: activitiesManager.getDayName(updatedActivity.dayOfWeek), inline: true },
            { name: 'Status', value: updatedActivity.isActive ? '🟢 Active' : '🔴 Inactive', inline: true }
          )
          .setTimestamp();

        if (updatedActivity.description) {
          embed.addFields({ name: 'Description', value: updatedActivity.description });
        }
        
        if (updatedActivity.location) {
          embed.addFields({ name: 'Location', value: updatedActivity.location, inline: true });
        }

        if (updatedActivity.time) {
          embed.addFields({ name: 'Time', value: updatedActivity.time, inline: true });
        }
        
        await interaction.reply({ embeds: [embed] });
      }
      break;

    default:
      await interaction.reply({
        content: '❌ Unknown subcommand!',
        ephemeral: true
      });
  }
}