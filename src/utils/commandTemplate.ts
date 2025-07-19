import type { 
  CommandConfig, 
  CommandParameter, 
  ValidationResult, 
  ParameterValidator,
  LogContext 
} from '@/types/bot';
import { Logger } from '@/utils/logger';
import type { ChatInputCommandInteraction, PermissionResolvable } from 'discord.js';

export const ParameterValidators: Record<string, ParameterValidator> = {
  string: (value: any, options: any = {}): boolean => {
    if (typeof value !== 'string') return false;
    if (options.minLength && value.length < options.minLength) return false;
    if (options.maxLength && value.length > options.maxLength) return false;
    if (options.pattern && !options.pattern.test(value)) return false;
    return true;
  },

  integer: (value: any, options: any = {}): boolean => {
    if (!Number.isInteger(value)) return false;
    if (options.min !== undefined && value < options.min) return false;
    if (options.max !== undefined && value > options.max) return false;
    return true;
  },

  number: (value: any, options: any = {}): boolean => {
    if (typeof value !== 'number' || isNaN(value)) return false;
    if (options.min !== undefined && value < options.min) return false;
    if (options.max !== undefined && value > options.max) return false;
    return true;
  },

  boolean: (value: any): boolean => typeof value === 'boolean',

  user: (value: any): boolean => value && typeof value === 'object' && value.id,

  channel: (value: any): boolean => value && typeof value === 'object' && value.id,

  role: (value: any): boolean => value && typeof value === 'object' && value.id,

  mentionable: (value: any): boolean => value && typeof value === 'object' && value.id,

  attachment: (value: any): boolean => value && typeof value === 'object' && value.url,
};

export class CommandTemplate {
  public readonly name: string;
  public readonly description: string;
  public readonly category: string;
  public readonly permissions: string[];
  public readonly cooldown: number;
  public readonly parameters: CommandParameter[];
  private readonly handler: CommandConfig['handler'];
  private static cooldowns = new Map<string, number>();

  constructor(config: CommandConfig) {
    this.name = config.name;
    this.description = config.description;
    this.category = config.category ?? 'general';
    this.permissions = config.permissions ?? [];
    this.cooldown = config.cooldown ?? 0;
    this.parameters = config.parameters ?? [];
    this.handler = config.handler;

    if (!this.name || !this.description || !this.handler) {
      throw new Error('Command template requires name, description, and handler');
    }
  }

  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const startTime = Date.now();

    try {
      Logger.info(`Command executed: ${this.name}`, {
        command: this.name,
        user: interaction.user.tag,
        guild: interaction.guild?.name ?? 'DM',
        channel: interaction.channel?.id ?? 'DM',
      } as LogContext);

      if (!this.validatePermissions(interaction)) {
        await interaction.reply({
          content: '❌ You do not have permission to use this command.',
          ephemeral: true,
        });
        return;
      }

      if (!this.checkCooldown(interaction)) {
        await interaction.reply({
          content: '⏱️ Please wait before using this command again.',
          ephemeral: true,
        });
        return;
      }

      const validatedParams = this.validateParameters(interaction);
      if (!validatedParams.valid) {
        await interaction.reply({
          content: `❌ Invalid parameters: ${validatedParams.error ?? 'Unknown error'}`,
          ephemeral: true,
        });
        return;
      }

      await this.handler(interaction, validatedParams.params ?? {});

      const executionTime = Date.now() - startTime;
      Logger.info(`Command completed: ${this.name}`, {
        command: this.name,
        executionTime: `${executionTime}ms`,
        success: true,
      } as LogContext);
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      Logger.error(`Command error: ${this.name}`, {
        command: this.name,
        error: errorMessage,
        stack: errorStack,
        executionTime: `${executionTime}ms`,
        success: false,
      } as LogContext);

      const replyMessage = {
        content: '❌ An error occurred while executing this command.',
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(replyMessage);
      } else {
        await interaction.reply(replyMessage);
      }
    }
  }

  private validatePermissions(interaction: ChatInputCommandInteraction): boolean {
    if (this.permissions.length === 0) return true;

    if (!interaction.member || !('permissions' in interaction.member)) return false;

    return this.permissions.every(permission =>
      interaction.member?.permissions?.has(permission as PermissionResolvable)
    );
  }

  private checkCooldown(interaction: ChatInputCommandInteraction): boolean {
    if (this.cooldown === 0) return true;

    const cooldownKey = `${this.name}_${interaction.user.id}`;
    const lastUsed = CommandTemplate.cooldowns.get(cooldownKey) ?? 0;
    const now = Date.now();

    if (now - lastUsed < this.cooldown * 1000) {
      return false;
    }

    CommandTemplate.cooldowns.set(cooldownKey, now);
    return true;
  }

  private validateParameters(interaction: ChatInputCommandInteraction): ValidationResult {
    const params: Record<string, any> = {};

    for (const param of this.parameters) {
      const option = interaction.options.get(param.name);
      const value = option?.value;

      if (param.required && (value === undefined || value === null)) {
        return {
          valid: false,
          error: `Parameter '${param.name}' is required`,
        };
      }

      if (value !== undefined && value !== null) {
        const validator = ParameterValidators[param.type];
        if (validator && !validator(value, param.validation)) {
          return {
            valid: false,
            error: `Parameter '${param.name}' is invalid`,
          };
        }
        params[param.name] = value;
      }
    }

    return { valid: true, params };
  }
}

export function createStandardCommand(config: CommandConfig): {
  data: CommandConfig['data'];
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
} {
  const template = new CommandTemplate(config);

  return {
    data: config.data,
    execute: async (interaction: ChatInputCommandInteraction): Promise<void> => {
      await template.execute(interaction);
    },
  };
}