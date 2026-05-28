import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';

/**
 * Commande echo pour répéter un message
 */
export const data = new SlashCommandBuilder()
  .setName('echo')
  .setDescription('Répéter un message')
  .addStringOption(option =>
    option
      .setName('message')
      .setDescription('Le message à répéter')
      .setRequired(true)
      .setMaxLength(2000)
  )
  .addBooleanOption(option =>
    option.setName('ephemere').setDescription('Si la réponse doit être privée').setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const message = interaction.options.getString('message', true);
  const ephemere = interaction.options.getBoolean('ephemere') ?? false;

  // Filtrage de contenu basique - empêche les mentions @everyone/@here
  const messageFiltre = message
    .replace(/@everyone/gi, '@\u200Beveryone')
    .replace(/@here/gi, '@\u200Bhere');

  await interaction.reply({
    content: `📢 ${messageFiltre}`,
    flags: ephemere ? MessageFlags.Ephemeral : undefined,
    allowedMentions: { parse: [] }, // Empêche toutes les mentions pour la sécurité
  });
}
