/**
 * Cron de clôture des votes. Toutes les minutes, on cherche les votes dont la
 * durée est écoulée et on publie les résultats dans le canal d'origine via
 * channel.send (PAS interaction.followUp : le token d'interaction expire au bout
 * de 15 min). Persisté en base : un redémarrage ne perd aucun vote en cours.
 *
 * Calqué sur le cron giveaway du bot dvg.
 */
import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import cron from 'node-cron';
import { GestionnaireVotes, type SessionVoteHydratee } from '../voting/voteManager.js';
import { Logger } from '../../utils/logger.js';

async function cloturerVote(vote: SessionVoteHydratee, client: Client): Promise<void> {
  const votes = GestionnaireVotes.getInstance();
  try {
    if (!vote.guildId || !vote.channelId) {
      await votes.cloturerVote(vote.id);
      return;
    }

    const guild = client.guilds.cache.get(vote.guildId);
    const canal = guild?.channels.cache.get(vote.channelId);
    if (!canal || !canal.isTextBased()) {
      Logger.warn('Canal de vote introuvable, clôture sans annonce', {
        voteId: vote.id,
        channelId: vote.channelId,
      });
      await votes.cloturerVote(vote.id);
      return;
    }

    // Classement par nombre de votants distincts (décroissant).
    const classement = [...vote.jeux].sort(
      (a, b) => (vote.votes.get(b.id)?.size ?? 0) - (vote.votes.get(a.id)?.size ?? 0)
    );

    const embed = new EmbedBuilder()
      .setTitle('🏆 Résultats du vote')
      .setDescription('Le vote est terminé ! Voici les résultats :')
      .setColor('#ffd700')
      .setTimestamp();

    classement.forEach((jeu, index) => {
      const nb = vote.votes.get(jeu.id)?.size ?? 0;
      embed.addFields({
        name: `${index + 1}. ${jeu.nom}`,
        value: `**${nb} vote(s)**`,
        inline: true,
      });
    });

    await (canal as TextChannel).send({ embeds: [embed] });

    // Griser le message d'origine s'il existe encore.
    if (vote.messageId) {
      try {
        const message = await (canal as TextChannel).messages.fetch(vote.messageId);
        if (message.embeds.length > 0 && message.embeds[0]) {
          const maj = EmbedBuilder.from(message.embeds[0])
            .setColor('#808080')
            .setFooter({ text: 'Vote terminé' });
          await message.edit({ embeds: [maj], components: [] });
        }
      } catch (error) {
        Logger.warn("Impossible de mettre à jour le message de vote d'origine", {
          voteId: vote.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    await votes.cloturerVote(vote.id);
    Logger.info('Vote clôturé', { voteId: vote.id, jeux: classement.length });
  } catch (error) {
    Logger.error('Erreur lors de la clôture du vote', {
      voteId: vote.id,
      error: error instanceof Error ? error.message : String(error),
    });
    // On clôture quand même pour éviter une boucle infinie sur le même vote.
    await votes.cloturerVote(vote.id).catch(() => undefined);
  }
}

export function demarrerCronVotes(client: Client): void {
  cron.schedule('* * * * *', () => {
    void (async () => {
      try {
        const echus = await GestionnaireVotes.getInstance().obtenirVotesEchus();
        if (echus.length === 0) return;
        Logger.info('Clôture des votes échus', { count: echus.length });
        for (const vote of echus) {
          await cloturerVote(vote, client);
        }
      } catch (error) {
        Logger.error('Erreur du cron de votes', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    })();
  });

  Logger.info('Cron de clôture des votes programmé (toutes les minutes)');
}
