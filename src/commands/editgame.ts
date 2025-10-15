import { SlashCommandBuilder, EmbedBuilder, CommandInteraction, PermissionFlagsBits } from 'discord.js';
import { GestionnairePoolJeux } from '@/fonctions/database/gamePool';

/**
 * Commande pour modifier un jeu existant
 */
export const data = new SlashCommandBuilder()
  .setName('editgame')
  .setDescription('Modifier un jeu existant du pool')
  .addStringOption((option: any) =>
    option.setName('jeu')
      .setDescription('Jeu à modifier')
      .setRequired(true)
      .setAutocomplete(true))
  .addStringOption((option: any) =>
    option.setName('nouveau_nom')
      .setDescription('Nouveau nom du jeu')
      .setRequired(false))
  .addStringOption((option: any) =>
    option.setName('description')
      .setDescription('Nouvelle description')
      .setRequired(false))
  .addStringOption((option: any) =>
    option.setName('categorie')
      .setDescription('Nouvelle catégorie')
      .setRequired(false))
  .addIntegerOption((option: any) =>
    option.setName('joueursmin')
      .setDescription('Nouveau nombre minimum de joueurs')
      .setMinValue(1)
      .setRequired(false))
  .addIntegerOption((option: any) =>
    option.setName('joueursmax')
      .setDescription('Nouveau nombre maximum de joueurs')
      .setMinValue(1)
      .setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction: CommandInteraction) {
  const entreeJeu = interaction.options.get('jeu')?.value as string;
  const nouveauNom = interaction.options.get('nouveau_nom')?.value as string;
  const description = interaction.options.get('description')?.value as string;
  const categorie = interaction.options.get('categorie')?.value as string;
  const joueursMin = interaction.options.get('joueursmin')?.value as number;
  const joueursMax = interaction.options.get('joueursmax')?.value as number;

  const gestionnaireJeux = GestionnairePoolJeux.getInstance();
  const jeu = gestionnaireJeux.trouverJeu(entreeJeu);

  if (!jeu) {
    await interaction.reply({
      content: `❌ Jeu "${entreeJeu}" introuvable !`,
      ephemeral: true
    });
    return;
  }

  // Validation
  if (joueursMin && joueursMax && joueursMin > joueursMax) {
    await interaction.reply({
      content: '❌ Le nombre minimum ne peut pas être supérieur au maximum !',
      ephemeral: true
    });
    return;
  }

  // Construire les mises à jour
  const miseAJour: any = {};
  if (nouveauNom) miseAJour.nom = nouveauNom;
  if (description !== undefined) miseAJour.description = description;
  if (categorie !== undefined) miseAJour.categorie = categorie;
  if (joueursMin !== undefined) miseAJour.joueursMin = joueursMin;
  if (joueursMax !== undefined) miseAJour.joueursMax = joueursMax;

  if (Object.keys(miseAJour).length === 0) {
    await interaction.reply({
      content: '❌ Aucune modification spécifiée ! Veuillez fournir au moins un champ à modifier.',
      ephemeral: true
    });
    return;
  }

  const jeuModifie = gestionnaireJeux.mettreAJourJeu(jeu.id, miseAJour);

  if (jeuModifie) {
    const embed = new EmbedBuilder()
      .setTitle('✅ Jeu Modifié avec Succès')
      .setDescription(`Le jeu **${jeu.nom}** a été mis à jour.`)
      .setColor(0x00FF00)
      .addFields(
        { name: 'Nouveau Nom', value: jeuModifie.nom, inline: true },
        { name: 'Modifié par', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'ID', value: jeuModifie.id, inline: true }
      )
      .setTimestamp();

    if (jeuModifie.description) {
      embed.addFields({ name: 'Description', value: jeuModifie.description });
    }

    if (jeuModifie.categorie) {
      embed.addFields({ name: 'Catégorie', value: jeuModifie.categorie, inline: true });
    }

    if (jeuModifie.joueursMin || jeuModifie.joueursMax) {
      const joueurs = jeuModifie.joueursMin && jeuModifie.joueursMax 
        ? `${jeuModifie.joueursMin}-${jeuModifie.joueursMax}` 
        : jeuModifie.joueursMin 
        ? `${jeuModifie.joueursMin}+` 
        : `jusqu'à ${jeuModifie.joueursMax}`;
      embed.addFields({ name: 'Joueurs', value: joueurs, inline: true });
    }

    // Afficher ce qui a changé
    const modifications = Object.keys(miseAJour).map(key => {
      const labels: any = {
        nom: 'Nom',
        description: 'Description',
        categorie: 'Catégorie',
        joueursMin: 'Joueurs Min',
        joueursMax: 'Joueurs Max'
      };
      return `• ${labels[key] || key}`;
    }).join('\n');

    embed.addFields({
      name: '📝 Modifications Appliquées',
      value: modifications,
      inline: false
    });

    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({
      content: '❌ Erreur lors de la modification du jeu.',
      ephemeral: true
    });
  }
}

/**
 * Autocomplétion pour la recherche de jeux
 */
export async function autocomplete(interaction: any) {
  const focusedValue = interaction.options.getFocused();
  const gestionnaireJeux = GestionnairePoolJeux.getInstance();
  const jeux = gestionnaireJeux.obtenirJeux();

  const filtered = jeux
    .filter(jeu => 
      jeu.nom.toLowerCase().includes(focusedValue.toLowerCase()) ||
      jeu.id.includes(focusedValue)
    )
    .slice(0, 25);

  await interaction.respond(
    filtered.map(jeu => ({
      name: `${jeu.nom}${jeu.categorie ? ` (${jeu.categorie})` : ''}`,
      value: jeu.id
    }))
  );
}



