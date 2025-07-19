import { SlashCommandBuilder, EmbedBuilder, CommandInteraction } from 'discord.js';
import { ExtraActivitiesManager } from '@/fonctions/database/extraActivities';

export const data = new SlashCommandBuilder()
  .setName('activities')
  .setDescription('View all extra activities')
  .addBooleanOption(option =>
    option.setName('activeonly')
      .setDescription('Show only active activities (default: false)')
      .setRequired(false));

export async function execute(interaction: CommandInteraction) {
  const activeOnly = interaction.options.get('activeonly')?.value as boolean ?? false;
  
  const activitiesManager = ExtraActivitiesManager.getInstance();
  const activities = activeOnly ? activitiesManager.getActiveActivities() : activitiesManager.getActivities();

  if (activities.length === 0) {
    const message = activeOnly 
      ? 'No active extra activities found! Use `/addactivity` to add some.'
      : 'No extra activities found! Use `/addactivity` to add some.';
    
    await interaction.reply({
      content: message,
      ephemeral: true
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('📅 Extra Activities')
    .setDescription(`${activeOnly ? 'Active activities' : 'All activities'}: ${activities.length}`)
    .setColor(0x9966FF)
    .setTimestamp();

  const dayGroups: { [key: number]: any[] } = {};
  
  activities.forEach(activity => {
    if (!dayGroups[activity.dayOfWeek]) {
      dayGroups[activity.dayOfWeek] = [];
    }
    dayGroups[activity.dayOfWeek].push(activity);
  });

  // Sort days from Sunday (0) to Saturday (6)
  const sortedDays = Object.keys(dayGroups).map(Number).sort();

  sortedDays.forEach(dayOfWeek => {
    const dayName = activitiesManager.getDayName(dayOfWeek);
    const dayActivities = dayGroups[dayOfWeek];
    
    const activitiesList = dayActivities.map(activity => {
      let activityInfo = `${activity.isActive ? '🟢' : '🔴'} **${activity.name}**`;
      
      if (activity.time) {
        activityInfo += ` • ${activity.time}`;
      }
      
      if (activity.location) {
        activityInfo += ` • 📍 ${activity.location}`;
      }
      
      if (activity.description) {
        activityInfo += `\n   ${activity.description}`;
      }
      
      activityInfo += `\n   *ID: ${activity.id}*`;
      
      return activityInfo;
    }).join('\n\n');

    embed.addFields({
      name: `${dayName} (${dayActivities.length})`,
      value: activitiesList,
      inline: false
    });
  });

  await interaction.reply({ embeds: [embed] });
}