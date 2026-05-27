import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { GestionnairePoolJeux } from '../fonctions/database/gamePool.js';

/**
 * Commande pour afficher le pool de jeux
 */
export const data = new SlashCommandBuilder()
  .setName('gamepool')
  .setDescription('Afficher le pool de jeux')
  .addBooleanOption(option =>
    option.setName('actifs').setDescription('Afficher seulement les jeux actifs').setRequired(false)
  )
  .addIntegerOption(option =>
    option
      .setName('limite')
      .setDescription('Nombre maximum de jeux à afficher')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(50)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const actifsUniquement = interaction.options.getBoolean('actifs') ?? false;
  const limite = interaction.options.getInteger('limite') ?? 20;

  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      content: '❌ Cette commande doit être utilisée dans un serveur.',
      flags: 64,
    });
    return;
  }

  try {
    const gestionnaire = GestionnairePoolJeux.getInstance();
    let jeux = await gestionnaire.obtenirJeux(guildId);

    if (actifsUniquement) {
      jeux = jeux.filter(jeu => jeu.actif !== false);
    }

    // Trier par nombre de votes décroissant
    jeux.sort((a, b) => (b.votes || 0) - (a.votes || 0));

    // Limiter le nombre de résultats
    jeux = jeux.slice(0, limite);

    const embed = new EmbedBuilder().setTitle('🎮 Pool de jeux').setColor('#0099ff').setTimestamp();

    if (jeux.length === 0) {
      embed.setDescription('Aucun jeu trouvé dans le pool.');
    } else {
      const liste = jeux
        .map((jeu, index) => {
          const votes = jeu.votes ?? 0;
          const statut = jeu.actif !== false ? '✅' : '❌';
          return (
            `**${index + 1}.** ${statut} **${jeu.nom}** (${votes} votes)\n` +
            `   📝 ${jeu.description ?? 'Aucune description'}\n` +
            `   🖥️ ${jeu.plateforme ?? 'Non spécifié'} | 🎯 ${jeu.genre ?? 'Non spécifié'}`
          );
        })
        .join('\n\n');

      embed.setDescription(liste);
      embed.setFooter({
        text: `Affichage de ${jeux.length} jeu(x)${actifsUniquement ? ' actif(s)' : ''}`,
      });
    }

    await interaction.reply({ embeds: [embed], flags: 64 });
  } catch (error) {
    console.error("Erreur lors de l'affichage du pool de jeux:", error);
    await interaction.reply({
      content: "❌ Une erreur est survenue lors de l'affichage du pool de jeux.",
      flags: 64,
    });
  }
}
