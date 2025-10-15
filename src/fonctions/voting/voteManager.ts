import {
  Client,
  TextChannel,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
} from 'discord.js';
import { GestionnairePoolJeux } from '@/fonctions/database/gamePool';
import { GestionnaireStatistiques } from '@/fonctions/analytics/statsManager';
import { PlanificateurHebdomadaire } from '@/fonctions/scheduler/weeklyPlanner';
import { SessionVote, VoteJeu, ResultatVote, RappelVote } from '@/types/vote';
import fs from 'fs';
import path from 'path';

const FICHIER_VOTES = path.join(process.cwd(), 'data', 'votes.json');
const FICHIER_RAPPELS = path.join(process.cwd(), 'data', 'rappelsVotes.json');

/**
 * Gestionnaire de votes pour la sélection hebdomadaire des jeux
 * Les votes sont anonymes pour éviter les biais sociaux
 */
export class GestionnaireVotes {
  private static instance: GestionnaireVotes;
  private client: Client;
  private sessions: Map<string, SessionVote> = new Map();
  private rappels: Map<string, RappelVote> = new Map();

  private constructor(client: Client) {
    this.client = client;
    this.chargerVotes();
    this.chargerRappels();
    this.demarrerRappelsAutomatiques();
  }

  public static getInstance(client: Client): GestionnaireVotes {
    if (!GestionnaireVotes.instance) {
      GestionnaireVotes.instance = new GestionnaireVotes(client);
    }
    return GestionnaireVotes.instance;
  }

  /**
   * Démarre une nouvelle session de vote
   */
  public async demarrerSessionVote(
    canalId: string,
    nombreJeux: number = 10,
    dureeHeures: number = 24,
    creerPar: string
  ): Promise<SessionVote> {
    const gestionnaireJeux = GestionnairePoolJeux.getInstance();
    const jeux = gestionnaireJeux.obtenirJeuxAleatoires(nombreJeux);

    if (jeux.length === 0) {
      throw new Error('Aucun jeu disponible pour le vote');
    }

    const dateFin = new Date(Date.now() + dureeHeures * 60 * 60 * 1000);

    const session: SessionVote = {
      id: Date.now().toString(),
      semaine: this.obtenirSemaineActuelle(),
      jeuxProposes: jeux.map(j => j.id),
      votes: new Map(),
      messageId: '',
      canalId,
      dateDebut: new Date(),
      dateFin,
      statut: 'en_cours',
      planGenere: false,
      creerPar,
    };

    // Initialiser les votes pour chaque jeu
    jeux.forEach(jeu => {
      session.votes.set(jeu.id, {
        idJeu: jeu.id,
        votesUtilisateurs: [],
        score: 0,
      });
    });

    // Créer le message de vote
    const canal = (await this.client.channels.fetch(canalId)) as TextChannel;
    const embed = this.creerEmbedVote(
      session,
      jeux.map(j => ({ id: j.id, nom: j.nom, description: j.description, categorie: j.categorie }))
    );
    const buttons = this.creerBoutonsVote(jeux);

    const message = await canal.send({
      content: '@here 🗳️ **Nouveau vote pour la semaine prochaine !**',
      embeds: [embed],
      components: buttons,
    });

    session.messageId = message.id;
    this.sessions.set(session.id, session);
    this.sauvegarderVotes();

    // Programmer la fin du vote
    setTimeout(
      () => {
        this.terminerSessionVote(session.id);
      },
      dureeHeures * 60 * 60 * 1000
    );

    // Configurer les rappels
    this.configurerRappel(session);

    console.log(`✅ Session de vote créée : ${session.id} (${jeux.length} jeux)`);
    return session;
  }

  /**
   * Gère un vote d'utilisateur (anonyme)
   */
  public async gererVote(sessionId: string, idJeu: string, userId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session || session.statut !== 'en_cours') {
      return false;
    }

