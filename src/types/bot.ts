import { Client, Collection, SlashCommandBuilder } from 'discord.js';

export interface BotCommand {
  data: SlashCommandBuilder;
  execute: (interaction: any) => Promise<void>;
}

export interface ExtendedClient extends Client {
  commands: Collection<string, BotCommand>;
}

export interface CommandConfig {
  name: string;
  description: string;
  category?: string;
  permissions?: string[];
  cooldown?: number;
  data: SlashCommandBuilder;
  parameters?: CommandParameter[];
  handler: CommandHandler;
}

export interface CommandParameter {
  type: ParameterType;
  name: string;
  description: string;
  required?: boolean;
  choices?: ParameterChoice[];
  validation?: ParameterValidation;
}

export interface ParameterChoice {
  name: string;
  value: string | number;
}

export interface ParameterValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
}

export type ParameterType = 
  | 'string'
  | 'integer'
  | 'number'
  | 'boolean'
  | 'user'
  | 'channel'
  | 'role'
  | 'mentionable'
  | 'attachment';

export type CommandHandler = (interaction: any, params: Record<string, any>) => Promise<void>;

export interface LogContext {
  [key: string]: any;
}

export interface ConfigType {
  discord: {
    token: string;
    clientId: string;
  };
  bot: {
    isDevelopment: boolean;
  };
}

export interface ValidationResult {
  valid: boolean;
  params?: Record<string, any>;
  error?: string;
}

export interface ParameterValidator {
  (value: any, options?: any): boolean;
}

export interface CommandCooldown {
  userId: string;
  commandName: string;
  timestamp: number;
}