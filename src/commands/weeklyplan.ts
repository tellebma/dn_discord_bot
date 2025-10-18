import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { PlanificateurHebdomadaire } from '../fonctions/scheduler/weeklyPlanner.js';
import { GestionnairePoolJeux } from '../fonctions/database/gamePool.js';
import { GestionnaireActivitesExtras } from '../fonctions/database/extraActivities.js';

/**
 * Commande pour afficher le plan hebdomadaire
 */
export const data = new SlashCommandBuilder()
  .setName('weeklyplan')
  .setDescription('Afficher le plan hebdomadaire')
  .addBooleanOption(option =>
    option
      .setName('generer')
      .setDescription('Générer un nouveau plan')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const generer = interaction.options.getBoolean('generer') ?? false;

  try {
    const planificateur = PlanificateurHebdomadaire.getInstance();
    const gestionnaireJeux = GestionnairePoolJeux.getInstance();
    const gestionnaireActivites = GestionnaireActivitesExtras.getInstance();

    let plan;
    if (generer) {
      plan = await planificateur.genererPlanHebdomadaire();
    } else {
      // Simuler un plan existant
      plan = {
        jeux: await gestionnaireJeux.obtenirJeuxAleatoires(3),
        activites: await gestionnaireActivites.obtenirActivites(true),
        date: new Date(),
        periode: 'Cette semaine'
      };
    }

    const embed = new EmbedBuilder()
      .setTitle('📅 Plan hebdomadaire')
      .setDescription(`**${plan.periode}** - ${plan.date.toLocaleDateString()}`)
      .setColor('#ff6b6b')
      .setTimestamp();

    // Afficher les jeux
    if (plan.jeux && plan.jeux.length > 0) {
      const jeuxListe = plan.jeux.map((jeu: any, index: number) => 
        `**${index + 1}.** ${jeu.nom} - ${jeu.description ?? 'Aucune description'}`
      ).join('\n');
      
      embed.addFields({
        name: '🎮 Jeux proposés',
        value: jeuxListe,
        inline: false
      });
    }

    // Afficher les activités
    if (plan.activites && plan.activites.length > 0) {
      const activitesListe = plan.activites.map((activite: any, index: number) => 
        `**${index + 1}.** ${activite.nom} - ${activite.description ?? 'Aucune description'}`
      ).join('\n');
      
      embed.addFields({
        name: '🎯 Activités extras',
        value: activitesListe,
        inline: false
      });
    }

    if ((!plan.jeux || plan.jeux.length === 0) && (!plan.activites || plan.activites.length === 0)) {
      embed.setDescription('Aucun contenu disponible pour cette semaine.\nUtilisez `/addgame` et `/addactivity` pour ajouter du contenu.');
    }

    await interaction.reply({ embeds: [embed], flags: 64 });
  } catch (error) {
    console.error('Erreur lors de l\'affichage du plan hebdomadaire:', error);
    await interaction.reply({
      content: '❌ Une erreur est survenue lors de l\'affichage du plan hebdomadaire.',
      flags: 64
    });
  }
}