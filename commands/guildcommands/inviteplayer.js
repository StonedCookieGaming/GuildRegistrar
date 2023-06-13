const { SlashCommandBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inviteplayer')
    .setDescription('Invite a player to your guild')
    .addUserOption(option =>
      option.setName('playername')
        .setDescription('Mention the player to invite')
        .setRequired(true)
    )
    .addRoleOption(option =>
      option.setName('guildname')
        .setDescription('Select the guild role to assign to the player')
        .setRequired(true)
    ),

  async execute(interaction) {
    const player = interaction.options.getUser('playername');
    const inviter = interaction.member;
    const guildRole = interaction.options.getRole('guildname');

    // Check if the inviter has the necessary permissions
    const hasGuildMasterRole = inviter.roles.cache.some(role => role.name === 'Guild Master');
    const hasMentionedRole = inviter.roles.cache.has(guildRole.id);
    if (!hasGuildMasterRole || !hasMentionedRole) {
      await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      return;
    }

    try {
      // Create the invitation message
      const inviteMessage = `You have been invited to join ${guildRole.name} by ${inviter.displayName}.`;

      // Create the buttons
      const acceptButton = new ButtonBuilder()
        .setCustomId('accept_invite')
        .setLabel('Accept Invite')
        .setStyle(ButtonStyle.Primary);

      const declineButton = new ButtonBuilder()
        .setCustomId('decline_invite')
        .setLabel('Decline Invite')
        .setStyle(ButtonStyle.Danger);

      // Create the action row and add the buttons
      const actionRow = new ActionRowBuilder()
        .addComponents(acceptButton, declineButton);

      // Send the invitation message to the player with buttons
      const inviteMessageSent = await player.send({ content: inviteMessage, components: [actionRow] });

      // Send success message to inviter
      await interaction.reply({ content: `Invitation sent to ${player.username}.`, ephemeral: true });

      // Wait for button interaction from the invitee
      const inviteeFilter = (buttonInteraction) =>
        buttonInteraction.user.id === player.id && buttonInteraction.message.id === inviteMessageSent.id;
      const collector = inviteMessageSent.createMessageComponentCollector({ filter: inviteeFilter, time: 60000 });

      // Handle button interactions
      collector.on('collect', async (buttonInteraction) => {
        if (buttonInteraction.customId === 'accept_invite') {
          // Handle accept invite button
          await buttonInteraction.deferUpdate();
          // Add the guild role to the invitee
          if (guildRole) {
            const guild = interaction.guild;
            const invitedMember = await guild.members.fetch(player.id);
            if (!invitedMember.roles.cache.some(role => role.id === guildRole.id)) {
              await invitedMember.roles.add(guildRole);
            }
          }
          // Send a message to the invitee to confirm acceptance
          await buttonInteraction.user.send(`Guild invitation accepted. Welcome to ${guildRole.name}!`);
          // Delete the invite message
          await inviteMessageSent.delete();

        } else if (buttonInteraction.customId === 'decline_invite') {
          // Handle decline invite button
          await buttonInteraction.deferUpdate();
          // Send a message to the invitee to confirm decline
          await buttonInteraction.user.send('You have declined the guild invitation.');
          // Delete the invite message
          await inviteMessageSent.delete();
        }
      });

      // Handle timeout
      collector.on('end', async () => {
        // Remove buttons from the invite message after timeout
        await inviteMessageSent.edit({ components: [] });
      });

    } catch (error) {
      console.error('Error sending invitation:', error);
      await interaction.reply({ content: `An error occurred while sending the invitation to ${player.username}.`, ephemeral: true });
    }
  },
};
