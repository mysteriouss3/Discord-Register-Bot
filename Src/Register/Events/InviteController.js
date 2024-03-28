const { Events, EmbedBuilder } = require("discord.js");
const { InviteData } = require("../../../Global/DataBase/Models/Invite");

/**
 * @param {Message} message 
 * @param {Client} client
 */

module.exports = async (member) => {
    try{
        const cachedInvites = client.invites.get(member.guild.id)
        const newInvites = await member.guild.invites.fetch();
        const usedInvite = newInvites.find(inv => cachedInvites.get(inv.code) < inv.uses);
        newInvites.each(inv => cachedInvites.set(inv.code, inv.uses));
        client.invites.set(member.guild.id, cachedInvites);
    
        if (!usedInvite) return;
    
        if (member.guild.premiumTier == 3 && usedInvite.code == member.guild.vanityURLCode) {
            const totalDavet = await InviteData.updateOne({ guildID: member.guild.id, userID: member.id }, { $inc: { GuildInvites: 1 } }, { upsert: true, new: true });
            Send(member.guild, `**${member} Adlı Kullanıcı <t:${Math.floor(Date.now() / 1000)}:R> Sunucuya Katıldı!**\n> **\`Davet Eden;\` Özel URL ( Toplam Daveti ${totalDavet.GuildInvites ?? 1} )**`)
        }
    
        else if (usedInvite.inviter.id == member.user.id) {
            return Send(member.guild, `**${member} Adlı Kullanıcı <t:${Math.floor(Date.now() / 1000)}:R> Sunucuya Katıldı!**\n> **\`Davet Eden;\` Kendi Daveti**`)
        }
    
        else if ((Date.now() - member.user.createdTimestamp) >= 7 * 24 * 60 * 60 * 1000) {
            await InviteData.updateOne({ guildID: member.guild.id, userID: usedInvite.inviter.id }, { $inc: { Regular: 1 } }, { upsert: true });
            await InviteData.updateOne({ guildID: member.guild.id, userID: member.user.id }, { $set: { inviter: usedInvite.inviter.id } }, { upsert: true })
            let data = await InviteData.findOne({ guildID: member.guild.id, userID: usedInvite.inviter.id })
            let toplam = data ? data.Regular : 0;
            Send(member.guild, `**${member} Adlı Kullanıcı <t:${Math.floor(Date.now() / 1000)}:R> Sunucuya Katıldı!**\n> **\`Davet Eden;\` <@${usedInvite.inviter.id}> ${toplam > 0 ? `( Toplam Daveti ${parseInt(toplam)} )` : " "}**`)
        }
        else {
            await InviteData.updateOne({ guildID: member.guild.id, userID: usedInvite.inviter.id }, { $inc: { Fake: 1 } }, { upsert: true });
            await InviteData.updateOne({ guildID: member.guild.id, userID: member.id }, { $set: { inviter: usedInvite.inviter.id } }, { upsert: true })
            let data = await InviteData.findOne({ guildID: member.guild.id, userID: usedInvite.inviter.id });
            let toplam = data ? data.Regular : 0;
            Send(member.guild, `**${member} Adlı Kullanıcı <t:${Math.floor(Date.now() / 1000)}:R> Sunucuya Katıldı!**\n> **\`Davet Eden;\` <@${usedInvite.inviter.id}> ${toplam > 0 ? `( Toplam Daveti ${parseInt(toplam)} )` : " "}**`, 1)
        }
    }
    catch(err){
        console.log(err);
    }
    
}

function Send(guild, message) {
    try{
        let log = guild.kanalBul("invite-log");
        if (!log) return console.error("Sunucuda invite-log Adında Kanal Bulunmadığı İçin Davet Mesajı Gönderemedim!");
        let embed = new EmbedBuilder()
            .setColor("#00ff00")
            .setDescription(`> ✅ ${message}`)
        log.send({ embeds: [embed] })
    }
    catch(err){
        console.log(err);
    }
}

module.exports.config = {
    Event: Events.GuildMemberAdd,
    System: true,
};
