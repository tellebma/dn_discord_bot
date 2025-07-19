import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import { GamePoolManager } from '@/fonctions/database/gamePool';
import { ExtraActivitiesManager } from '@/fonctions/database/extraActivities';
import { WeeklyPlan } from '@/types/game';
import fs from 'fs';
import path from 'path';

const WEEKLY_PLANS_FILE = path.join(process.cwd(), 'data', 'weeklyPlans.json');

export class WeeklyPlanner {
  private static instance: WeeklyPlanner;
  private client: Client;
  private channelId: string | null = null;
  private isScheduled = false;

  private constructor(client: Client) {
    this.client = client;
  }

  public static getInstance(client: Client): WeeklyPlanner {
    if (!WeeklyPlanner.instance) {
      WeeklyPlanner.instance = new WeeklyPlanner(client);
    }
    return WeeklyPlanner.instance;
  }

  public setChannel(channelId: string): void {
    this.channelId = channelId;
  }

  public startScheduler(): void {
    if (this.isScheduled) return;
    
    this.isScheduled = true;
    this.scheduleWeeklyPosts();
  }

  private scheduleWeeklyPosts(): void {
    const now = new Date();
    const nextMonday = this.getNextMonday(now);
    const timeUntilMonday = nextMonday.getTime() - now.getTime();

    setTimeout(() => {
      this.sendWeeklyPlan();
      setInterval(() => {
        this.sendWeeklyPlan();
      }, 7 * 24 * 60 * 60 * 1000); // Every 7 days
    }, timeUntilMonday);
  }

  private getNextMonday(from: Date): Date {
    const date = new Date(from);
    const day = date.getDay();
    const daysUntilMonday = day === 0 ? 1 : 8 - day; // If Sunday (0), next Monday is 1 day away
    
    date.setDate(date.getDate() + daysUntilMonday);
    date.setHours(10, 0, 0, 0); // 10 AM on Monday
    
    return date;
  }

  public async sendWeeklyPlan(): Promise<void> {
    if (!this.channelId) {
      console.error('No channel set for weekly plans');
      return;
    }

    try {
      const channel = await this.client.channels.fetch(this.channelId) as TextChannel;
      if (!channel) {
        console.error('Channel not found for weekly plans');
        return;
      }

      const weeklyPlan = this.generateWeeklyPlan();
      const embed = this.createWeeklyPlanEmbed(weeklyPlan);

      await channel.send({ embeds: [embed] });
      this.saveWeeklyPlan(weeklyPlan);
      
      console.log('Weekly plan sent successfully');
    } catch (error) {
      console.error('Error sending weekly plan:', error);
    }
  }

  private generateWeeklyPlan(): WeeklyPlan {
    const gamePoolManager = GamePoolManager.getInstance();
    const activitiesManager = ExtraActivitiesManager.getInstance();
    
    const allGames = gamePoolManager.getGames();
    const numberOfGames = Math.min(5, allGames.length); // Up to 5 games per week
    const selectedGames = gamePoolManager.getRandomGames(numberOfGames);
    
    // Get all active extra activities for the week
    const extraActivities = activitiesManager.getActiveActivities();
    
    const weekString = this.getWeekString(new Date());
    
    return {
      week: weekString,
      games: selectedGames,
      extraActivities,
      generatedAt: new Date()
    };
  }

  private getWeekString(date: Date): string {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
  }

  private createWeeklyPlanEmbed(plan: WeeklyPlan): EmbedBuilder {
    const activitiesManager = ExtraActivitiesManager.getInstance();
    
    const embed = new EmbedBuilder()
      .setTitle('🗓️ Weekly Plan')
      .setDescription(`Plan for the week: ${plan.week}`)
      .setColor(0x9966FF)
      .setTimestamp()
      .setFooter({ text: 'Have fun this week! 🎮📅' });

    // Add games section
    if (plan.games.length === 0) {
      embed.addFields({
        name: '🎮 Games',
        value: '❌ No games available. Use `/addgame` to add some games.',
        inline: false
      });
    } else {
      const gamesList = plan.games.map((game, index) => {
        let gameInfo = `**${index + 1}. ${game.name}**`;
        if (game.description) gameInfo += `\n   ${game.description}`;
        
        if (game.minPlayers || game.maxPlayers) {
          const players = game.minPlayers && game.maxPlayers 
            ? `${game.minPlayers}-${game.maxPlayers}` 
            : game.minPlayers 
            ? `${game.minPlayers}+` 
            : `up to ${game.maxPlayers}`;
          gameInfo += `\n   👥 ${players} players`;
        }
        
        if (game.category) {
          gameInfo += `\n   📂 ${game.category}`;
        }
        
        return gameInfo;
      }).join('\n\n');

      embed.addFields({
        name: `🎮 Games (${plan.games.length})`,
        value: gamesList,
        inline: false
      });
    }

    // Add extra activities section
    if (plan.extraActivities.length === 0) {
      embed.addFields({
        name: '📅 Extra Activities',
        value: '❌ No extra activities scheduled. Use `/addactivity` to add some.',
        inline: false
      });
    } else {
      // Group activities by day
      const activitiesByDay: { [key: number]: any[] } = {};
      plan.extraActivities.forEach(activity => {
        if (!activitiesByDay[activity.dayOfWeek]) {
          activitiesByDay[activity.dayOfWeek] = [];
        }
        activitiesByDay[activity.dayOfWeek].push(activity);
      });

      const sortedDays = Object.keys(activitiesByDay).map(Number).sort();
      const activitiesText = sortedDays.map(dayOfWeek => {
        const dayName = activitiesManager.getDayName(dayOfWeek);
        const dayActivities = activitiesByDay[dayOfWeek];
        
        const activitiesList = dayActivities.map(activity => {
          let info = `**${activity.name}**`;
          if (activity.time) info += ` • ${activity.time}`;
          if (activity.location) info += ` • 📍 ${activity.location}`;
          if (activity.description) info += `\n   ${activity.description}`;
          return info;
        }).join('\n');
        
        return `**${dayName}:**\n${activitiesList}`;
      }).join('\n\n');

      embed.addFields({
        name: `📅 Extra Activities (${plan.extraActivities.length})`,
        value: activitiesText,
        inline: false
      });
    }

    return embed;
  }

  private saveWeeklyPlan(plan: WeeklyPlan): void {
    try {
      const dir = path.dirname(WEEKLY_PLANS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let plans: WeeklyPlan[] = [];
      if (fs.existsSync(WEEKLY_PLANS_FILE)) {
        const data = fs.readFileSync(WEEKLY_PLANS_FILE, 'utf-8');
        plans = JSON.parse(data);
      }

      plans.push(plan);
      
      // Keep only the last 10 plans
      if (plans.length > 10) {
        plans = plans.slice(-10);
      }

      fs.writeFileSync(WEEKLY_PLANS_FILE, JSON.stringify(plans, null, 2));
    } catch (error) {
      console.error('Error saving weekly plan:', error);
    }
  }

  public async manualWeeklyPlan(channelId: string): Promise<WeeklyPlan> {
    const originalChannelId = this.channelId;
    this.channelId = channelId;
    
    const plan = this.generateWeeklyPlan();
    const channel = await this.client.channels.fetch(channelId) as TextChannel;
    const embed = this.createWeeklyPlanEmbed(plan);
    
    await channel.send({ embeds: [embed] });
    this.saveWeeklyPlan(plan);
    
    this.channelId = originalChannelId;
    return plan;
  }
}