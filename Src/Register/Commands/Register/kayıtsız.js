const { ButtonStyle, ButtonBuilder, ActionRowBuilder, EmbedBuilder, codeBlock } = require("discord.js")
const { RegisterModel } = require("../../../../Global/DataBase/Models/Register");
const { SetupModel } = require("../../../../Global/DataBase/Models/GuildModel")
const Limit = new Map();
module.exports = {
    Isim: "kayıtsız",
    Komut: ["ug"],
    Kullanim: "",
    Kategori: "",
    Aciklama: "",
    Active: true,
    Cooldown: 3500,
    Config: {
        Permissions: [],
        Mode: false
    },

    /**
    * @param {Client} client 
    */
    onLoad: function (client) {

    },

    /**
    * @param {Client} client 
    * @param {Message} message 
    * @param {Array<String>} args 
    */

    onRequest: async function (__, message, args) {
        if (!args[0]) {
            message.reply({ content: `Bir kullanıcı etiketlemelisin ya da ID'sini girmelisin.` }).sil(5)
            return
        }

        const member = message.guild.members.cache.get(args[0]) || message.mentions.members.first() || message.member;

        if (!member) {
            message.reply({ content: `Bir kullanıcı etiketlemelisin ya da ID'sini girmelisin.\nÖrn: .kayıtsız @Mysterious3` }).sil(5)
            return
        }
        if (!member.manageable) {
            message.reply({ content: `Böyle birisini kayıt edemiyorum!` })
            return
        }
        
        if (member.id === message.author.id) return message.channel.send({ content: "Kendini kayıtsıza atamazsın." })
        if (member.id === message.guild.ownerId) return message.channel.send({ content: "Sunucu sahibini kayıtsıza atamazın." })
        if (member.roles.highest.position >= message.member.roles.highest.position) return message.channel.send({ content: "Bu kullanıcı senden üst/aynı pozisyonda." })
        const Ayarlar = await SetupModel.findOne({ guildID: message.guild.id })
        if(Ayarlar.Setup.unregistered){
            if(Limit.get(message.author.id) >= Ayarlar.Setup.unregistered){
                message.channel.send({ content: "Kayıtsız Limitini aştınız!" })
                return
            }
            Limit.set(message.author.id, (Limit.get(message.author.id) || 0) + 1)
        }
        if(!Ayarlar || !Ayarlar.Setup || !Ayarlar.Setup.unregisterRoles || !Ayarlar.Setup.unregisterRoles.length) return message.channel.send({ content: "Kayıtsız rolü ayarlanmamış." })
        if(member.manageable) {
            Ayarlar.Setup.unregisterRoles.map(x => member.roles.set([x]))
        }
        if(member.manageable) member.setNickname(`${System.NewUserName}`).catch(() => { })
        await message.channel.send({ content: `Başarıyla ${member} üyesi kayıtsıza atıldı!` })
    }
};