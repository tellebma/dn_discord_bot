import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { creerCommandeStandard } from '@/utils/commandTemplate';
import type { ChatInputCommandInteraction, Guild, GuildMember } from 'discord.js';

/**
 * Commande pour obtenir les informations sur le serveur
 */
const donneesCommande = new SlashCommandBuilder()
  .setName('serverinfo')
  .setDescription('Obtenir des informations sur ce serveur');

export default creerCommandeStandard({
  nom: 'serverinfo',
  description: 'Obtenir des informations sur ce serveur',
  categorie: 'utilitaire',
  permissions: [],
  delaiAttente: 5,
  data: donneesCommande,
  parametres: [],
  gestionnaire: async (
    interaction: ChatInputCommandInteraction,
    _params: Record<string, any>
  ): Promise<void> => {
    if (!interaction.guild) {
      await interaction.reply({
        content: '❌ Cette commande ne peut être utilisée que dans un serveur !',
        ephemeral: true,
      });
      return;
    }

    const serveur: Guild = interaction.guild;
    const proprietaire: GuildMember = await serveur.fetchOwner();

    const embed = new EmbedBuilder()
      .setTitle(`Informations du Serveur - ${serveur.name}`)
      .setThumbnail(serveur.iconURL({ size: 256 }))
      .setColor('#0099ff')
      .addFields(
        { name: '👑 Propriétaire', value: proprietaire.user.tag, inline: true },
        { name: '🆔 ID du Serveur', value: serveur.id, inline: true },
        {
          name: '📅 Créé le',
          value: `<t:${Math.floor(serveur.createdTimestamp / 1000)}:F>`,
          inline: false,
        },
        { name: '👥 Membres', value: `${serveur.memberCount}`, inline: true },
        { name: '📋 Canaux', value: `${serveur.channels.cache.size}`, inline: true },
        { name: '🎭 Rôles', value: `${serveur.roles.cache.size}`, inline: true },
        { name: '😀 Émojis', value: `${serveur.emojis.cache.size}`, inline: true },
        { name: '🔒 Niveau de Vérification', value: serveur.verificationLevel.toString(), inline: true },
        { name: '🛡️ Niveau de Boost', value: `Niveau ${serveur.premiumTier}`, inline: true }
      );

    if (serveur.description) {
      embed.setDescription(serveur.description);
    }

    await interaction.reply({ embeds: [embed] });
  },
});
