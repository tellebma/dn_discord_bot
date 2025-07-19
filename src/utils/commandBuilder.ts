import { SlashCommandBuilder } from 'discord.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { CommandParameter, ParameterChoice, BotCommand } from '@/types/bot';

interface JsonCommandConfig {
  name: string;
  description: string;
  options?: CommandParameter[];
}

export class CommandBuilder {
  public static buildFromJson(jsonConfig: JsonCommandConfig): SlashCommandBuilder {
    if (!jsonConfig.name || !jsonConfig.description) {
      throw new Error('Command JSON must have name and description');
    }

    const builder = new SlashCommandBuilder()
      .setName(jsonConfig.name)
      .setDescription(jsonConfig.description);

    if (jsonConfig.options) {
      jsonConfig.options.forEach(option => {
        this.addOption(builder, option);
      });
    }

    return builder;
  }

  private static addOption(builder: SlashCommandBuilder, option: CommandParameter): void {
    const { type, name, description, required = false, choices } = option;

    switch (type) {
      case 'string':
        builder.addStringOption(opt => {
          opt.setName(name).setDescription(description).setRequired(required);
          if (choices) {
            choices.forEach((choice: ParameterChoice) => {
              opt.addChoices({ name: choice.name, value: choice.value as string });
            });
          }
          return opt;
        });
        break;
      case 'integer':
        builder.addIntegerOption(opt =>
          opt.setName(name).setDescription(description).setRequired(required)
        );
        break;
      case 'number':
        builder.addNumberOption(opt =>
          opt.setName(name).setDescription(description).setRequired(required)
        );
        break;
      case 'boolean':
        builder.addBooleanOption(opt =>
          opt.setName(name).setDescription(description).setRequired(required)
        );
        break;
      case 'user':
        builder.addUserOption(opt =>
          opt.setName(name).setDescription(description).setRequired(required)
        );
        break;
      case 'channel':
        builder.addChannelOption(opt =>
          opt.setName(name).setDescription(description).setRequired(required)
        );
        break;
      case 'role':
        builder.addRoleOption(opt =>
          opt.setName(name).setDescription(description).setRequired(required)
        );
        break;
      case 'mentionable':
        builder.addMentionableOption(opt =>
          opt.setName(name).setDescription(description).setRequired(required)
        );
        break;
      case 'attachment':
        builder.addAttachmentOption(opt =>
          opt.setName(name).setDescription(description).setRequired(required)
        );
        break;
      default:
        throw new Error(`Unknown option type: ${type}`);
    }
  }

  public static async loadCommandFromFiles(
    commandName: string,
    commandsDir: string
  ): Promise<BotCommand> {
    const jsPath = join(commandsDir, `${commandName}.ts`);
    const jsonPath = join(commandsDir, `${commandName}-command.json`);

    if (!existsSync(jsPath)) {
      throw new Error(`Command file not found: ${jsPath}`);
    }

    let jsonConfig: JsonCommandConfig | null = null;
    if (existsSync(jsonPath)) {
      const jsonContent = readFileSync(jsonPath, 'utf8');
      jsonConfig = JSON.parse(jsonContent) as JsonCommandConfig;
    }

    const commandModule = await import(jsPath);
    const command = commandModule.default || commandModule;

    if (jsonConfig && !command.data) {
      command.data = this.buildFromJson(jsonConfig);
    }

    return command as BotCommand;
  }
}