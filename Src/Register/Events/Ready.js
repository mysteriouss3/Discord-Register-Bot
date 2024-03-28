const { Events } = require("discord.js");
/**
 * @param {Message} message 
 * @param {Client} client
 */
module.exports = async (client) => {

    const guild = client.guilds.cache.get(System.ServerID);
    if (guild.id === System.ServerID) {
        guild.invites.fetch()
            .then(invites => {
                const codeUses = new Map();
                invites.each(inv => codeUses.set(inv.code, inv.uses));
                client.invites.set(guild.id, codeUses);
            })
    }
    if(System.GuildTags.length > 0){
        setInterval(() => {
            System.GuildTags.forEach(async (tag) => {
                let guild = client.guilds.cache.get(tag.guildID);
                if(!guild) return;
                let members = guild.members.cache.filter(x => x.displayName.includes(tag) && !x.roles.cache.has(tag.roleID));
                members.forEach(async (member) => {
                    await member.roles.add(tag.roleID);
                });
            });
        }, 1000 * 60 * 60);
    }
};

module.exports.config = {
    Event: Events.ClientReady,
    System: true,
};
