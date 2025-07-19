import type { Client } from 'discord.js';

export default {
  name: 'ready',
  once: true,
  execute(client: Client): void {
    console.log(`🚀 ${client.user?.tag} is online and ready!`);
    console.log(`📊 Serving ${client.guilds.cache.size} servers`);
    console.log(`👥 Watching ${client.users.cache.size} users`);

    client.user?.setActivity('with TypeScript', { type: 0 }); // PLAYING type
  },
};