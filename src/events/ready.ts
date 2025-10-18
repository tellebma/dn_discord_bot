import type { Client } from 'discord.js';

/**
 * Événement déclenché lorsque le bot est connecté et prêt
 */
export default {
  name: 'clientReady',
  once: true,
  execute(client: Client): void {
    console.log(`🚀 ${client.user?.tag} est en ligne et prêt !`);
    console.log(`📊 Sert ${client.guilds.cache.size} serveur(s)`);
    console.log(`👥 Surveille ${client.users.cache.size} utilisateur(s)`);

    // Définit l'activité du bot (apparaît comme "Joue à...")
    client.user?.setActivity('📅 Plans hebdomadaires | /help', { type: 0 }); // Type PLAYING
  },
};
