import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import { GestionnairePoolJeux } from '@/fonctions/database/gamePool';
import { GestionnaireActivitesExtras } from '@/fonctions/database/extraActivities';
import { StockageCanal } from '@/utils/channelStorage';
import { PlanHebdomadaire } from '@/types/game';
import fs from 'fs';
import path from 'path';

const FICHIER_PLANS_HEBDO = path.join(process.cwd(), 'data', 'weeklyPlans.json');

/**
 * Planificateur hebdomadaire
 * Gère la génération automatique et l'envoi des plans de jeux hebdomadaires
 */
export class PlanificateurHebdomadaire {
  private static instance: PlanificateurHebdomadaire;
  private client: Client;
  private idCanal: string | null = null;
  private estPlanifie = false;
  private stockageCanal: StockageCanal;

  private constructor(client: Client) {
    this.client = client;
    this.stockageCanal = StockageCanal.getInstance();
    // Charge le canal depuis le stockage persistant
    this.idCanal = this.stockageCanal.obtenirCanalId();
  }

  /**
   * Récupère l'instance unique du planificateur
   */
  public static getInstance(client: Client): PlanificateurHebdomadaire {
    if (!PlanificateurHebdomadaire.instance) {
      PlanificateurHebdomadaire.instance = new PlanificateurHebdomadaire(client);
    }
    return PlanificateurHebdomadaire.instance;
  }

  /**
   * Définit le canal où poster les plans hebdomadaires
   */
  public definirCanal(idCanal: string, utilisateurId: string): void {
    this.idCanal = idCanal;
    this.stockageCanal.definirCanal(idCanal, utilisateurId);
  }

  /**
   * Démarre la planification automatique des publications
   */
  public demarrerPlanificateur(): void {
    if (this.estPlanifie) return;

    this.estPlanifie = true;
    this.planifierPublicationsHebdomadaires();
  }

  /**
   * Planifie les publications pour chaque lundi
   */
  private planifierPublicationsHebdomadaires(): void {
    const maintenant = new Date();
    const prochainLundi = this.obtenirProchainLundi(maintenant);
    const tempsJusquaLundi = prochainLundi.getTime() - maintenant.getTime();

    setTimeout(() => {
      this.envoyerPlanHebdomadaire();
      setInterval(
        () => {
          this.envoyerPlanHebdomadaire();
        },
        7 * 24 * 60 * 60 * 1000
      ); // Tous les 7 jours
    }, tempsJusquaLundi);
  }

  /**
   * Calcule la date du prochain lundi à 10h
   */
  private obtenirProchainLundi(depuis: Date): Date {
    const date = new Date(depuis);
    const jour = date.getDay();
    const joursJusquaLundi = jour === 0 ? 1 : 8 - jour; // Si dimanche (0), le prochain lundi est dans 1 jour

    date.setDate(date.getDate() + joursJusquaLundi);
    date.setHours(10, 0, 0, 0); // 10h du matin le lundi

    return date;
  }

  /**
   * Envoie le plan hebdomadaire dans le canal configuré
   */
  public async envoyerPlanHebdomadaire(): Promise<void> {
    if (!this.idCanal) {
      console.error('Aucun canal défini pour les plans hebdomadaires');
      return;
    }

    try {
      const canal = (await this.client.channels.fetch(this.idCanal)) as TextChannel;
      if (!canal) {
        console.error('Canal introuvable pour les plans hebdomadaires');
        return;
      }

      const planHebdo = this.genererPlanHebdomadaire();
      const embed = this.creerEmbedPlanHebdo(planHebdo);

      await canal.send({ embeds: [embed] });
      this.sauvegarderPlanHebdo(planHebdo);

      console.log('Plan hebdomadaire envoyé avec succès');
    } catch (erreur) {
      console.error("Erreur lors de l'envoi du plan hebdomadaire :", erreur);
    }
  }

  /**
   * Génère un nouveau plan hebdomadaire avec jeux et activités
   */
  private genererPlanHebdomadaire(): PlanHebdomadaire {
    const gestionnaireJeux = GestionnairePoolJeux.getInstance();
    const gestionnaireActivites = GestionnaireActivitesExtras.getInstance();

    const tousLesJeux = gestionnaireJeux.obtenirJeux();
    const nombreJeux = Math.min(5, tousLesJeux.length); // Jusqu'à 5 jeux par semaine
    const jeuxSelectionnes = gestionnaireJeux.obtenirJeuxAleatoires(nombreJeux);

    // Récupère toutes les activités actives pour la semaine
    const activitesExtras = gestionnaireActivites.obtenirActivitesActives();

    const chaineSemaine = this.obtenirChaineSemaine(new Date());

    return {
      semaine: chaineSemaine,
      jeux: jeuxSelectionnes,
      activitesExtras,
      genereLe: new Date(),
    };
  }

  /**
   * Génère la chaîne représentant la semaine (lundi à dimanche)
   */
  private obtenirChaineSemaine(date: Date): string {
    const debutSemaine = new Date(date);
    const jour = debutSemaine.getDay();
    const diff = debutSemaine.getDate() - jour + (jour === 0 ? -6 : 1); // Ajustement si dimanche
    debutSemaine.setDate(diff);

    const finSemaine = new Date(debutSemaine);
    finSemaine.setDate(debutSemaine.getDate() + 6);

    return `${debutSemaine.toLocaleDateString('fr-FR')} - ${finSemaine.toLocaleDateString('fr-FR')}`;
  }

