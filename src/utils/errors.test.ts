import { describe, it, expect } from 'vitest';
import { BotError, DatabaseError, ErrorCode, ErrorSeverity, sanitizeMessage } from './errors.js';

describe('sanitizeMessage', () => {
  it('masque les identifiants dans une URL postgres', () => {
    expect(sanitizeMessage('connect to postgres://bot:s3cr3t@db:5432/x failed')).toBe(
      'connect to postgres://***@db:5432/x failed'
    );
  });

  it('masque un password=...', () => {
    expect(sanitizeMessage('password=hunter2 invalide')).toBe('password=*** invalide');
  });

  it('laisse un message neutre intact', () => {
    expect(sanitizeMessage('timeout')).toBe('timeout');
  });
});

describe('BotError', () => {
  it('porte un code et une sévérité par défaut', () => {
    const e = new BotError('boom');
    expect(e.code).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(e.severity).toBe(ErrorSeverity.MEDIUM);
    expect(e.getUserMessage()).toContain('Une erreur');
  });
});

describe('DatabaseError', () => {
  it('sanitize le message, est HIGH et expose un message utilisateur dédié', () => {
    const e = new DatabaseError('échec postgres://bot:pwd@h/db');
    expect(e.code).toBe(ErrorCode.DATABASE_ERROR);
    expect(e.severity).toBe(ErrorSeverity.HIGH);
    expect(e.message).toContain('postgres://***@');
    expect(e.getUserMessage()).toContain('base de données');
  });
});
