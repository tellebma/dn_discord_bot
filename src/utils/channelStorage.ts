import fs from 'fs';
import path from 'path';

const FICHIER_CONFIG_CANAL = path.join(process.cwd(), 'data', 'channelConfig.json');

/**
 * Configuration du canal pour les plans hebdomadaires
 */
interface ConfigCanal {
  canalId: string | null;
  configureLe: Date | null;
  configurePar: string | null;
}

/**
 * Gestionnaire de stockage pour la configuration du canal
 * Permet de persister le canal configuré entre les redémarrages
 */
export class StockageCanal {
  private static instance: StockageCanal;
  private config: ConfigCanal;

  private constructor() {
    this.config = this.chargerConfig();
  }

  /**
   * Récupère l'instance unique du gestionnaire
   */
  public static getInstance(): StockageCanal {
    if (!StockageCanal.instance) {
      StockageCanal.instance = new StockageCanal();
    }
    return StockageCanal.instance;
  }

  /**
   * Charge la configuration depuis le fichier
   */
  private chargerConfig(): ConfigCanal {
    try {
      if (fs.existsSync(FICHIER_CONFIG_CANAL)) {
        const donnees = fs.readFileSync(FICHIER_CONFIG_CANAL, 'utf-8');
        const config = JSON.parse(donnees);
        return {
          canalId: config.canalId || null,
          configureLe: config.configureLe ? new Date(config.configureLe) : null,
          configurePar: config.configurePar || null,
        };
      }
    } catch (erreur) {
      console.error('Erreur lors du chargement de la configuration du canal :', erreur);
    }

    return {
      canalId: null,
      configureLe: null,
      configurePar: null,
    };
  }

  /**
   * Sauvegarde la configuration dans le fichier
   */
  private sauvegarderConfig(): void {
    try {
      const repertoire = path.dirname(FICHIER_CONFIG_CANAL);
      if (!fs.existsSync(repertoire)) {
        fs.mkdirSync(repertoire, { recursive: true });
      }
      fs.writeFileSync(FICHIER_CONFIG_CANAL, JSON.stringify(this.config, null, 2));
      console.log(`✅ Configuration du canal sauvegardée : ${this.config.canalId}`);
    } catch (erreur) {
      console.error('Erreur lors de la sauvegarde de la configuration du canal :', erreur);
    }
  }

  /**
   * Définit le canal pour les plans hebdomadaires
   */
  public definirCanal(canalId: string, utilisateurId: string): void {
    this.config = {
      canalId,
      configureLe: new Date(),
      configurePar: utilisateurId,
    };
    this.sauvegarderConfig();
  }

  /**
   * Récupère l'ID du canal configuré
   */
  public obtenirCanalId(): string | null {
    return this.config.canalId;
  }

  /**
   * Récupère la configuration complète
   */
  public obtenirConfig(): ConfigCanal {
    return { ...this.config };
  }

  /**
   * Supprime la configuration du canal
   */
  public supprimerCanal(): void {
    this.config = {
      canalId: null,
      configureLe: null,
      configurePar: null,
    };
    this.sauvegarderConfig();
  }
}
