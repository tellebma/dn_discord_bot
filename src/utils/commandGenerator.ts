import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { CommandParameter, ParameterChoice } from '@/types/bot';

export interface CommandGeneratorOptions {
  description?: string;
  category?: string;
  parameters?: CommandParameter[];
  permissions?: string[];
  cooldown?: number;
  useTemplate?: boolean;
}

export interface GeneratedCommandContent {
  ts: string;
  json: string;
}

export class CommandGenerator {
  public static generateCommand(
    name: string,
    options: CommandGeneratorOptions = {}
  ): GeneratedCommandContent {
    const {
      description = 'A new command',
      category = 'general',
      parameters = [],
      permissions = [],
      cooldown = 0,
      useTemplate = true,
    } = options;

    const tsContent = useTemplate
      ? this.generateTemplateCommand(name, description, category, parameters, permissions, cooldown)
      : this.generateBasicCommand(name, description, parameters);

    const jsonContent = this.generateJsonConfig(name, description, parameters);

    return {
      ts: tsContent,
      json: jsonContent,
    };
  }

  private static generateTemplateCommand(
    name: string,
    description: string,
    category: string,
    parameters: CommandParameter[],
    permissions: string[],
    cooldown: number
  ): string {
    const paramsArray = parameters
      .map(p => JSON.stringify(p, null, 4))
      .join(',\\n        ');
    const permsArray = permissions.map(p => `'${p}'`).join(', ');

    return `import { SlashCommandBuilder } from 'discord.js';
import { createStandardCommand } from '@/utils/commandTemplate';
import type { ChatInputCommandInteraction } from 'discord.js';

const commandData = new SlashCommandBuilder()
  .setName('${name}')
  .setDescription('${description}')${this.generateSlashCommandOptions(parameters)};

export default createStandardCommand({
  name: '${name}',
  description: '${description}',
  category: '${category}',
  permissions: [${permsArray}],
  cooldown: ${cooldown},
  data: commandData,
  parameters: [
    ${paramsArray}
  ],
  handler: async (interaction: ChatInputCommandInteraction, params: Record<string, any>): Promise<void> => {
    // TODO: Implement command logic here
    await interaction.reply({
      content: \`Hello! This is the ${name} command.\`,
      ephemeral: false,
    });
  },
});`;
  }

  private static generateBasicCommand(
    name: string,
    description: string,
    parameters: CommandParameter[]
  ): string {
    return `import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('${name}')
    .setDescription('${description}')${this.generateSlashCommandOptions(parameters)},
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // TODO: Implement command logic here
    await interaction.reply({
      content: \`Hello! This is the ${name} command.\`,
      ephemeral: false,
    });
  },
};`;
  }

  private static generateSlashCommandOptions(parameters: CommandParameter[]): string {
    if (!parameters || parameters.length === 0) return '';

    return parameters
      .map(param => {
        const required = param.required ? '.setRequired(true)' : '';
        const choices = param.choices
          ? param.choices
              .map(
                (choice: ParameterChoice) =>
                  `.addChoices({ name: '${choice.name}', value: '${choice.value}' })`
              )
              .join('')
          : '';

        switch (param.type) {
          case 'string':
            return `\\n    .addStringOption(option => option.setName('${param.name}').setDescription('${param.description}')${required}${choices})`;
          case 'integer':
            return `\\n    .addIntegerOption(option => option.setName('${param.name}').setDescription('${param.description}')${required})`;
          case 'number':
            return `\\n    .addNumberOption(option => option.setName('${param.name}').setDescription('${param.description}')${required})`;
          case 'boolean':
            return `\\n    .addBooleanOption(option => option.setName('${param.name}').setDescription('${param.description}')${required})`;
          case 'user':
            return `\\n    .addUserOption(option => option.setName('${param.name}').setDescription('${param.description}')${required})`;
          case 'channel':
            return `\\n    .addChannelOption(option => option.setName('${param.name}').setDescription('${param.description}')${required})`;
          case 'role':
            return `\\n    .addRoleOption(option => option.setName('${param.name}').setDescription('${param.description}')${required})`;
          case 'mentionable':
            return `\\n    .addMentionableOption(option => option.setName('${param.name}').setDescription('${param.description}')${required})`;
          case 'attachment':
            return `\\n    .addAttachmentOption(option => option.setName('${param.name}').setDescription('${param.description}')${required})`;
          default:
            return '';
        }
      })
      .join('');
  }

  private static generateJsonConfig(
    name: string,
    description: string,
    parameters: CommandParameter[]
  ): string {
    return JSON.stringify(
      {
        name,
        description,
        options: parameters.map(param => ({
          type: param.type,
          name: param.name,
          description: param.description,
          required: param.required ?? false,
          ...(param.choices && { choices: param.choices }),
        })),
      },
      null,
      2
    );
  }

  public static saveCommand(
    name: string,
    content: GeneratedCommandContent,
    outputDir: string
  ): { tsPath: string; jsonPath: string } {
    const tsPath = join(outputDir, `${name}.ts`);
    const jsonPath = join(outputDir, `${name}-command.json`);

    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    writeFileSync(tsPath, content.ts);
    writeFileSync(jsonPath, content.json);

    return { tsPath, jsonPath };
  }

  public static createCommandInteractive(): {
    prompt: string;
    example: string;
  } {
    return {
      prompt: 'Use this generator programmatically or extend with inquirer for interactive CLI',
      example: `
// Example usage:
import { CommandGenerator } from '@/utils/commandGenerator';

const commandContent = CommandGenerator.generateCommand('greet', {
  description: 'Greet a user',
  parameters: [
    {
      type: 'user',
      name: 'target',
      description: 'User to greet',
      required: true,
    },
    {
      type: 'string',
      name: 'message',
      description: 'Custom greeting message',
      required: false,
    },
  ],
  cooldown: 5,
});

CommandGenerator.saveCommand('greet', commandContent, './src/commands');
      `,
    };
  }
}