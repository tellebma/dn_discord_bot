import { SlashCommandBuilder, EmbedBuilder, CommandInteraction } from 'discord.js';
import { GestionnairePoolJeux } from '@/fonctions/database/gamePool';

/**
 * Commande pour ajouter un jeu au pool
 */
export const data = new SlashCommandBuilder()
  .setName('addgame')
  .setDescription('Ajouter un jeu au pool')
  .addStringOption((option: any) =>
    option.setName('nom').setDescription('Nom du jeu').setRequired(true)
  )
  .addStringOption((option: any) =>
    option.setName('description').setDescription('Description du jeu').setRequired(false)
  )
  .addStringOption((option: any) =>
    option
      .setName('categorie')
      .setDescription('Catégorie du jeu (ex: Stratégie, Action, Party)')
      .setRequired(false)
  )
  .addIntegerOption((option: any) =>
    option
      .setName('joueursmin')
      .setDescription('Nombre minimum de joueurs')
      .setMinValue(1)
      .setRequired(false)
  )
  .addIntegerOption((option: any) =>
    option
      .setName('joueursmax')
      .setDescription('Nombre maximum de joueurs')
      .setMinValue(1)
      .setRequired(false)
  );

export async function execute(interaction: CommandInteraction) {
  const nom = interaction.options.get('nom')?.value as string;
  const description = interaction.options.get('description')?.value as string;
  const categorie = interaction.options.get('categorie')?.value as string;
  const joueursMin = interaction.options.get('joueursmin')?.value as number;
  const joueursMax = interaction.options.get('joueursmax')?.value as number;

  // Validation : le minimum ne peut pas être supérieur au maximum
  if (joueursMin && joueursMax && joueursMin > joueursMax) {
    await interaction.reply({
      content: '❌ Le nombre minimum de joueurs ne peut pas être supérieur au nombre maximum !',
      ephemeral: true,
    });
    return;
  }

  const gestionnaireJeux = GestionnairePoolJeux.getInstance();

  // Vérifie si le jeu existe déjà
  const jeuExistant = gestionnaireJeux.trouverJeu(nom);
  if (jeuExistant) {
    await interaction.reply({
      content: `❌ Un jeu avec le nom "${nom}" existe déjà dans le pool !`,
      ephemeral: true,
    });
    return;
  }

  // Ajoute le nouveau jeu
  const nouveauJeu = gestionnaireJeux.ajouterJeu({
    nom,
    description,
    categorie,
    joueursMin,
    joueursMax,
    ajoutePar: interaction.user.id,
  });

  // Crée l'embed de confirmation
  const embed = new EmbedBuilder()
    .setTitle('✅ Jeu Ajouté avec Succès !')
    .setColor(0x00ff00)
    .addFields(
      { name: 'Nom', value: nouveauJeu.nom, inline: true },
      { name: 'Ajouté par', value: `<@${nouveauJeu.ajoutePar}>`, inline: true },
      { name: 'ID du Jeu', value: nouveauJeu.id, inline: true }
    )
    .setTimestamp();

  if (nouveauJeu.description) {
    embed.addFields({ name: 'Description', value: nouveauJeu.description });
  }

  if (nouveauJeu.categorie) {
    embed.addFields({ name: 'Catégorie', value: nouveauJeu.categorie, inline: true });
  }

  if (nouveauJeu.joueursMin || nouveauJeu.joueursMax) {
    const joueurs =
      nouveauJeu.joueursMin && nouveauJeu.joueursMax
        ? `${nouveauJeu.joueursMin}-${nouveauJeu.joueursMax}`
        : nouveauJeu.joueursMin
          ? `${nouveauJeu.joueursMin}+`
          : `jusqu'à ${nouveauJeu.joueursMax}`;
    embed.addFields({ name: 'Joueurs', value: joueurs, inline: true });
  }

  await interaction.reply({ embeds: [embed] });
}
