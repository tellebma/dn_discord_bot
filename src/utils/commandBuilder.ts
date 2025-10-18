/**
 * Constructeur de commandes
 */
import { SlashCommandBuilder } from 'discord.js';

export class ConstructeurCommande {
  public static creerCommande(nom: string, description: string): SlashCommandBuilder {
    return new SlashCommandBuilder()
      .setName(nom)
      .setDescription(description);
  }

  public static ajouterOptionString(commande: SlashCommandBuilder, nom: string, description: string, requis: boolean = false): SlashCommandBuilder {
    commande.addStringOption(option =>
      option
        .setName(nom)
        .setDescription(description)
        .setRequired(requis)
    );
    return commande;
  }

  public static ajouterOptionBoolean(commande: SlashCommandBuilder, nom: string, description: string, requis: boolean = false): SlashCommandBuilder {
    commande.addBooleanOption(option =>
      option
        .setName(nom)
        .setDescription(description)
        .setRequired(requis)
    );
    return commande;
  }

  public static ajouterOptionInteger(commande: SlashCommandBuilder, nom: string, description: string, requis: boolean = false): SlashCommandBuilder {
    commande.addIntegerOption(option =>
      option
        .setName(nom)
        .setDescription(description)
        .setRequired(requis)
    );
    return commande;
  }
}
