import type { ContexteLog } from '@/types/bot';

/** Niveaux de journalisation disponibles */
export enum NiveauLog {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/** Structure d'une entrée de log */
interface EntreeLog {
  horodatage: string;
  niveau: string;
  message: string;
  [cle: string]: any;
}

/**
 * Classe de journalisation pour le bot
 * Fournit des méthodes de logging structuré avec différents niveaux
 */
export class Journaliseur {
  /**
   * Formate une entrée de log avec horodatage et contexte
   */
  private static formaterEntreeLog(niveau: NiveauLog, message: string, contexte: ContexteLog = {}): EntreeLog {
    return {
      horodatage: new Date().toISOString(),
      niveau: niveau.toUpperCase(),
      message,
      ...contexte,
    };
  }

  /**
   * Affiche une entrée de log
   */
  private static afficher(entreeLog: EntreeLog): void {
    console.log(JSON.stringify(entreeLog));
  }

  /**
   * Journalise un message avec un niveau spécifique
   */
  public static log(niveau: NiveauLog, message: string, contexte: ContexteLog = {}): void {
    const entreeLog = this.formaterEntreeLog(niveau, message, contexte);
    this.afficher(entreeLog);
  }

  /**
   * Journalise un message d'information
   */
  public static info(message: string, contexte: ContexteLog = {}): void {
    this.log(NiveauLog.INFO, message, contexte);
  }

  /**
   * Journalise un avertissement
   */
  public static warn(message: string, contexte: ContexteLog = {}): void {
    this.log(NiveauLog.WARN, message, contexte);
  }

  /**
   * Journalise une erreur
   */
  public static error(message: string, contexte: ContexteLog = {}): void {
    this.log(NiveauLog.ERROR, message, contexte);
  }

  /**
   * Journalise un message de débogage (uniquement en mode développement)
   */
  public static debug(message: string, contexte: ContexteLog = {}): void {
    if (process.env.NODE_ENV === 'development') {
      this.log(NiveauLog.DEBUG, message, contexte);
    }
  }
}
