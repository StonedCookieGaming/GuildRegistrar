const { SlashCommandBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('disbandguild')
    .setDescription('Use this command to disband your guild')
    .addRoleOption(option =>
      option.setName('guildname')
        .setDescription('Please specify your guild name to disband')
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.member;
    const guildRole = interaction.options.getRole('guildname');

    // Check if the player has the necessary permissions
    const hasGuildMasterRole = member.roles.cache.some(role => role.name === 'Guild Master');
    const hasMentionedRole = member.roles.cache.has(guildRole.id);
    if (!hasGuildMasterRole || !hasMentionedRole) {
      await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      return;
    }

    // Confirmation message
    const confirmationMessage = `Are you sure you want to disband your guild? This action cannot be undone.`;

    // Create the buttons
    const confirmButton = new ButtonBuilder()
      .setCustomId('confirm')
      .setLabel('Confirm')
      .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
      .setCustomId('cancel')
      .setLabel('No')
      .setStyle(ButtonStyle.Primary);

    // Create the action row and add the buttons
    const actionRow = new ActionRowBuilder()
      .addComponents(confirmButton, cancelButton);

    try {
      // Reply with the confirmation message and buttons
      const reply = await interaction.reply({
        content: confirmationMessage,
        components: [actionRow],
        ephemeral: true
      });

      // Wait for the user's response
      const filter = (i) => i.user.id === interaction.user.id;

      // Wait for the user to click a button
      const collector = reply.createMessageComponentCollector({ filter, time: 60000 });

      let confirmed = false; // Flag to track confirmation status

      collector.on('collect', async (i) => {
        // If the user confirms, remove the guild master role and delete the guild role
        if (i.customId === 'confirm') {
          confirmed = true; // Set confirmation flag

          const guildMasterRole = member.roles.cache.find(role => role.name === 'Guild Master');
          if (guildMasterRole) {
            await member.roles.remove(guildMasterRole);
          }

          await guildRole.delete();

          interaction.followUp({
            content: `Your guild has been disbanded.`,
            ephemeral: true
          });
        } else if (i.customId === 'cancel') {
          interaction.followUp({
            content: 'Guild disbandment cancelled.',
            ephemeral: true
          });
        }

        // Delete the reply message
        reply.delete().catch(console.error);
      });

      collector.on('end', () => {
        if (!confirmed) {
          // If the user didn't confirm, there's no need to send a timeout message
          reply.delete().catch(console.error);
        }
      });
    } catch (error) {
      console.error(error);
      interaction.followUp({
        content: 'An error occurred while processing the guild disbandment request.',
        ephemeral: true
      }).catch(console.error);
    }
  },
};
