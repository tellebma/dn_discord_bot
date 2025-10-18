import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { StockageCanal } from '../utils/channelStorage.js';

/**
 * Commande pour configurer les canaux
 */
export const data = new SlashCommandBuilder()
  .setName('setchannel')
  .setDescription('Configurer les canaux du bot')
  .addStringOption(option =>
    option
      .setName('type')
      .setDescription('Type de canal à configurer')
      .setRequired(true)
      .addChoices(
        { name: 'Votes', value: 'votes' },
        { name: 'Plans hebdomadaires', value: 'weekly' },
        { name: 'Annonces', value: 'announcements' },
        { name: 'Logs', value: 'logs' }
      )
  )
  .addStringOption(option =>
    option
      .setName('canal')
      .setDescription('ID du canal ou mention du canal')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const type = interaction.options.getString('type', true);
  const canalInput = interaction.options.getString('canal', true);

  try {
    const stockage = StockageCanal.getInstance();
    
    // Extraire l'ID du canal depuis la mention ou utiliser directement l'ID
    let canalId = canalInput;
    if (canalInput.startsWith('<#') && canalInput.endsWith('>')) {
      canalId = canalInput.slice(2, -1);
    }

    // Vérifier que le canal existe
    const canal = interaction.guild?.channels.cache.get(canalId);
    if (!canal) {
      await interaction.reply({
        content: '❌ Canal introuvable. Vérifiez l\'ID ou la mention du canal.',
        flags: 64
      });
      return;
    }

    // Vérifier les permissions
    if (!canal.isTextBased()) {
      await interaction.reply({
        content: '❌ Le canal doit être un canal textuel.',
        flags: 64
      });
      return;
    }

    const botMember = interaction.guild?.members.me;
    if (!botMember) {
      await interaction.reply({
        content: '❌ Impossible de récupérer les informations du bot.',
        flags: 64
      });
      return;
    }
    const permissions = canal.permissionsFor(botMember);
    if (!permissions?.has(['SendMessages', 'EmbedLinks'])) {
      await interaction.reply({
        content: '❌ Je n\'ai pas les permissions nécessaires dans ce canal (SendMessages, EmbedLinks).',
        flags: 64
      });
      return;
    }

    // Enregistrer le canal
    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.reply({
        content: '❌ Impossible de récupérer l\'ID du serveur.',
        flags: 64
      });
      return;
    }
    await stockage.definirCanal(guildId, type, canalId);

    const typeLabels: { [key: string]: string } = {
      'votes': '🗳️ Votes',
      'weekly': '📅 Plans hebdomadaires',
      'announcements': '📢 Annonces',
      'logs': '📝 Logs'
    };

    const embed = new EmbedBuilder()
      .setTitle('✅ Canal configuré')
      .setDescription(`Le canal ${canal} a été configuré pour ${typeLabels[type] ?? type}.`)
      .addFields(
        { name: '🏷️ Type', value: typeLabels[type] ?? type, inline: true },
        { name: '📍 Canal', value: `${canal}`, inline: true },
        { name: '🆔 ID', value: canalId, inline: true }
      )
      .setColor('#00ff00')
      .setTimestamp()
      .setFooter({ text: `Configuré par ${interaction.user.tag}` });

    await interaction.reply({ embeds: [embed], flags: 64 });
  } catch (error) {
    console.error('Erreur lors de la configuration du canal:', error);
    await interaction.reply({
      content: '❌ Une erreur est survenue lors de la configuration du canal.',
      flags: 64
    });
  }
}