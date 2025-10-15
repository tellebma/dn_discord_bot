import { SlashCommandBuilder } from 'discord.js';
import { creerCommandeStandard } from '@/utils/commandTemplate';
import type { ChatInputCommandInteraction } from 'discord.js';

/**
 * Commande echo pour répéter un message
 */
const donneesCommande = new SlashCommandBuilder()
  .setName('echo')
  .setDescription('Répéter un message')
  .addStringOption((option: any) =>
    option
      .setName('message')
      .setDescription('Le message à répéter')
      .setRequired(true)
      .setMaxLength(2000)
  )
  .addBooleanOption((option: any) =>
    option.setName('ephemere').setDescription('Si la réponse doit être privée').setRequired(false)
  );

export default creerCommandeStandard({
  nom: 'echo',
  description: 'Répéter un message',
  categorie: 'utilitaire',
  permissions: [],
  delaiAttente: 2,
  data: donneesCommande as any,
  parametres: [
    {
      type: 'string',
      nom: 'message',
      name: 'message',
      description: 'Le message à répéter',
      requis: true,
      required: true,
      validation: {
        longueurMin: 1,
        longueurMax: 2000,
      },
    },
    {
      type: 'boolean',
      nom: 'ephemere',
      name: 'ephemere',
      description: 'Si la réponse doit être privée',
      requis: false,
      required: false,
    },
  ],
  gestionnaire: async (
    interaction: ChatInputCommandInteraction,
    params: Record<string, any>
  ): Promise<void> => {
    const message = params.message as string;
    const ephemere = (params.ephemere as boolean) ?? false;

    // Filtrage de contenu basique - empêche les mentions @everyone/@here
    const messageFiltre = message
      .replace(/@everyone/gi, '@\u200Beveryone')
      .replace(/@here/gi, '@\u200Bhere');

    await interaction.reply({
      content: `📢 ${messageFiltre}`,
      ephemeral: ephemere,
      allowedMentions: { parse: [] }, // Empêche toutes les mentions pour la sécurité
    });
  },
});
