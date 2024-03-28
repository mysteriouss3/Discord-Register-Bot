const { Events } = require("discord.js");
/**
 * @param {Message} message 
 * @param {Client} client
 */
module.exports = async (invite) => {
    const invites = await invite.guild.invites.fetch();
    if (!invites) return;
    
    invites.delete(invite.code);
    client.invites.delete(invite.guild.id, invites);
};

module.exports.config = {
    Event: Events.InviteDelete,
    System: true,
};
