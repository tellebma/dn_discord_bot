import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { creerCommandeStandard } from '@/utils/commandTemplate';
import type { ChatInputCommandInteraction, GuildMember, User } from 'discord.js';

/**
 * Commande pour obtenir les informations sur un utilisateur
 */
const donneesCommande = new SlashCommandBuilder()
  .setName('userinfo')
  .setDescription('Obtenir des informations sur un utilisateur')
  .addUserOption((option: any) =>
    option
      .setName('cible')
      .setDescription('L\'utilisateur dont obtenir les informations')
      .setRequired(false)
  );

export default creerCommandeStandard({
  nom: 'userinfo',
  description: 'Obtenir des informations sur un utilisateur',
  categorie: 'utilitaire',
  permissions: [],
  delaiAttente: 3,
  data: donneesCommande,
  parametres: [
    {
      type: 'user',
      nom: 'cible',
      description: 'L\'utilisateur dont obtenir les informations',
      requis: false,
    },
  ],
  gestionnaire: async (
    interaction: ChatInputCommandInteraction,
    params: Record<string, any>
  ): Promise<void> => {
    const utilisateurCible: User = (params.cible as User) || interaction.user;
    const membre: GuildMember | null = interaction.guild?.members.cache.get(utilisateurCible.id) ?? null;

    const embed = new EmbedBuilder()
      .setTitle(`Informations Utilisateur - ${utilisateurCible.tag}`)
      .setThumbnail(utilisateurCible.displayAvatarURL({ size: 256 }))
      .setColor(membre?.displayHexColor ?? '#0099ff')
      .addFields(
        { name: '👤 Nom d\'utilisateur', value: utilisateurCible.tag, inline: true },
        { name: '🆔 ID Utilisateur', value: utilisateurCible.id, inline: true },
        {
          name: '📅 Compte Créé le',
          value: `<t:${Math.floor(utilisateurCible.createdTimestamp / 1000)}:F>`,
          inline: false,
        }
      );

    if (membre) {
      const roles = membre.roles.cache
        .filter((role: any) => role.name !== '@everyone')
        .map((role: any) => role.toString())
        .join(', ') || 'Aucun';

      embed.addFields(
        {
          name: '📅 A Rejoint le Serveur',
          value: `<t:${Math.floor((membre.joinedTimestamp ?? 0) / 1000)}:F>`,
          inline: false,
        },
        { name: '🎭 Rôles', value: roles, inline: false }
      );
    }

    await interaction.reply({ embeds: [embed] });
  },
});
