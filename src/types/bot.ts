import { Client, Collection, SlashCommandBuilder } from 'discord.js';

/** Interface représentant une commande du bot */
export interface CommandeBot {
  data: SlashCommandBuilder;
  execute: (interaction: any) => Promise<void>;
}

/** Client Discord étendu avec les commandes */
export interface ClientEtendu extends Client {
  commands: Collection<string, CommandeBot>;
}

/** Configuration d'une commande */
export interface ConfigurationCommande {
  nom: string;
  description: string;
  categorie?: string;
  permissions?: string[];
  delaiAttente?: number;
  data: SlashCommandBuilder;
  parametres?: ParametreCommande[];
  gestionnaire: GestionnaireCommande;
}

/** Paramètre d'une commande */
export interface ParametreCommande {
  type: TypeParametre;
  nom: string;
  name: string; // Alias en anglais
  description: string;
  requis?: boolean;
  required?: boolean; // Alias en anglais
  choix?: ChoixParametre[];
  choices?: ChoixParametre[]; // Alias en anglais
  validation?: ValidationParametre;
}

/** Choix disponible pour un paramètre */
export interface ChoixParametre {
  nom: string;
  name: string; // Alias en anglais
  valeur: string | number;
  value: string | number; // Alias en anglais
}

/** Règles de validation d'un paramètre */
export interface ValidationParametre {
  longueurMin?: number;
  longueurMax?: number;
  min?: number;
  max?: number;
  modele?: RegExp;
}

/** Types de paramètres supportés */
export type TypeParametre =
  | 'string'
  | 'integer'
  | 'number'
  | 'boolean'
  | 'user'
  | 'channel'
  | 'role'
  | 'mentionable'
  | 'attachment';

/** Type du gestionnaire de commande */
export type GestionnaireCommande = (interaction: any, params: Record<string, any>) => Promise<void>;

/** Contexte de log */
export interface ContexteLog {
  [cle: string]: any;
}

/** Configuration de l'application */
export interface TypeConfiguration {
  discord: {
    token: string;
    clientId: string;
  };
  bot: {
    estDeveloppement: boolean;
  };
}

/** Résultat de validation */
export interface ResultatValidation {
  valide: boolean;
  params?: Record<string, any>;
  erreur?: string;
}

/** Validateur de paramètre */
export interface ValidateurParametre {
  (valeur: any, options?: any): boolean;
}

/** Délai d'attente pour une commande */
export interface DelaiAttenteCommande {
  idUtilisateur: string;
  nomCommande: string;
  horodatage: number;
}

/** Alias pour compatibilité avec les anciens noms */
export type CommandParameter = ParametreCommande;
export type ParameterChoice = ChoixParametre;
export type BotCommand = CommandeBot;
