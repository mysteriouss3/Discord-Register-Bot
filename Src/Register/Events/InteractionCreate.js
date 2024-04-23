const { Events, EmbedBuilder, ChannelType, Colors } = require("discord.js");
const { SetupModel } = require('../../../Global/DataBase/Models/GuildModel')
const { RegisterModel } = require('../../../Global/DataBase/Models/Register')

const axios = require('axios');
/**
 * @param {Message} message 
 * @param {Client} client
 */
module.exports = async (interaction) => {
    const embed = new EmbedBuilder()
        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ size: 128, extension: 'png' }) })
        .setFooter({ text: "By mysterious3" })
        .setColor('Random')

    if (interaction.isButton()) {
        const KayıtShema = await SetupModel.findOne({ guildID: interaction.guild.id });

        if (interaction.customId === "yapayzeka") {
            if (KayıtShema.registerSystem == 'Kapalı') {
                return interaction.reply({
                    content: `🔒 Kayıtlar yönetici tarafından __geçici bir süreliğine kapatılmıştır.__ Lütfen bu süreçte beklemede kalın. Anlayışla karşıladığınız için teşekkürler!`,
                })
            }

            if (((!KayıtShema.Setup.manRoles ||
                !KayıtShema.Setup.manRoles.length ||
                !KayıtShema.Setup.manRoles.some((r) => interaction.guild.roles.cache.has(r))) &&
                (!KayıtShema.Setup.womanRoles ||
                    !KayıtShema.Setup.womanRoles.length ||
                    !KayıtShema.Setup.womanRoles.some((r) => interaction.guild.roles.cache.has(r)))) ||
                (KayıtShema.Setup.registeredRole && !interaction.guild.roles.cache.has(KayıtShema.Setup.registeredRole))
            ) {
                return interaction.reply('Rol ayarı yapılmamış.');
            }

            if (!KayıtShema || !KayıtShema.Setup || !KayıtShema.Setup.registerParent || !KayıtShema.Setup.registerChannel || !KayıtShema.Setup.registerAuth) {
                const owner = interaction.guild.members.cache.get(interaction.guild.ownerId)
                if (owner) {
                    owner.send({ content: `${interaction.guild.name} Sunucusunda Kayıt sistemi ayarlanmadığı için yeni üyeler kayıt olamıyor! \`.setup\` komutu ile kayıt sistemini aktif etmelisiniz!` }).catch(() => { })
                }
                return interaction.reply({ content: "Otomatik Kayıt Sistemi Aktif Edilmediği Icin Kayıt Olamassın!", ephemeral: true })
            }
            const getData = await FetchUser(interaction.user.id)
            if (!getData) return interaction.reply({ content: "Mys API sizinle ilgili bilgileri bulamadı!", ephemeral: true })

            const Name = getData.data["TopName"] ?? undefined;
            const Age = getData.data["TopAge"] ?? undefined;
            const Sex = getData.data["TopSex"] ?? undefined;

            if (!Name || !Age || !Sex) return interaction.reply({ content: "Mys API sizinle ilgili bilgileri bulamadı!", ephemeral: true })

            const yaş = !isNaN(Age) || undefined; // İlk sayıyı yaş olarak alır, yoksa undefined
            const isim = Name.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ\s]/g, "");
            const isimYaş = isim + ` ${System.DefultNameSembol} ` + yaş;


            if (isim && yaş) {
                if (isim.length > 12) return interaction.channel.send({ content: "Kayıt etmeye çalıştığınız kullanıcı'nın ismi 12 karakterden büyük olamaz." })
                if (yaş.length > 2) return interaction.channel.send({ content: "Kayıt etmeye çalıştığınız kullanıcı'nın yaşı 2 karakterden büyük olamaz." })
                if (parseInt(yaş, 10) <= System.MinAge) return interaction.channel.send({ content: `Kayıt etmeye çalıştığınız kullanıcı'nın yaşı ${System.MinAge}'dan küçük olamaz.` })
            }
            const member = interaction.guild.members.cache.get(interaction.user.id)

            if (member.roles.cache.has(KayıtShema.Setup.suspectedRole)) return interaction.reply({ content: "Hesabınızı yeni oluşturduğunuz için şüpheli olarak işaretlendiniz! kaydınız tamamlanamıyor! ❌", ephemeral: true })
            if (member.roles.cache.has(KayıtShema.Setup.registeredRole)) return interaction.reply({ content: "Zaten kayıtlısınız. ❌", ephemeral: true })

            if (KayıtShema.Setup.taggedMode === 'Acik') {
                if (System.GuildTags.length > 0) {
                    const containsAllTags = System.GuildTags.every((tag) => member.user.globalName.includes(tag));
                    if (!containsAllTags) {
                        return interaction.reply({ content: "Yöneticiler \`Taglı Alım\` modunu Aktif ettiği için, üzerinizde \`Sunucu Tagı Bulunmadığı Icin\` kayıt olamassınız! ❌", ephemeral: true })
                    }
                }
            }


            const rolesToCheck = [...(KayıtShema.Setup.manRoles || []), ...(KayıtShema.Setup.womanRoles || []), KayıtShema.Setup.registeredRole];

            if (rolesToCheck.some(role => !member.roles.cache.has(role))) {
                const DB = await RegisterModel.findOne({ guildID: interaction.guild.id, userID: member.id });
                if (!DB) {
                    const lastRole = Sex == 'Erkek' ? [...KayıtShema.Setup.manRoles] : [...KayıtShema.Setup.womanRoles];
                    const Veri = new RegisterModel({
                        guildID: interaction.guild.id,
                        userID: member.id,
                        Nick: isimYaş,
                        Names: [{ admin: 'Yapay Zeka', time: Date.now(), name: isimYaş }],
                        Roles: [{ admin: 'Yapay Zeka', time: Date.now(), roles: [KayıtShema.Setup.registeredRole, lastRole] }],
                        Staff: 'Yapay Zeka',
                    });
                    Veri.save().catch(() => { });
                    if (KayıtShema.Setup.nameAgeSystem === 'Kapali') {
                        if (isim || yaş) {
                            member.roles.remove([]).then(() => { member.roles.add([KayıtShema.Setup.registeredRole,, lastRole]) });
                        }
                    }
                    if (KayıtShema.Setup.needAge === 'Acik') {
                        if (isim || yaş) {
                            member.roles.remove([]).then(() => { member.roles.add([KayıtShema.Setup.registeredRole,lastRole]) });
                            member.setNickname(isimYaş).catch(() => { })
                        }
                    }
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder({
                                color: Colors.Blue,
                                description: `${member} (${inlineCode(member.id)})\nIsminiz : ${Name}\nYaşınız: ${Age}\nCinsiyetiniz:${Sex}\nYapay Zeka Tarafından Kayıt Edildi!`,
                            }),
                        ],
                    });
                }
                else {
                    if (KayıtShema.Setup.nameAgeSystem === 'Kapali') {
                        member.roles.remove([]).then(() => { member.roles.add([DB.Roles[0].roles]) });
                    }
                    if (KayıtShema.Setup.needAge === 'Acik') {
                        member.roles.remove([]).then(() => { member.roles.add([KayıtShema.Setup.registeredRole]) });
                        member.setNickname(DB.Nick).catch(() => { })
                    }
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder({
                                color: Colors.Blue,
                                description: `${member} (${inlineCode(member.id)}) ${DB.Nick} adli kullanıcı Yapay Zeka Tarafından Kayıt Edildi!`,
                            }),
                        ],
                    });
                }
            }
            else {
                return interaction.reply({ content: "Zaten kayıtlısınız. ❌" })
            }
        }
        else if (interaction.customId === "cagır") {

            if (!KayıtShema || !KayıtShema.Setup || !KayıtShema.Setup.registerParent || !KayıtShema.Setup.registerChannel || !KayıtShema.Setup.registerAuth) {
                const owner = interaction.guild.members.cache.get(interaction.guild.ownerId)
                if (owner) {
                    await owner.send({ content: `${interaction.guild.name} Sunucusunda Kayıt sistemi ayarlanmadığı için yeni üyeler kayıt olamıyor! \`.setup\` komutu ile kayıt sistemini aktif etmelisiniz!` }).catch(() => { })
                }
                return interaction.reply({ content: "Kayıt Sistemi Aktif Edilmediği İçin Kayıtcı Çağıramassın!", ephemeral: true })
            }

            if (!interaction.member.voice.channelId) {
                const categoryId = KayıtShema.Setup.registerParent;
                const kanallar = interaction.guild.channels.cache.filter(channel => channel.parentId === categoryId && channel.type === ChannelType.GuildVoice).map(channel => `<#${channel.id}>`).join(",");
                if (kanallar.length > 0) {
                    const veri = kanallar.split(",")
                    const randomChannelId = veri[Math.floor(Math.random() * veri.length)];
                    return interaction.reply({ content: `Kayıt Ses Kanallarında Bulunmadığın Icin Kayıtcı Cağıramassın! Lütfen ${randomChannelId} ses kanalına giriniz.`, ephemeral: true })
                }
            }
            if (interaction.member.voice.channelId) {
                const Ses = interaction.member.voice.guild.kanalBul(interaction.member.voice.channelId)
                if (Ses.parentId === KayıtShema.Setup.registerParent) {
                    const registerchat = interaction.guild.kanalBul(KayıtShema.Setup.registerChannel)
                    if (registerchat) {
                        await interaction.deferUpdate()
                        registerchat.send({ content: `${interaction.member} => <@&${KayıtShema.Setup.registerAuth}> <#${interaction.member.voice.channelId}> Ses Kanalında Kayıt yetkilisini Çağırıyor...` })
                    }
                }
                else {
                    const categoryId = KayıtShema.Setup.registerParent;
                    const kanallar = interaction.guild.channels.cache.filter(channel => channel.parentId === categoryId && channel.type === ChannelType.GuildVoice).map(channel => `<#${channel.id}>`).join(",");
                    if (kanallar.length > 0) {
                        const veri = kanallar.split(",")
                        const randomChannelId = veri[Math.floor(Math.random() * veri.length)];
                        return interaction.reply({ content: `Kayıt Ses Kanallarında Bulunmadığın Icin Kayıtcı Cağıramassın! Lütfen ${randomChannelId} ses kanalına giriniz.`, ephemeral: true })
                    }
                }
            }
        }
        else if (interaction.customId === "kayıt") {

            const data = await FetchUser(interaction.user.id).catch((error) => { console.error('Hata:', error) });
            if (!data) return interaction.reply({ content: "Mys API sizinle ilgili bilgileri bulamadı!", ephemeral: true })
            if (!data.data["GuildsDisplayNames"]) return interaction.reply({ content: "Mys API sizinle ilgili bilgileri bulamadı!", ephemeral: true })

            const OtherName = data.data["GuildsDisplayNames"].map((x) => x).join("\n");
            interaction.reply({ embeds: [embed.setDescription(`Diğer Sunuculardaki Isim Kayıtlarınız ;\n\`\`\`${OtherName}\`\`\``)], ephemeral: true })
        }
    }
};

async function FetchUser(userId) {
    const apiUrl = `https://discordpanel.vercel.app/api/user/${userId}`;
    // Axios ile GET isteği gönderme
    const getData = await axios.get(apiUrl, {
    }).catch((error) => { console.error('Hata:', error) });
    return getData
}

module.exports.config = {
    Event: Events.InteractionCreate,
    System: true,
};
