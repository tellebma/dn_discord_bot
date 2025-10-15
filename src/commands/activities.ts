import { SlashCommandBuilder, EmbedBuilder, CommandInteraction } from 'discord.js';
import { GestionnaireActivitesExtras } from '@/fonctions/database/extraActivities';

/**
 * Commande pour afficher toutes les activités extras
 */
export const data = new SlashCommandBuilder()
  .setName('activities')
  .setDescription('Afficher toutes les activités extras')
  .addBooleanOption(option =>
    option.setName('activeseulement')
      .setDescription('Afficher uniquement les activités actives (par défaut : non)')
      .setRequired(false));

export async function execute(interaction: CommandInteraction) {
  const activesUniquement = interaction.options.get('activeseulement')?.value as boolean ?? false;
  
  const gestionnaireActivites = GestionnaireActivitesExtras.getInstance();
  const activites = activesUniquement 
    ? gestionnaireActivites.obtenirActivitesActives() 
    : gestionnaireActivites.obtenirActivites();

  if (activites.length === 0) {
    const message = activesUniquement 
      ? 'Aucune activité extra active trouvée ! Utilisez `/addactivity` pour en ajouter.'
      : 'Aucune activité extra trouvée ! Utilisez `/addactivity` pour en ajouter.';
    
    await interaction.reply({
      content: message,
      ephemeral: true
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('📅 Activités Extras')
    .setDescription(`${activesUniquement ? 'Activités actives' : 'Toutes les activités'} : ${activites.length}`)
    .setColor(0x9966FF)
    .setTimestamp();

  // Regroupe les activités par jour
  const groupesJours: { [cle: number]: any[] } = {};
  
  activites.forEach(activite => {
    if (!groupesJours[activite.jourSemaine]) {
      groupesJours[activite.jourSemaine] = [];
    }
    groupesJours[activite.jourSemaine].push(activite);
  });

  // Trie les jours du dimanche (0) au samedi (6)
  const joursTries = Object.keys(groupesJours).map(Number).sort();

  joursTries.forEach(jourSemaine => {
    const nomJour = gestionnaireActivites.obtenirNomJour(jourSemaine);
    const activitesJour = groupesJours[jourSemaine];
    
    const listeActivites = activitesJour.map(activite => {
      let infoActivite = `${activite.estActif ? '🟢' : '🔴'} **${activite.nom}**`;
      
      if (activite.heure) {
        infoActivite += ` • ${activite.heure}`;
      }
      
      if (activite.lieu) {
        infoActivite += ` • 📍 ${activite.lieu}`;
      }
      
      if (activite.description) {
        infoActivite += `\n   ${activite.description}`;
      }
      
      infoActivite += `\n   *ID : ${activite.id}*`;
      
      return infoActivite;
    }).join('\n\n');

    embed.addFields({
      name: `${nomJour} (${activitesJour.length})`,
      value: listeActivites,
      inline: false
    });
  });

  await interaction.reply({ embeds: [embed] });
}
