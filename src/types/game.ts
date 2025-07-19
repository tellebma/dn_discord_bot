export interface Game {
  id: string;
  name: string;
  description?: string;
  category?: string;
  minPlayers?: number;
  maxPlayers?: number;
  addedBy: string;
  addedAt: Date;
}

export interface GamePool {
  games: Game[];
}

export interface ExtraActivity {
  id: string;
  name: string;
  description?: string;
  location?: string;
  time?: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  isActive: boolean;
  addedBy: string;
  addedAt: Date;
}

export interface ExtraActivitiesPool {
  activities: ExtraActivity[];
}

export interface WeeklyPlan {
  week: string;
  games: Game[];
  extraActivities: ExtraActivity[];
  generatedAt: Date;
}