  /**
   * Crée l'embed Discord pour le plan hebdomadaire
   */
  private creerEmbedPlanHebdo(plan: PlanHebdomadaire): EmbedBuilder {
    const gestionnaireActivites = GestionnaireActivitesExtras.getInstance();

    const embed = new EmbedBuilder()
      .setTitle('🗓️ Plan Hebdomadaire')
      .setDescription(`Plan pour la semaine : ${plan.semaine}`)
      .setColor(0x9966ff)
      .setTimestamp()
      .setFooter({ text: 'Bonne semaine à tous ! 🎮📅' });

    // Section des jeux
    if (plan.jeux.length === 0) {
      embed.addFields({
        name: '🎮 Jeux',
        value: '❌ Aucun jeu disponible. Utilisez `/addgame` pour ajouter des jeux.',
        inline: false,
      });
    } else {
      const listeJeux = plan.jeux
        .map((jeu, index) => {
          let infoJeu = `**${index + 1}. ${jeu.nom}**`;
          if (jeu.description) infoJeu += `\n   ${jeu.description}`;

          if (jeu.joueursMin || jeu.joueursMax) {
            const joueurs =
              jeu.joueursMin && jeu.joueursMax
                ? `${jeu.joueursMin}-${jeu.joueursMax}`
                : jeu.joueursMin
                  ? `${jeu.joueursMin}+`
                  : `jusqu'à ${jeu.joueursMax}`;
            infoJeu += `\n   👥 ${joueurs} joueurs`;
          }

          if (jeu.categorie) {
            infoJeu += `\n   📂 ${jeu.categorie}`;
          }

          return infoJeu;
        })
        .join('\n\n');

      embed.addFields({
        name: `🎮 Jeux (${plan.jeux.length})`,
        value: listeJeux,
        inline: false,
      });
    }

    // Section des activités extras
    if (plan.activitesExtras.length === 0) {
      embed.addFields({
        name: '📅 Activités Extras',
        value: '❌ Aucune activité extra planifiée. Utilisez `/addactivity` pour en ajouter.',
        inline: false,
      });
    } else {
      // Groupe les activités par jour
      const activitesParJour: { [cle: number]: any[] } = {};
      plan.activitesExtras.forEach(activite => {
        if (!activitesParJour[activite.jourSemaine]) {
          activitesParJour[activite.jourSemaine] = [];
        }
        activitesParJour[activite.jourSemaine].push(activite);
      });

      const joursTries = Object.keys(activitesParJour).map(Number).sort();
      const texteActivites = joursTries
        .map(jourSemaine => {
          const nomJour = gestionnaireActivites.obtenirNomJour(jourSemaine);
          const activitesJour = activitesParJour[jourSemaine];

          const listeActivites = activitesJour
            .map(activite => {
              let info = `**${activite.nom}**`;
              if (activite.heure) info += ` • ${activite.heure}`;
              if (activite.lieu) info += ` • 📍 ${activite.lieu}`;
              if (activite.description) info += `\n   ${activite.description}`;
              return info;
            })
            .join('\n');

          return `**${nomJour} :**\n${listeActivites}`;
        })
        .join('\n\n');

      embed.addFields({
        name: `📅 Activités Extras (${plan.activitesExtras.length})`,
        value: texteActivites,
        inline: false,
      });
    }

    return embed;
  }

  /**
   * Sauvegarde le plan hebdomadaire dans l'historique
   */
  private sauvegarderPlanHebdo(plan: PlanHebdomadaire): void {
    try {
      const repertoire = path.dirname(FICHIER_PLANS_HEBDO);
      if (!fs.existsSync(repertoire)) {
        fs.mkdirSync(repertoire, { recursive: true });
      }

      let plans: PlanHebdomadaire[] = [];
      if (fs.existsSync(FICHIER_PLANS_HEBDO)) {
        const donnees = fs.readFileSync(FICHIER_PLANS_HEBDO, 'utf-8');
        plans = JSON.parse(donnees);
      }

      plans.push(plan);

      // Garde uniquement les 10 derniers plans
      if (plans.length > 10) {
        plans = plans.slice(-10);
      }

      fs.writeFileSync(FICHIER_PLANS_HEBDO, JSON.stringify(plans, null, 2));
    } catch (erreur) {
      console.error('Erreur lors de la sauvegarde du plan hebdomadaire :', erreur);
    }
  }

  /**
   * Génère et envoie manuellement un plan hebdomadaire dans un canal spécifique
   */
  public async planHebdomadaireManuel(idCanal: string): Promise<PlanHebdomadaire> {
    const idCanalOriginal = this.idCanal;
    this.idCanal = idCanal;

    const plan = this.genererPlanHebdomadaire();
    const canal = (await this.client.channels.fetch(idCanal)) as TextChannel;
    const embed = this.creerEmbedPlanHebdo(plan);

    await canal.send({ embeds: [embed] });
    this.sauvegarderPlanHebdo(plan);

    this.idCanal = idCanalOriginal;
    return plan;
  }
}
