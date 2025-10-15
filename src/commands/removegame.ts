import { SlashCommandBuilder, EmbedBuilder, CommandInteraction, PermissionFlagsBits } from 'discord.js';
import { GestionnairePoolJeux } from '@/fonctions/database/gamePool';

/**
 * Commande pour supprimer un jeu du pool (Admin)
 */
export const data = new SlashCommandBuilder()
  .setName('removegame')
  .setDescription('Supprimer un jeu du pool')
  .addStringOption((option: any) =>
    option.setName('jeu')
      .setDescription('Nom ou ID du jeu à supprimer')
      .setRequired(true)
      .setAutocomplete(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction: CommandInteraction) {
  const entreeJeu = interaction.options.get('jeu')?.value as string;

  const gestionnaireJeux = GestionnairePoolJeux.getInstance();
  
  // Recherche du jeu
  const jeu = gestionnaireJeux.trouverJeu(entreeJeu);
  
  if (!jeu) {
    await interaction.reply({
      content: `❌ Jeu "${entreeJeu}" introuvable dans le pool !`,
      ephemeral: true
    });
    return;
  }

  // Suppression du jeu
  const supprime = gestionnaireJeux.supprimerJeu(jeu.id);
  
  if (supprime) {
    const embed = new EmbedBuilder()
      .setTitle('🗑️ Jeu Supprimé')
      .setDescription(`Le jeu **${jeu.nom}** a été supprimé du pool.`)
      .setColor(0xFF0000)
      .addFields(
        { name: 'ID', value: jeu.id, inline: true },
        { name: 'Catégorie', value: jeu.categorie || 'Non définie', inline: true }
      )
      .setTimestamp()
      .setFooter({ text: `Supprimé par ${interaction.user.tag}` });

    if (jeu.description) {
      embed.addFields({ name: 'Description', value: jeu.description });
    }

    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({
      content: '❌ Erreur lors de la suppression du jeu.',
      ephemeral: true
    });
  }
}

/**
 * Gestion de l'autocomplétion pour la recherche de jeux
 */
export async function autocomplete(interaction: any) {
  const focusedValue = interaction.options.getFocused();
  const gestionnaireJeux = GestionnairePoolJeux.getInstance();
  const jeux = gestionnaireJeux.obtenirJeux();

  // Filtrer les jeux selon la saisie
  const filtered = jeux
    .filter(jeu => 
      jeu.nom.toLowerCase().includes(focusedValue.toLowerCase()) ||
      jeu.id.includes(focusedValue)
    )
    .slice(0, 25); // Discord limite à 25 choix

  await interaction.respond(
    filtered.map(jeu => ({
      name: `${jeu.nom}${jeu.categorie ? ` (${jeu.categorie})` : ''}`,
      value: jeu.id
    }))
  );
}



