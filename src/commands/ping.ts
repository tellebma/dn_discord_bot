import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';

/**
 * Commande ping pour vérifier la latence du bot
 */
export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Répond Pong ! et affiche la latence du bot'),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const envoye = await interaction.reply({
      content: 'Calcul de la latence...',
      fetchReply: true,
    });

    const latence = envoye.createdTimestamp - interaction.createdTimestamp;
    const latenceApi = Math.round(interaction.client.ws.ping);

    await interaction.editReply(
      `🏓 Pong !\n` +
      `📡 Latence : ${latence}ms\n` +
      `💓 Latence API : ${latenceApi}ms`
    );
  },
};
