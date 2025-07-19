import { SlashCommandBuilder, EmbedBuilder, CommandInteraction } from 'discord.js';
import { GamePoolManager } from '@/fonctions/database/gamePool';

export const data = new SlashCommandBuilder()
  .setName('gamepool')
  .setDescription('View all games in the pool');

export async function execute(interaction: CommandInteraction) {
  const gamePoolManager = GamePoolManager.getInstance();
  const games = gamePoolManager.getGames();

  if (games.length === 0) {
    await interaction.reply({
      content: 'The game pool is empty! Use `/addgame` to add some games.',
      ephemeral: true
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('🎮 Game Pool')
    .setDescription(`Total games: ${games.length}`)
    .setColor(0x0099FF)
    .setTimestamp();

  const gameList = games.map((game, index) => {
    let gameInfo = `**${index + 1}. ${game.name}**`;
    if (game.description) gameInfo += `\n   ${game.description}`;
    if (game.minPlayers || game.maxPlayers) {
      const players = game.minPlayers && game.maxPlayers 
        ? `${game.minPlayers}-${game.maxPlayers}` 
        : game.minPlayers 
        ? `${game.minPlayers}+` 
        : `up to ${game.maxPlayers}`;
      gameInfo += `\n   👥 ${players} players`;
    }
    if (game.category) gameInfo += `\n   📂 ${game.category}`;
    return gameInfo;
  }).join('\n\n');

  if (gameList.length > 4000) {
    embed.setDescription(`Total games: ${games.length}\n\n${gameList.substring(0, 3900)}...\n\n*List truncated due to length*`);
  } else {
    embed.setDescription(`Total games: ${games.length}\n\n${gameList}`);
  }

  await interaction.reply({ embeds: [embed] });
}