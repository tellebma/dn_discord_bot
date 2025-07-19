import { SlashCommandBuilder } from 'discord.js';
import { createStandardCommand } from '@/utils/commandTemplate';
import type { ChatInputCommandInteraction } from 'discord.js';

const commandData = new SlashCommandBuilder()
  .setName('echo')
  .setDescription('Echo a message back')
  .addStringOption(option =>
    option
      .setName('message')
      .setDescription('The message to echo')
      .setRequired(true)
      .setMaxLength(2000)
  )
  .addBooleanOption(option =>
    option
      .setName('ephemeral')
      .setDescription('Whether the response should be private')
      .setRequired(false)
  );

export default createStandardCommand({
  name: 'echo',
  description: 'Echo a message back',
  category: 'utility',
  permissions: [],
  cooldown: 2,
  data: commandData,
  parameters: [
    {
      type: 'string',
      name: 'message',
      description: 'The message to echo',
      required: true,
      validation: {
        minLength: 1,
        maxLength: 2000,
      },
    },
    {
      type: 'boolean',
      name: 'ephemeral',
      description: 'Whether the response should be private',
      required: false,
    },
  ],
  handler: async (
    interaction: ChatInputCommandInteraction,
    params: Record<string, any>
  ): Promise<void> => {
    const message = params.message as string;
    const ephemeral = (params.ephemeral as boolean) ?? false;

    // Basic content filtering - prevent @everyone/@here mentions
    const filteredMessage = message
      .replace(/@everyone/gi, '@\\u200Beveryone')
      .replace(/@here/gi, '@\\u200Bhere');

    await interaction.reply({
      content: `📢 ${filteredMessage}`,
      ephemeral: ephemeral,
      allowedMentions: { parse: [] }, // Prevent all mentions for safety
    });
  },
});