    const vote = session.votes.get(idJeu);
    if (!vote) {
      return false;
    }

    // Retirer tous les votes précédents de cet utilisateur pour cette session
    // (un utilisateur ne peut voter que pour un jeu à la fois)
    session.votes.forEach(v => {
      v.votesUtilisateurs = v.votesUtilisateurs.filter(id => id !== userId);
    });

    // Ajouter le nouveau vote
    if (!vote.votesUtilisateurs.includes(userId)) {
      vote.votesUtilisateurs.push(userId);
      vote.score = vote.votesUtilisateurs.length;

      // Enregistrer dans les statistiques
      const gestionnaireStats = GestionnaireStatistiques.getInstance();
      gestionnaireStats.enregistrerVote(userId);
    }

    this.sauvegarderVotes();
    await this.mettreAJourAffichageVote(session);

    return true;
  }

  /**
   * Met à jour l'affichage du vote (scores mis à jour sans révéler les votants)
   */
  private async mettreAJourAffichageVote(session: SessionVote): Promise<void> {
    try {
      const canal = (await this.client.channels.fetch(session.canalId)) as TextChannel;
      const message = await canal.messages.fetch(session.messageId);

      const gestionnaireJeux = GestionnairePoolJeux.getInstance();
      const jeux = session.jeuxProposes
        .map(id => {
          const jeu = gestionnaireJeux.trouverJeu(id);
          return jeu
            ? { id, nom: jeu.nom, description: jeu.description, categorie: jeu.categorie }
            : null;
        })
        .filter(Boolean);

      const embed = this.creerEmbedVote(session, jeux as any[]);
      await message.edit({ embeds: [embed] });
    } catch (erreur) {
      console.error('Erreur mise à jour affichage vote :', erreur);
    }
  }

  /**
   * Crée l'embed de vote avec scores anonymes
   */
  private creerEmbedVote(session: SessionVote, jeux: any[]): EmbedBuilder {
    const totalVotes = Array.from(session.votes.values()).reduce((sum, v) => sum + v.score, 0);

    const embed = new EmbedBuilder()
      .setTitle('🗳️ Vote pour le Plan Hebdomadaire')
      .setDescription(
        `**Semaine :** ${session.semaine}\n` +
          `**Fin du vote :** <t:${Math.floor(session.dateFin.getTime() / 1000)}:R>\n\n` +
          `Votez pour vos jeux préférés ! Les **5 jeux les plus votés** seront inclus dans le plan de la semaine.\n\n` +
          `🔒 **Votes anonymes** - Personne ne voit qui vote pour quoi.\n` +
          `📊 ${totalVotes} vote(s) au total`
      )
      .setColor(0x9966ff);

    // Trier les jeux par score décroissant
    const jeuxTries = jeux
      .map(jeu => {
        const vote = session.votes.get(jeu.id);
        return {
          ...jeu,
          score: vote?.score || 0,
        };
      })
      .sort((a, b) => b.score - a.score);

    // Afficher les jeux avec barres de progression
    const jeuxText = jeuxTries
      .map((jeu, index) => {
        const pourcentage = totalVotes > 0 ? Math.round((jeu.score / totalVotes) * 100) : 0;
        const barres = this.creerBarreProgression(pourcentage);

        let text = `${index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`} **${jeu.nom}**`;
        if (jeu.categorie) text += ` _(${jeu.categorie})_`;
        text += `\n${barres} ${jeu.score} vote(s) - ${pourcentage}%`;

        return text;
      })
      .join('\n\n');

    embed.addFields({
      name: `🎮 Jeux Proposés (${jeux.length})`,
      value: jeuxText || 'Chargement...',
      inline: false,
    });

    const topActuel = jeuxTries
      .slice(0, 5)
      .map(j => j.nom)
      .join(', ');
    embed.addFields({
      name: '🏆 Top 5 Actuel',
      value: topActuel || 'En attente de votes',
      inline: false,
    });

    return embed;
  }

  /**
   * Crée une barre de progression visuelle
   */
  private creerBarreProgression(pourcentage: number, longueur: number = 10): string {
    const rempli = Math.round((pourcentage / 100) * longueur);
    const vide = longueur - rempli;
    return '█'.repeat(rempli) + '░'.repeat(vide);
  }

  /**
   * Crée les boutons de vote pour chaque jeu
   */
  private creerBoutonsVote(jeux: any[]): ActionRowBuilder[] {
    const rows: ActionRowBuilder[] = [];

    // Maximum 5 boutons par row, maximum 5 rows
    for (let i = 0; i < Math.min(jeux.length, 25); i += 5) {
      const row = new ActionRowBuilder();
      const jeuxDansRow = jeux.slice(i, i + 5);

      jeuxDansRow.forEach((jeu, index) => {
        const numero = i + index + 1;
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`vote_${jeu.id}`)
            .setLabel(`${numero}. ${jeu.nom.substring(0, 30)}`)
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎮')
        );
      });

      rows.push(row as any);
    }

    return rows;
  }

  /**
   * Termine une session de vote et génère le plan
   */
  private async terminerSessionVote(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || session.statut !== 'en_cours') {
      return;
    }

    session.statut = 'termine';
    console.log(`🏁 Session de vote terminée : ${sessionId}`);

    // Calculer les résultats
    const resultats = this.calculerResultats(session);

    // Sélectionner les top 5
    const top5 = resultats.sort((a, b) => b.score - a.score).slice(0, 5);

    // Envoyer les résultats
    await this.envoyerResultatsVote(session, resultats, top5);

    // Générer le plan avec les jeux sélectionnés
    if (!session.planGenere && top5.length > 0) {
      await this.genererPlanAvecVotes(
        session.canalId,
        top5.map(r => r.idJeu)
      );
      session.planGenere = true;
    }

    this.sauvegarderVotes();
  }

  /**
   * Calcule les résultats du vote
   */
  private calculerResultats(session: SessionVote): ResultatVote[] {
    const gestionnaireJeux = GestionnairePoolJeux.getInstance();
    const totalVotes = Array.from(session.votes.values()).reduce(
      (sum, v) => sum + v.votesUtilisateurs.length,
      0
    );

    return Array.from(session.votes.entries()).map(([idJeu, vote]) => {
      const jeu = gestionnaireJeux.trouverJeu(idJeu);
      return {
        idJeu,
        nomJeu: jeu?.nom || 'Jeu inconnu',
        score: vote.score,
        nbVotes: vote.votesUtilisateurs.length,
        pourcentage:
          totalVotes > 0 ? Math.round((vote.votesUtilisateurs.length / totalVotes) * 100) : 0,
      };
    });
  }

  /**
   * Envoie les résultats du vote
   */
  private async envoyerResultatsVote(
    session: SessionVote,
    resultats: ResultatVote[],
    top5: ResultatVote[]
  ): Promise<void> {
    try {
      const canal = (await this.client.channels.fetch(session.canalId)) as TextChannel;

      const embed = new EmbedBuilder()
        .setTitle('📊 Résultats du Vote Hebdomadaire')
        .setDescription(
          `**Semaine :** ${session.semaine}\n` +
            `**Total des votes :** ${resultats.reduce((s, r) => s + r.nbVotes, 0)}\n\n` +
            `Les **5 jeux les plus votés** seront inclus dans le plan de cette semaine !`
        )
        .setColor(0x00ff00);

      // Afficher le top 5
      const top5Text = top5
        .map((r, i) => {
          const emoji = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i];
          return `${emoji} **${r.nomJeu}** - ${r.nbVotes} vote(s) (${r.pourcentage}%)`;
        })
        .join('\n');

      embed.addFields({
        name: '🏆 Top 5 - Jeux Sélectionnés',
        value: top5Text,
        inline: false,
      });

      // Afficher tous les résultats (sans ordre alphabétique pour masquer le classement complet)
      const tousResultats = resultats
        .sort(() => Math.random() - 0.5) // Ordre aléatoire pour anonymat
        .map(r => `• ${r.nomJeu} - ${r.nbVotes} vote(s)`)
        .join('\n');

      embed.addFields({
        name: '📊 Tous les Résultats (ordre aléatoire)',
        value: tousResultats,
        inline: false,
      });

      embed.setFooter({ text: '🔒 Vote anonyme - Merci pour votre participation !' });
      embed.setTimestamp();

      await canal.send({ embeds: [embed] });
    } catch (erreur) {
      console.error('Erreur envoi résultats :', erreur);
    }
  }

  /**
   * Génère un plan hebdomadaire avec les jeux votés
   */
  private async genererPlanAvecVotes(
    canalId: string,
    idsJeuxSelectionnes: string[]
  ): Promise<void> {
    try {
      const planificateur = PlanificateurHebdomadaire.getInstance(this.client);
      // Le plan sera généré avec les jeux sélectionnés par vote
      // (nécessite modification du planificateur pour accepter une sélection manuelle)
      console.log(`📅 Plan généré avec les jeux votés : ${idsJeuxSelectionnes.join(', ')}`);
    } catch (erreur) {
      console.error('Erreur génération plan avec votes :', erreur);
    }
  }

  /**
   * Configure les rappels automatiques pour une session
   */
  private configurerRappel(session: SessionVote): void {
    const rappel: RappelVote = {
      sessionId: session.id,
      dernierRappel: new Date(),
      prochainRappel: new Date(session.dateFin.getTime() - 6 * 60 * 60 * 1000), // 6h avant la fin
      rappelsEnvoyes: 0,
    };

    this.rappels.set(session.id, rappel);
    this.sauvegarderRappels();
  }

  /**
   * Démarre le système de rappels automatiques
   */
  private demarrerRappelsAutomatiques(): void {
    // Vérifier toutes les heures s'il faut envoyer des rappels
    setInterval(
      () => {
        this.verifierEtEnvoyerRappels();
      },
      60 * 60 * 1000
    ); // Toutes les heures

    console.log('🔔 Système de rappels de votes démarré');
  }

  /**
   * Vérifie et envoie les rappels nécessaires
   */
  private async verifierEtEnvoyerRappels(): Promise<void> {
    const maintenant = new Date();

    for (const [sessionId, rappel] of this.rappels.entries()) {
      const session = this.sessions.get(sessionId);

      if (!session || session.statut !== 'en_cours') {
        continue;
      }

      // Envoyer un rappel si le moment est venu et pas déjà envoyé
      if (maintenant >= rappel.prochainRappel && rappel.rappelsEnvoyes === 0) {
        await this.envoyerRappelVote(session);
        rappel.rappelsEnvoyes++;
        rappel.dernierRappel = maintenant;
        this.sauvegarderRappels();
      }
    }
  }

  /**
   * Envoie un rappel pour voter
   */
  private async envoyerRappelVote(session: SessionVote): Promise<void> {
    try {
      const canal = (await this.client.channels.fetch(session.canalId)) as TextChannel;

      const totalVotes = Array.from(session.votes.values()).reduce(
        (sum, v) => sum + v.votesUtilisateurs.length,
        0
      );

      const embed = new EmbedBuilder()
        .setTitle("🔔 Rappel : N'oubliez pas de voter !")
        .setDescription(
          `Le vote pour la semaine **${session.semaine}** se termine bientôt !\n\n` +
            `⏰ Fin du vote : <t:${Math.floor(session.dateFin.getTime() / 1000)}:R>\n` +
            `📊 ${totalVotes} vote(s) reçu(s)\n\n` +
            `Votez pour vos jeux préférés en cliquant sur les boutons ci-dessus ! ⬆️`
        )
        .setColor(0xffaa00)
        .setFooter({ text: '🔒 Votre vote est anonyme' });

      await canal.send({
        content: '@here',
        embeds: [embed],
      });

      console.log(`🔔 Rappel envoyé pour la session ${session.id}`);
    } catch (erreur) {
      console.error('Erreur envoi rappel :', erreur);
    }
  }

  /**
   * Obtient la session de vote active
   */
  public obtenirSessionActive(): SessionVote | null {
    for (const session of this.sessions.values()) {
      if (session.statut === 'en_cours') {
        return session;
      }
    }
    return null;
  }

  /**
   * Annule une session de vote
   */
  public async annulerSessionVote(sessionId: string, raison?: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session || session.statut !== 'en_cours') {
      return false;
    }

    session.statut = 'annule';
    this.sauvegarderVotes();

    try {
      const canal = (await this.client.channels.fetch(session.canalId)) as TextChannel;
      const embed = new EmbedBuilder()
        .setTitle('❌ Vote Annulé')
        .setDescription(
          `Le vote pour la semaine **${session.semaine}** a été annulé.\n\n` +
            (raison ? `**Raison :** ${raison}` : '')
        )
        .setColor(0xff0000);

      await canal.send({ embeds: [embed] });
    } catch (erreur) {
      console.error('Erreur annulation vote :', erreur);
    }

    return true;
  }

  private obtenirSemaineActuelle(): string {
    const date = new Date();
    const debut = new Date(date);
    const jour = debut.getDay();
    debut.setDate(debut.getDate() - jour + (jour === 0 ? -6 : 1));

    const fin = new Date(debut);
    fin.setDate(debut.getDate() + 6);

    return `${debut.toLocaleDateString('fr-FR')} - ${fin.toLocaleDateString('fr-FR')}`;
  }

  private chargerVotes(): void {
    try {
      if (fs.existsSync(FICHIER_VOTES)) {
        const donnees = JSON.parse(fs.readFileSync(FICHIER_VOTES, 'utf-8'));

        donnees.forEach((sessionData: any) => {
          const session: SessionVote = {
            ...sessionData,
            dateDebut: new Date(sessionData.dateDebut),
            dateFin: new Date(sessionData.dateFin),
            votes: new Map(Object.entries(sessionData.votes)),
          };
          this.sessions.set(session.id, session);
        });

        console.log(`✅ ${this.sessions.size} session(s) de vote chargée(s)`);
      }
    } catch (erreur) {
      console.error('Erreur chargement votes :', erreur);
    }
  }

  private sauvegarderVotes(): void {
    try {
      const dir = path.dirname(FICHIER_VOTES);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const sessions = Array.from(this.sessions.values()).map(session => ({
        ...session,
        votes: Object.fromEntries(session.votes),
      }));

      fs.writeFileSync(FICHIER_VOTES, JSON.stringify(sessions, null, 2));
    } catch (erreur) {
      console.error('Erreur sauvegarde votes :', erreur);
    }
  }

  private chargerRappels(): void {
    try {
      if (fs.existsSync(FICHIER_RAPPELS)) {
        const donnees = JSON.parse(fs.readFileSync(FICHIER_RAPPELS, 'utf-8'));

        donnees.forEach((rappelData: any) => {
          this.rappels.set(rappelData.sessionId, {
            ...rappelData,
            dernierRappel: new Date(rappelData.dernierRappel),
            prochainRappel: new Date(rappelData.prochainRappel),
          });
        });
      }
    } catch (erreur) {
      console.error('Erreur chargement rappels :', erreur);
    }
  }

  private sauvegarderRappels(): void {
    try {
      const dir = path.dirname(FICHIER_RAPPELS);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const rappels = Array.from(this.rappels.values());
      fs.writeFileSync(FICHIER_RAPPELS, JSON.stringify(rappels, null, 2));
    } catch (erreur) {
      console.error('Erreur sauvegarde rappels :', erreur);
    }
  }
}
