import fs from 'fs';
import path from 'path';
import { ExtraActivity, ExtraActivitiesPool } from '@/types/game';

const EXTRA_ACTIVITIES_FILE = path.join(process.cwd(), 'data', 'extraActivities.json');

export class ExtraActivitiesManager {
  private static instance: ExtraActivitiesManager;
  private activitiesPool: ExtraActivitiesPool;

  private constructor() {
    this.activitiesPool = this.loadActivities();
  }

  public static getInstance(): ExtraActivitiesManager {
    if (!ExtraActivitiesManager.instance) {
      ExtraActivitiesManager.instance = new ExtraActivitiesManager();
    }
    return ExtraActivitiesManager.instance;
  }

  private loadActivities(): ExtraActivitiesPool {
    try {
      if (fs.existsSync(EXTRA_ACTIVITIES_FILE)) {
        const data = fs.readFileSync(EXTRA_ACTIVITIES_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        return {
          activities: parsed.activities.map((activity: any) => ({
            ...activity,
            addedAt: new Date(activity.addedAt)
          }))
        };
      }
    } catch (error) {
      console.error('Error loading extra activities:', error);
    }
    
    return { activities: [] };
  }

  private saveActivities(): void {
    try {
      const dir = path.dirname(EXTRA_ACTIVITIES_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(EXTRA_ACTIVITIES_FILE, JSON.stringify(this.activitiesPool, null, 2));
    } catch (error) {
      console.error('Error saving extra activities:', error);
    }
  }

  public addActivity(activity: Omit<ExtraActivity, 'id' | 'addedAt'>): ExtraActivity {
    const newActivity: ExtraActivity = {
      ...activity,
      id: Date.now().toString(),
      addedAt: new Date()
    };
    
    this.activitiesPool.activities.push(newActivity);
    this.saveActivities();
    return newActivity;
  }

  public removeActivity(activityId: string): boolean {
    const initialLength = this.activitiesPool.activities.length;
    this.activitiesPool.activities = this.activitiesPool.activities.filter(activity => activity.id !== activityId);
    
    if (this.activitiesPool.activities.length < initialLength) {
      this.saveActivities();
      return true;
    }
    return false;
  }

  public toggleActivity(activityId: string): ExtraActivity | null {
    const activity = this.activitiesPool.activities.find(a => a.id === activityId);
    if (activity) {
      activity.isActive = !activity.isActive;
      this.saveActivities();
      return activity;
    }
    return null;
  }

  public getActivities(): ExtraActivity[] {
    return [...this.activitiesPool.activities];
  }

  public getActiveActivities(): ExtraActivity[] {
    return this.activitiesPool.activities.filter(activity => activity.isActive);
  }

  public getActivitiesForDay(dayOfWeek: number): ExtraActivity[] {
    return this.activitiesPool.activities.filter(activity => 
      activity.isActive && activity.dayOfWeek === dayOfWeek
    );
  }

  public findActivity(nameOrId: string): ExtraActivity | undefined {
    return this.activitiesPool.activities.find(activity => 
      activity.id === nameOrId || 
      activity.name.toLowerCase().includes(nameOrId.toLowerCase())
    );
  }

  public getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
  }

  public updateActivity(activityId: string, updates: Partial<Omit<ExtraActivity, 'id' | 'addedAt' | 'addedBy'>>): ExtraActivity | null {
    const activity = this.activitiesPool.activities.find(a => a.id === activityId);
    if (activity) {
      Object.assign(activity, updates);
      this.saveActivities();
      return activity;
    }
    return null;
  }
}