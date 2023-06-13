const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shutdownbot')
    .setDescription('Shutdown the bot'),

  async execute(interaction) {
    // Check if the user executing the command has the owner role
    const ownerRoleName = 'Owner'; // Replace with the name of your owner role
    const member = interaction.guild.members.cache.get(interaction.user.id);
    const hasOwnerRole = member.roles.cache.some(role => role.name === ownerRoleName);

    if (!hasOwnerRole) {
      return interaction.reply({
        content: `Only users with the "${ownerRoleName}" role can shut down the bot.`,
        ephemeral: true // Only the user who initiated the command can see this message
      });
    }

    // Shutdown the bot
    await interaction.reply({
      content: 'Shutting down the bot...',
      ephemeral: true // Only the user who initiated the command can see this message
    });

    // Perform any necessary cleanup operations before shutting down
    // ...

    // Gracefully exit the application
    process.exit(0);
  },
};
