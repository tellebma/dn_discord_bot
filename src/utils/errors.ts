/**
 * Hiérarchie d'erreurs centralisée. Calqué (version allégée) sur le bot dvg.
 */
import type { LogContext } from './logger.js';

export enum ErrorCode {
  UNKNOWN_ERROR = 'E1000',
  COMMAND_EXECUTION_ERROR = 'E2001',
  VALIDATION_ERROR = 'E3000',
  PERMISSION_DENIED = 'E4000',
  DATABASE_ERROR = 'E7002',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

/**
 * Masque les identifiants potentiellement présents dans un message d'erreur
 * (URL de connexion postgres, mot de passe) avant qu'il ne parte dans les logs.
 */
export function sanitizeMessage(message: string): string {
  return message
    .replace(/postgres(?:ql)?:\/\/[^@\s]+@/gi, 'postgres://***@')
    .replace(/password=[^\s&;]+/gi, 'password=***');
}

export class BotError extends Error {
  public readonly code: ErrorCode;
  public readonly context: LogContext;
  public readonly severity: ErrorSeverity;
  public readonly originalError: Error | undefined;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    context: LogContext = {},
    originalError?: Error,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ) {
    super(message);
    this.name = 'BotError';
    this.code = code;
    this.context = context;
    this.severity = severity;
    this.originalError = originalError;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  getUserMessage(): string {
    return 'Une erreur est survenue lors du traitement de votre demande.';
  }
}

export class DatabaseError extends BotError {
  constructor(message: string, context: LogContext = {}, originalError?: Error) {
    super(
      sanitizeMessage(message),
      ErrorCode.DATABASE_ERROR,
      context,
      originalError,
      ErrorSeverity.HIGH
    );
    this.name = 'DatabaseError';
  }

  override getUserMessage(): string {
    return 'Une erreur de base de données est survenue. Réessayez plus tard.';
  }
}
