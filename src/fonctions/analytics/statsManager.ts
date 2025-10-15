import { GestionnairePoolJeux } from '@/fonctions/database/gamePool';
import { GestionnaireActivitesExtras } from '@/fonctions/database/extraActivities';
import { ClientSteam } from '@/fonctions/external/steamAPI';
import { ClientTwitch } from '@/fonctions/external/twitchAPI';
import { ClientRAWG } from '@/fonctions/external/rawgAPI';
import { StatistiquesGenerales, StatistiquesJeux, TendanceExterne, DonneesStatistiques } from '@/types/stats';
import fs from 'fs';
import path from 'path';

const FICHIER_STATS = path.join(process.cwd(), 'data', 'statistics.json');

/**
 * Gestionnaire de statistiques du bot
 */
export class GestionnaireStatistiques {
  private static instance: GestionnaireStatistiques;
  private stats: DonneesStatistiques;

  private constructor() {
    this.stats = this.chargerStats();
  }

  public static getInstance(): GestionnaireStatistiques {
    if (!GestionnaireStatistiques.instance) {
      GestionnaireStatistiques.instance = new GestionnaireStatistiques();
    }
    return GestionnaireStatistiques.instance;
  }

  private chargerStats(): DonneesStatistiques {
    try {
      if (fs.existsSync(FICHIER_STATS)) {
        const donnees = JSON.parse(fs.readFileSync(FICHIER_STATS, 'utf-8'));
        return {
          jeuxSelectionnes: donnees.jeuxSelectionnes || {},
          participations: donnees.participations || {},
          votesCasts: donnees.votesCasts || {},
          derniereMAJ: new Date(donnees.derniereMAJ || Date.now())
        };
      }
    } catch (erreur) {
      console.error('Erreur chargement stats :', erreur);
    }

    return {
      jeuxSelectionnes: {},
      participations: {},
      votesCasts: {},
      derniereMAJ: new Date()
    };
  }

  private sauvegarderStats(): void {
    try {
      const dir = path.dirname(FICHIER_STATS);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const donnees = {
        ...this.stats,
        derniereMAJ: new Date()
      };

      fs.writeFileSync(FICHIER_STATS, JSON.stringify(donnees, null, 2));
    } catch (erreur) {
      console.error('Erreur sauvegarde stats :', erreur);
    }
  }

  /**
   * Enregistre la sélection d'un jeu dans un plan
   */
  public enregistrerSelectionJeu(idJeu: string): void {
    this.stats.jeuxSelectionnes[idJeu] = (this.stats.jeuxSelectionnes[idJeu] || 0) + 1;
    this.sauvegarderStats();
  }

  /**
   * Enregistre un vote d'utilisateur
   */
  public enregistrerVote(idUtilisateur: string): void {
    this.stats.votesCasts[idUtilisateur] = (this.stats.votesCasts[idUtilisateur] || 0) + 1;
    this.sauvegarderStats();
  }

