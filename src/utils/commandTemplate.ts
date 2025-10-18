/**
 * Template de commande
 */
export function creerCommandeStandard(nom: string, description: string, options: any[] = []) {
  return {
    data: {
      name: nom,
      description: description,
      options: options,
    },
    execute: async (interaction: any) => {
      await interaction.reply({
        content: `Commande ${nom} exécutée !`,
        flags: 64,
      });
    },
  };
}
