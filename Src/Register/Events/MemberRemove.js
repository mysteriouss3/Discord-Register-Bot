const { Events,EmbedBuilder } = require("discord.js");
const { InviteData } = require("../../../Global/DataBase/Models/Invite");

/**
 * @param {Message} message 
 * @param {Client} client
 */
module.exports = async (member) => {
    
    let createTime = (Date.now() - member.user.createdTimestamp) >= 7 * 24 * 60 * 60 * 1000;

    let url = member.guild.premiumTier == 3 ? await member.guild.fetchVanityData().then(x => x.uses) : 1;

    let data = await InviteData.findOne({ guildId: member.guild.id, userId: member.id });

    if (!data || !data.inviter || data.inviter == null || data.inviter == undefined) {
        Send(member.guild, `**${member} Adlı Kullanıcı <t:${Math.floor(Date.now() / 1000)}:R> Sunucudan Ayrıldı!**\n> **\`Davet Eden;\` Bulunamadı**`)
    } else if (data.inviter == member.guild.id) {
        Send(member.guild, `**${member} Adlı Kullanıcı <t:${Math.floor(Date.now() / 1000)}:R> Sunucudan Ayrıldı!**\n> **\`Davet Eden;\` Özel URL ( Toplam Daveti ${url} )**`)
    } else {
        if (data.inviter == member.user.id) {
            return Send(member.guild, `**${member} Adlı Kullanıcı <t:${Math.floor(Date.now() / 1000)}:R> Sunucudan Ayrıldı!**\n> **\`Davet Eden;\` Kendi Daveti**`)
        }
        if (createTime) {
            await InviteData.updateOne({ guildID: member.guild.id, userID: data.inviter }, { $inc: { Regular: -1, Left: 1 } }, { upsert: true });
            let datainvite = await InviteData.findOne({ guildID: member.guild.id, userID: data.inviter });
            let toplam = datainvite ? datainvite.Regular : 0;
            Send(`**${member} Adlı Kullanıcı <t:${Math.floor(Date.now() / 1000)}:R> Sunucudan Ayrıldı!**\n> **\`Davet Eden;\` <@${data.inviter}> ${toplam > 0 ? `( Toplam Daveti ${parseInt(toplam)} )` : " "}**`)
        } else {
            await InviteData.updateOne({ guildId: member.guild.id, userID: data.inviter }, { $inc: { Fake: -1, Left: 1 } }, { upsert: true });
            let datainvite = await InviteData.findOne({ guildId: member.guild.id, userID: data.inviter });
            let toplam = datainvite ? datainvite.Regular : 0;
            Send(member.guild, `**${member} Adlı Kullanıcı <t:${Math.floor(Date.now() / 1000)}:R> Sunucudan Ayrıldı!**\n> **\`Davet Eden;\` <@${data.inviter}> ${toplam > 0 ? `( Toplam Daveti ${parseInt(toplam)} )` : " "}**`, 1)
        }
    }
};
function Send(guild, message) {
    let log = guild.kanalBul("invite-log");
    if (!log) return console.error("Sunucuda invite-log Adında Kanal Bulunmadığı İçin Davet Mesajı Gönderemedim!");
    let embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setDescription(`> ❌} ${message}`)
    log.send({ embeds: [embed] })
}

module.exports.config = {
    Event: Events.GuildMemberRemove,
    System: true,
};


