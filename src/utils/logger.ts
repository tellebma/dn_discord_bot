/**
 * Système de logs
 */
export class Logger {
  private static instance: Logger;
  private niveau: string;

  private constructor() {
    this.niveau = process.env.LOG_LEVEL || 'info';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public info(message: string, ...args: any[]): void {
    if (this.niveau === 'debug' || this.niveau === 'info') {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  public warn(message: string, ...args: any[]): void {
    if (this.niveau === 'debug' || this.niveau === 'info' || this.niveau === 'warn') {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  public error(message: string, ...args: any[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }

  public debug(message: string, ...args: any[]): void {
    if (this.niveau === 'debug') {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
}