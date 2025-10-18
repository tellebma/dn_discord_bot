/**
 * Générateur de commandes
 */
import { SlashCommandBuilder } from 'discord.js';

export function genererCommande(nom: string, description: string, options: any[] = []) {
  const commande = new SlashCommandBuilder().setName(nom).setDescription(description);

  options.forEach(option => {
    switch (option.type) {
      case 'string':
        commande.addStringOption(opt =>
          opt
            .setName(option.name)
            .setDescription(option.description)
            .setRequired(option.required || false)
        );
        break;
      case 'boolean':
        commande.addBooleanOption(opt =>
          opt
            .setName(option.name)
            .setDescription(option.description)
            .setRequired(option.required || false)
        );
        break;
      case 'integer':
        commande.addIntegerOption(opt =>
          opt
            .setName(option.name)
            .setDescription(option.description)
            .setRequired(option.required || false)
        );
        break;
    }
  });

  return commande;
}
