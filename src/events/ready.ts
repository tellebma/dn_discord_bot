import type { Client } from 'discord.js';
import { PlanificateurHebdomadaire } from '@/fonctions/scheduler/weeklyPlanner';
import { StockageCanal } from '@/utils/channelStorage';

/**
 * Événement déclenché lorsque le bot est connecté et prêt
 */
export default {
  name: 'ready',
  once: true,
  execute(client: Client): void {
    console.log(`🚀 ${client.user?.tag} est en ligne et prêt !`);
    console.log(`📊 Sert ${client.guilds.cache.size} serveur(s)`);
    console.log(`👥 Surveille ${client.users.cache.size} utilisateur(s)`);

    // Définit l'activité du bot (apparaît comme "Joue à...")
    client.user?.setActivity('📅 Plans hebdomadaires | /help', { type: 0 }); // Type PLAYING

    // Restaure et démarre le planificateur si un canal est configuré
    const stockageCanal = StockageCanal.getInstance();
    const canalId = stockageCanal.obtenirCanalId();
    
    if (canalId) {
      console.log(`📅 Restauration du planificateur hebdomadaire pour le canal : ${canalId}`);
      const planificateur = PlanificateurHebdomadaire.getInstance(client);
      planificateur.demarrerPlanificateur();
    } else {
      console.log(`ℹ️  Aucun canal configuré pour les plans hebdomadaires. Utilisez /setchannel`);
    }
  },
};