import { SlashCommandBuilder, EmbedBuilder, CommandInteraction } from 'discord.js';
import { GamePoolManager } from '@/fonctions/database/gamePool';

export const data = new SlashCommandBuilder()
  .setName('addgame')
  .setDescription('Add a game to the pool')
  .addStringOption(option =>
    option.setName('name')
      .setDescription('Name of the game')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('description')
      .setDescription('Description of the game')
      .setRequired(false))
  .addStringOption(option =>
    option.setName('category')
      .setDescription('Category of the game (e.g., Strategy, Action, Party)')
      .setRequired(false))
  .addIntegerOption(option =>
    option.setName('minplayers')
      .setDescription('Minimum number of players')
      .setMinValue(1)
      .setRequired(false))
  .addIntegerOption(option =>
    option.setName('maxplayers')
      .setDescription('Maximum number of players')
      .setMinValue(1)
      .setRequired(false));

export async function execute(interaction: CommandInteraction) {
  const name = interaction.options.get('name')?.value as string;
  const description = interaction.options.get('description')?.value as string;
  const category = interaction.options.get('category')?.value as string;
  const minPlayers = interaction.options.get('minplayers')?.value as number;
  const maxPlayers = interaction.options.get('maxplayers')?.value as number;

  if (minPlayers && maxPlayers && minPlayers > maxPlayers) {
    await interaction.reply({
      content: '❌ Minimum players cannot be greater than maximum players!',
      ephemeral: true
    });
    return;
  }

  const gamePoolManager = GamePoolManager.getInstance();
  
  const existingGame = gamePoolManager.findGame(name);
  if (existingGame) {
    await interaction.reply({
      content: `❌ A game with the name "${name}" already exists in the pool!`,
      ephemeral: true
    });
    return;
  }

  const newGame = gamePoolManager.addGame({
    name,
    description,
    category,
    minPlayers,
    maxPlayers,
    addedBy: interaction.user.id
  });

  const embed = new EmbedBuilder()
    .setTitle('✅ Game Added Successfully!')
    .setColor(0x00FF00)
    .addFields(
      { name: 'Name', value: newGame.name, inline: true },
      { name: 'Added by', value: `<@${newGame.addedBy}>`, inline: true },
      { name: 'Game ID', value: newGame.id, inline: true }
    )
    .setTimestamp();

  if (newGame.description) {
    embed.addFields({ name: 'Description', value: newGame.description });
  }
  
  if (newGame.category) {
    embed.addFields({ name: 'Category', value: newGame.category, inline: true });
  }

  if (newGame.minPlayers || newGame.maxPlayers) {
    const players = newGame.minPlayers && newGame.maxPlayers 
      ? `${newGame.minPlayers}-${newGame.maxPlayers}` 
      : newGame.minPlayers 
      ? `${newGame.minPlayers}+` 
      : `up to ${newGame.maxPlayers}`;
    embed.addFields({ name: 'Players', value: players, inline: true });
  }

  await interaction.reply({ embeds: [embed] });
}