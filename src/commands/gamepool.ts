import { SlashCommandBuilder, EmbedBuilder, CommandInteraction } from 'discord.js';
import { GestionnairePoolJeux } from '@/fonctions/database/gamePool';

/**
 * Commande pour afficher tous les jeux du pool
 */
export const data = new SlashCommandBuilder()
  .setName('gamepool')
  .setDescription('Afficher tous les jeux du pool');

export async function execute(interaction: CommandInteraction) {
  const gestionnaireJeux = GestionnairePoolJeux.getInstance();
  const jeux = gestionnaireJeux.obtenirJeux();

  if (jeux.length === 0) {
    await interaction.reply({
      content: 'Le pool de jeux est vide ! Utilisez `/addgame` pour ajouter des jeux.',
      ephemeral: true,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('🎮 Pool de Jeux')
    .setDescription(`Total de jeux : ${jeux.length}`)
    .setColor(0x0099ff)
    .setTimestamp();

  const listeJeux = jeux
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

      if (jeu.categorie) infoJeu += `\n   📂 ${jeu.categorie}`;
      return infoJeu;
    })
    .join('\n\n');

  // Tronque la liste si elle est trop longue pour Discord
  if (listeJeux.length > 4000) {
    embed.setDescription(
      `Total de jeux : ${jeux.length}\n\n${listeJeux.substring(0, 3900)}...\n\n*Liste tronquée en raison de la longueur*`
    );
  } else {
    embed.setDescription(`Total de jeux : ${jeux.length}\n\n${listeJeux}`);
  }

  await interaction.reply({ embeds: [embed] });
}
