import type {
  ConfigurationCommande,
  ParametreCommande,
  ResultatValidation,
  ValidateurParametre,
  ContexteLog,
} from '@/types/bot';
import { Journaliseur } from '@/utils/logger';
import type { ChatInputCommandInteraction, PermissionResolvable } from 'discord.js';

/**
 * Validateurs pour les différents types de paramètres
 */
export const ValidateursParametres: Record<string, ValidateurParametre> = {
  string: (valeur: any, options: any = {}): boolean => {
    if (typeof valeur !== 'string') return false;
    if (options.longueurMin && valeur.length < options.longueurMin) return false;
    if (options.longueurMax && valeur.length > options.longueurMax) return false;
    if (options.modele && !options.modele.test(valeur)) return false;
    return true;
  },

  integer: (valeur: any, options: any = {}): boolean => {
    if (!Number.isInteger(valeur)) return false;
    if (options.min !== undefined && valeur < options.min) return false;
    if (options.max !== undefined && valeur > options.max) return false;
    return true;
  },

  number: (valeur: any, options: any = {}): boolean => {
    if (typeof valeur !== 'number' || isNaN(valeur)) return false;
    if (options.min !== undefined && valeur < options.min) return false;
    if (options.max !== undefined && valeur > options.max) return false;
    return true;
  },

  boolean: (valeur: any): boolean => typeof valeur === 'boolean',

  user: (valeur: any): boolean => valeur && typeof valeur === 'object' && valeur.id,

  channel: (valeur: any): boolean => valeur && typeof valeur === 'object' && valeur.id,

  role: (valeur: any): boolean => valeur && typeof valeur === 'object' && valeur.id,

  mentionable: (valeur: any): boolean => valeur && typeof valeur === 'object' && valeur.id,

  attachment: (valeur: any): boolean => valeur && typeof valeur === 'object' && valeur.url,
};

/**
 * Template de commande avec gestion automatique des validations et des délais d'attente
 */
export class TemplateCommande {
  public readonly nom: string;
  public readonly description: string;
  public readonly categorie: string;
  public readonly permissions: string[];
  public readonly delaiAttente: number;
  public readonly parametres: ParametreCommande[];
  private readonly gestionnaire: ConfigurationCommande['gestionnaire'];
  private static delaisAttente = new Map<string, number>();

  constructor(config: ConfigurationCommande) {
    this.nom = config.nom;
    this.description = config.description;
    this.categorie = config.categorie ?? 'general';
    this.permissions = config.permissions ?? [];
    this.delaiAttente = config.delaiAttente ?? 0;
    this.parametres = config.parametres ?? [];
    this.gestionnaire = config.gestionnaire;

    if (!this.nom || !this.description || !this.gestionnaire) {
      throw new Error(
        'Le template de commande nécessite un nom, une description et un gestionnaire'
      );
    }
  }

  /**
   * Exécute la commande avec validations et gestion d'erreurs
   */
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const tempsDebut = Date.now();

    try {
      Journaliseur.info(`Commande exécutée : ${this.nom}`, {
        commande: this.nom,
        utilisateur: interaction.user.tag,
        serveur: interaction.guild?.name ?? 'MP',
        canal: interaction.channel?.id ?? 'MP',
      } as ContexteLog);

      if (!this.validerPermissions(interaction)) {
        await interaction.reply({
          content: "❌ Vous n'avez pas la permission d'utiliser cette commande.",
          ephemeral: true,
        });
        return;
      }

      if (!this.verifierDelaiAttente(interaction)) {
        await interaction.reply({
          content: "⏱️ Veuillez patienter avant d'utiliser cette commande à nouveau.",
          ephemeral: true,
        });
        return;
      }

      const paramsValides = this.validerParametres(interaction);
      if (!paramsValides.valide) {
        await interaction.reply({
          content: `❌ Paramètres invalides : ${paramsValides.erreur ?? 'Erreur inconnue'}`,
          ephemeral: true,
        });
        return;
      }

      await this.gestionnaire(interaction, paramsValides.params ?? {});

      const tempsExecution = Date.now() - tempsDebut;
      Journaliseur.info(`Commande terminée : ${this.nom}`, {
        commande: this.nom,
        tempsExecution: `${tempsExecution}ms`,
        succes: true,
      } as ContexteLog);
    } catch (erreur) {
      const tempsExecution = Date.now() - tempsDebut;
      const messageErreur = erreur instanceof Error ? erreur.message : 'Erreur inconnue';
      const pileErreur = erreur instanceof Error ? erreur.stack : undefined;

      Journaliseur.error(`Erreur de commande : ${this.nom}`, {
        commande: this.nom,
        erreur: messageErreur,
        pile: pileErreur,
        tempsExecution: `${tempsExecution}ms`,
        succes: false,
      } as ContexteLog);

      const messageReponse = {
        content: "❌ Une erreur s'est produite lors de l'exécution de cette commande.",
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(messageReponse);
      } else {
        await interaction.reply(messageReponse);
      }
    }
  }

  /**
   * Valide les permissions de l'utilisateur
   */
  private validerPermissions(interaction: ChatInputCommandInteraction): boolean {
    if (this.permissions.length === 0) return true;

    if (!interaction.member || !('permissions' in interaction.member)) return false;

    return this.permissions.every(permission =>
      interaction.member?.permissions?.has(permission as PermissionResolvable)
    );
  }

  /**
   * Vérifie le délai d'attente (cooldown)
   */
  private verifierDelaiAttente(interaction: ChatInputCommandInteraction): boolean {
    if (this.delaiAttente === 0) return true;

    const cleDelai = `${this.nom}_${interaction.user.id}`;
    const derniereUtilisation = TemplateCommande.delaisAttente.get(cleDelai) ?? 0;
    const maintenant = Date.now();

    if (maintenant - derniereUtilisation < this.delaiAttente * 1000) {
      return false;
    }

    TemplateCommande.delaisAttente.set(cleDelai, maintenant);
    return true;
  }

  /**
   * Valide les paramètres de la commande
   */
  private validerParametres(interaction: ChatInputCommandInteraction): ResultatValidation {
    const params: Record<string, any> = {};

    for (const param of this.parametres) {
      const option = interaction.options.get(param.nom);
      const valeur = option?.value;

      if (param.requis && (valeur === undefined || valeur === null)) {
        return {
          valide: false,
          erreur: `Le paramètre '${param.nom}' est requis`,
        };
      }

      if (valeur !== undefined && valeur !== null) {
        const validateur = ValidateursParametres[param.type];
        if (validateur && !validateur(valeur, param.validation)) {
          return {
            valide: false,
            erreur: `Le paramètre '${param.nom}' est invalide`,
          };
        }
        params[param.nom] = valeur;
      }
    }

    return { valide: true, params };
  }
}

/**
 * Crée une commande standardisée avec toutes les validations
 */
export function creerCommandeStandard(config: ConfigurationCommande): {
  data: ConfigurationCommande['data'];
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
} {
  const template = new TemplateCommande(config);

  return {
    data: config.data,
    execute: async (interaction: ChatInputCommandInteraction): Promise<void> => {
      await template.execute(interaction);
    },
  };
}
