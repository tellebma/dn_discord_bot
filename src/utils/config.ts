/**
 * Configuration
 */
export const config = {
  bot: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
    guildId: process.env.DISCORD_GUILD_ID,
  },
  apis: {
    steam: {
      key: process.env.STEAM_API_KEY,
    },
    twitch: {
      clientId: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
    },
    rawg: {
      key: process.env.RAWG_API_KEY,
    },
  },
  votes: {
    defaultGamesCount: parseInt(process.env.DEFAULT_VOTE_GAMES_COUNT ?? '10'),
    defaultDuration: parseInt(process.env.DEFAULT_VOTE_DURATION ?? '24'),
  },
  logs: {
    level: process.env.LOG_LEVEL ?? 'info',
  },
};
