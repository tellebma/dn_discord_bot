import fs from 'fs';
import path from 'path';
import { Game, GamePool } from '@/types/game';

const GAME_POOL_FILE = path.join(process.cwd(), 'data', 'gamePool.json');

export class GamePoolManager {
  private static instance: GamePoolManager;
  private gamePool: GamePool;

  private constructor() {
    this.gamePool = this.loadGamePool();
  }

  public static getInstance(): GamePoolManager {
    if (!GamePoolManager.instance) {
      GamePoolManager.instance = new GamePoolManager();
    }
    return GamePoolManager.instance;
  }

  private loadGamePool(): GamePool {
    try {
      if (fs.existsSync(GAME_POOL_FILE)) {
        const data = fs.readFileSync(GAME_POOL_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        return {
          games: parsed.games.map((game: any) => ({
            ...game,
            addedAt: new Date(game.addedAt)
          }))
        };
      }
    } catch (error) {
      console.error('Error loading game pool:', error);
    }
    
    return { games: [] };
  }

  private saveGamePool(): void {
    try {
      const dir = path.dirname(GAME_POOL_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(GAME_POOL_FILE, JSON.stringify(this.gamePool, null, 2));
    } catch (error) {
      console.error('Error saving game pool:', error);
    }
  }

  public addGame(game: Omit<Game, 'id' | 'addedAt'>): Game {
    const newGame: Game = {
      ...game,
      id: Date.now().toString(),
      addedAt: new Date()
    };
    
    this.gamePool.games.push(newGame);
    this.saveGamePool();
    return newGame;
  }

  public removeGame(gameId: string): boolean {
    const initialLength = this.gamePool.games.length;
    this.gamePool.games = this.gamePool.games.filter(game => game.id !== gameId);
    
    if (this.gamePool.games.length < initialLength) {
      this.saveGamePool();
      return true;
    }
    return false;
  }

  public getGames(): Game[] {
    return [...this.gamePool.games];
  }

  public getRandomGames(count: number): Game[] {
    const shuffled = [...this.gamePool.games].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  public findGame(nameOrId: string): Game | undefined {
    return this.gamePool.games.find(game => 
      game.id === nameOrId || 
      game.name.toLowerCase().includes(nameOrId.toLowerCase())
    );
  }
}