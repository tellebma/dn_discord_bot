import { SlashCommandBuilder, EmbedBuilder, CommandInteraction } from 'discord.js';
import { ExtraActivitiesManager } from '@/fonctions/database/extraActivities';

export const data = new SlashCommandBuilder()
  .setName('addactivity')
  .setDescription('Add an extra activity to the weekly schedule')
  .addStringOption(option =>
    option.setName('name')
      .setDescription('Name of the activity')
      .setRequired(true))
  .addIntegerOption(option =>
    option.setName('day')
      .setDescription('Day of the week for this activity')
      .setRequired(true)
      .addChoices(
        { name: 'Sunday', value: 0 },
        { name: 'Monday', value: 1 },
        { name: 'Tuesday', value: 2 },
        { name: 'Wednesday', value: 3 },
        { name: 'Thursday', value: 4 },
        { name: 'Friday', value: 5 },
        { name: 'Saturday', value: 6 }
      ))
  .addStringOption(option =>
    option.setName('description')
      .setDescription('Description of the activity')
      .setRequired(false))
  .addStringOption(option =>
    option.setName('location')
      .setDescription('Location of the activity')
      .setRequired(false))
  .addStringOption(option =>
    option.setName('time')
      .setDescription('Time of the activity (e.g., "18:00" or "6 PM")')
      .setRequired(false))
  .addBooleanOption(option =>
    option.setName('active')
      .setDescription('Whether the activity is active (default: true)')
      .setRequired(false));

export async function execute(interaction: CommandInteraction) {
  const name = interaction.options.get('name')?.value as string;
  const dayOfWeek = interaction.options.get('day')?.value as number;
  const description = interaction.options.get('description')?.value as string;
  const location = interaction.options.get('location')?.value as string;
  const time = interaction.options.get('time')?.value as string;
  const isActive = interaction.options.get('active')?.value as boolean ?? true;

  const activitiesManager = ExtraActivitiesManager.getInstance();
  
  const existingActivity = activitiesManager.findActivity(name);
  if (existingActivity) {
    await interaction.reply({
      content: `❌ An activity with the name "${name}" already exists!`,
      ephemeral: true
    });
    return;
  }

  const newActivity = activitiesManager.addActivity({
    name,
    description,
    location,
    time,
    dayOfWeek,
    isActive,
    addedBy: interaction.user.id
  });

  const dayName = activitiesManager.getDayName(dayOfWeek);
  
  const embed = new EmbedBuilder()
    .setTitle('✅ Activity Added Successfully!')
    .setColor(isActive ? 0x00FF00 : 0xFFAA00)
    .addFields(
      { name: 'Name', value: newActivity.name, inline: true },
      { name: 'Day', value: dayName, inline: true },
      { name: 'Status', value: isActive ? '🟢 Active' : '🟡 Inactive', inline: true },
      { name: 'Added by', value: `<@${newActivity.addedBy}>`, inline: true },
      { name: 'Activity ID', value: newActivity.id, inline: true }
    )
    .setTimestamp();

  if (newActivity.description) {
    embed.addFields({ name: 'Description', value: newActivity.description });
  }
  
  if (newActivity.location) {
    embed.addFields({ name: 'Location', value: newActivity.location, inline: true });
  }

  if (newActivity.time) {
    embed.addFields({ name: 'Time', value: newActivity.time, inline: true });
  }

  await interaction.reply({ embeds: [embed] });
}