  /**
   * Récupère les statistiques générales
   */
  public obtenirStatsGenerales(): StatistiquesGenerales {
    const gestionnaireJeux = GestionnairePoolJeux.getInstance();
    const gestionnaireActivites = GestionnaireActivitesExtras.getInstance();

    const jeux = gestionnaireJeux.obtenirJeux();
    const activites = gestionnaireActivites.obtenirActivites();

    // Top jeux les plus sélectionnés
    const topJeux = Object.entries(this.stats.jeuxSelectionnes)
      .map(([id, selections]) => {
        const jeu = gestionnaireJeux.trouverJeu(id);
        return jeu ? {
          id,
          nom: jeu.nom,
          selections: selections as number,
          categorie: jeu.categorie
        } : null;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.selections - a.selections)
      .slice(0, 5);

    const contributeurs = new Set(jeux.map(j => j.ajoutePar));
    const categories = new Set(jeux.map(j => j.categorie).filter(Boolean));

    return {
      totalJeux: jeux.length,
      totalActivites: activites.length,
      plansGeneres: this.obtenirNombrePlans(),
      contributeurs: contributeurs.size,
      categories: categories.size,
      populariteMoyenne: this.calculerPopulariteMoyenne(),
      topJeux: topJeux as any[]
    };
  }

  /**
   * Récupère les statistiques des jeux
   */
  public obtenirStatsJeux(): StatistiquesJeux {
    const gestionnaireJeux = GestionnairePoolJeux.getInstance();
    const jeux = gestionnaireJeux.obtenirJeux();

    // Répartition par catégorie
    const parCategorie = new Map<string, number>();
    jeux.forEach(jeu => {
      const cat = jeu.categorie || 'Non catégorisé';
      parCategorie.set(cat, (parCategorie.get(cat) || 0) + 1);
    });

    const total = jeux.length;
    const categories = Array.from(parCategorie.entries()).map(([cat, nb]) => ({
      categorie: cat,
      nombre: nb,
      pourcentage: Math.round((nb / total) * 100)
    }));

    // Répartition par nombre de joueurs
    const deuxJoueurs = jeux.filter(j => j.joueursMax === 2).length;
    const petitGroupe = jeux.filter(j =>
      j.joueursMax && j.joueursMax > 2 && j.joueursMax <= 4
    ).length;
    const moyenGroupe = jeux.filter(j =>
      j.joueursMax && j.joueursMax > 4 && j.joueursMax <= 8
    ).length;
    const grandGroupe = jeux.filter(j =>
      j.joueursMax && j.joueursMax > 8
    ).length;

    return {
      total,
      actifs: total,
      categories: parCategorie.size,
      parCategorie: categories,
      deuxJoueurs,
      petitGroupe,
      moyenGroupe,
      grandGroupe
    };
  }

  /**
   * Récupère les tendances de toutes les sources externes
   */
  public async obtenirTendancesExternes(): Promise<TendanceExterne[]> {
    const tendances: TendanceExterne[] = [];

    // Steam
    const clientSteam = ClientSteam.getInstance();
    if (clientSteam.estDisponible()) {
      const jeuxSteam = await clientSteam.obtenirJeuxTendance(10);
      if (jeuxSteam.length > 0) {
        tendances.push({
          source: 'steam',
          jeux: jeuxSteam,
          derniereMAJ: new Date()
        });
      }
    }

    // Twitch
    const clientTwitch = ClientTwitch.getInstance();
    if (clientTwitch.estDisponible()) {
      const jeuxTwitch = await clientTwitch.obtenirJeuxTendance(10);
      if (jeuxTwitch.length > 0) {
        tendances.push({
          source: 'twitch',
          jeux: jeuxTwitch,
          derniereMAJ: new Date()
        });
      }
    }

    // RAWG
    const clientRAWG = ClientRAWG.getInstance();
    if (clientRAWG.estDisponible()) {
      const jeuxRAWG = await clientRAWG.obtenirJeuxTendance(10);
      if (jeuxRAWG.length > 0) {
        tendances.push({
          source: 'rawg',
          jeux: jeuxRAWG,
          derniereMAJ: new Date()
        });
      }
    }

    return tendances;
  }

  private calculerPopulariteMoyenne(): number {
    const total = Object.values(this.stats.jeuxSelectionnes)
      .reduce((sum: number, count) => sum + (count as number), 0);
    const nombre = Object.keys(this.stats.jeuxSelectionnes).length;
    return nombre > 0 ? Math.round((total / nombre) * 100) / 100 : 0;
  }

  private obtenirNombrePlans(): number {
    try {
      const fichierPlans = path.join(process.cwd(), 'data', 'weeklyPlans.json');
      if (fs.existsSync(fichierPlans)) {
        const plans = JSON.parse(fs.readFileSync(fichierPlans, 'utf-8'));
        return Array.isArray(plans) ? plans.length : 0;
      }
    } catch (erreur) {
      console.error('Erreur lecture plans :', erreur);
    }
    return 0;
  }
}



