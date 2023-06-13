const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('newguild')
    .setDescription('Creates a customized role for your guild')
    .addStringOption(option =>
      option.setName('guildname')
        .setDescription('Please specify your guild name')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('color')
        .setDescription('Select the color for your role')
        .setRequired(true)
    ),
  async execute(interaction) {
    const guildName = interaction.options.getString('guildname');
    const colorInput = interaction.options.getString('color');

    const guild = interaction.guild;
    const member = guild.members.cache.get(interaction.user.id);

    // Parse the color input
    let color;
    if (colorInput.startsWith('#')) {
      // Hex color value
      color = colorInput;
    } else {
      // Color word
      color = getColorValue(colorInput.toLowerCase());
    }

    if (!color) {
      interaction.reply({
        content: 'Invalid color value. Please provide a valid hex value or color word.',
        ephemeral: true
      });
      return;
    }

    // Check if a role with the same name already exists
    const existingRole = guild.roles.cache.find(role => role.name === guildName);
    if (existingRole) {
      interaction.reply({
        content: 'A guild role with the same name already exists.',
        ephemeral: true
      });
      return;
    }

    // Create the guild role
    const role = await guild.roles.create({
      name: guildName,
      color: color,
    });

    // Set the role as mentionable so it can be easily assigned
    await role.edit({ mentionable: true });

    // Get the guild master role
    const guildMasterRole = guild.roles.cache.find(role => role.name === 'Guild Master');

    if (guildMasterRole) {
      // Get the position of the guild master role
      const guildMasterPosition = guildMasterRole.position;

      // Set the position of the created role to be above the guild master role
      await role.edit({ position: guildMasterPosition + 1 });

      // Assign the guild master role to the member
      await member.roles.add(guildMasterRole);
    }

    // Assign the role to the member who initiated the command
    await member.roles.add(role);

    const response = `Guild ${role.name} successfully registered.`;
    interaction.reply({
      content: response,
      ephemeral: true // Only the user who initiated the command can see this message
    });
  }
};

// Function to get the color value from a color word
function getColorValue(colorWord) {
  const colorMap = {
    red: '#FF0000',
    green: '#00FF00',
    blue: '#0000FF',
    cyan: '#00FFFF',
    magenta: '#FF00FF',
    yellow: '#FFFF00',
    black: '#020202',
    white: '#FFFFFF',
    gray: '#808080',
    // Add more color mappings as needed
  };

  return colorMap[colorWord];
}
