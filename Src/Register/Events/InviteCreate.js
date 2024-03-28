const { Events } = require("discord.js");
/**
 * @param {Message} message 
 * @param {Client} client
 */
module.exports = async (invite) => {
    const invites = await invite.guild.invites.fetch();
    const codeUses = new Map();
    invites.each(inv => codeUses.set(inv.code, inv.uses));
    client.invites.set(invite.guild.id, codeUses);
};

module.exports.config = {
    Event: Events.InviteCreate,
    System: true,
};
