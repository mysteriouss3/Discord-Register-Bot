const { Events, EmbedBuilder } = require("discord.js");
const { SetupModel } = require("../../../Global/DataBase/Models/GuildModel")

/**
 * @param {Message} message 
 * @param {Client} client
 */

module.exports = async (member) => {
    if (member.user.bot) return;
    if (!member) return;
    const Guild = member.guild;

    try {
        const Ayarlar = await SetupModel.findOne({ guildID: Guild.id })
        if (!Ayarlar || !Ayarlar.Setup || !Ayarlar.Setup.suspectedRole
            || !Ayarlar.Setup.registerChannel || !Ayarlar.Setup.registerAuth
            || !Ayarlar.Setup.unregisterRoles) {
            const owner = Guild.getUser(Guild.ownerId)
            if (!Ayarlar) return owner.send("Sunucu Ayarları Yapılmadığı İçin Kayıt Sistemi Çalışmıyor!").catch(() => { })
        }
        console.log(System.YasaklıTaglar)
        if (System.YasaklıTaglar.length > 0) {
            System.YasaklıTaglar.forEach(async (tag) => {
                if (member.user.globalName.includes(tag)) {
                    member.roles.add(Ayarlar.Setup.bannedTagRole)
                    return member.setNickname(`${tag} Yasaklı Tag`).catch();
                }
                else if(member.user.username.includes(tag)){
                    member.roles.add(Ayarlar.Setup.bannedTagRole)
                    return member.setNickname(`${tag} Yasaklı Tag`).catch();
                }
            });
        }


        if(Ayarlar.Setup.registerChannel){
            const registerchat = Guild.kanalBul(Ayarlar.Setup.registerChannel)
            if(registerchat){
                registerchat.send({content: `<@${member.id}> Sunucumuza Hoşgeldin! :tada: Kayıt Olmak İçin <@&${Ayarlar.Setup.registerAuth}> Rolündeki Yetkilileri Bekleyebilirsin!`}).catch(() => { })
            }
        }


        const Güvenirlik = (Date.now() - member.user.createdTimestamp) >= 7 * 24 * 60 * 60 * 1000;


        if (!Güvenirlik) {
            return Guild.rolBul(Ayarlar.Setup.suspectedRole).then(x => member.roles.add(x.id)).catch();
        }
        else{

            if (Ayarlar?.Setup?.unregisterRoles?.length >= 1) {
                if(member.manageable) {
                    Ayarlar.Setup.unregisterRoles.map(x => member.roles.add(x))
                }
            }
        } 
        if (System.GuildTags.length > 0) {
            let foundTag = false;
            System.GuildTags.forEach(async (tag) => {
                if (member.user.globalName.includes(tag)) {
                    if(member.manageable){
                        if(Ayarlar.Setup.changeName === 'Kapalı') return member.setNickname(`${tag} ${member.user.globalName}`);
                        member.setNickname(System.NewUserName).catch();
                    }
                    foundTag = true;
                }
            });
            if (!foundTag) {
                if(member.manageable){
                    if(Ayarlar.Setup.changeName === 'Kapalı') return;
                    member.setNickname(System.NewUserName).catch();
                }
                
            }
        } else {
            if(member.manageable) return;
            member.setNickname(System.NewUserName).catch();
        }
        
        
    }
    catch (err) {
        console.log(err);
    }
}

module.exports.config = {
    Event: Events.GuildMemberAdd,
    System: true,
};
