const { Events, EmbedBuilder, ChannelType } = require("discord.js");
const { SetupModel } = require('../../../Global/DataBase/Models/GuildModel')

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
            if (!KayıtShema || !KayıtShema.Setup || !KayıtShema.Setup.registerParent || !KayıtShema.Setup.registerChannel || !KayıtShema.Setup.registerAuth) {
                const owner = interaction.guild.members.cache.get(interaction.guild.ownerId)
                if (owner) {
                    owner.send({ content: `${interaction.guild.name} Sunucusunda Kayıt sistemi ayarlanmadığı için yeni üyeler kayıt olamıyor! \`.setup\` komutu ile kayıt sistemini aktif etmelisiniz!` }).catch(() => { })
                }
                return interaction.reply({ content: "Otomatik Kayıt Sistemi Aktif Edilmediği Icin Kayıt Olamassın!", ephemeral: true })
            }
            const getData = await FetchUser(interaction.user.id)
            if (!getData) return interaction.reply({ content: "Mys API sizinle ilgili bilgileri bulamadı!", ephemeral: true })
            if (!getData.data["User"]) return interaction.reply({ content: "Mys API sizinle ilgili bilgileri bulamadı!", ephemeral: true })
            if (!getData.data["User"].mostCommonName) return interaction.reply({ content: "Mys API sizinle ilgili bilgileri bulamadı!", ephemeral: true })
            if (!getData.data["User"].mostCommonAge) return interaction.reply({ content: "Mys API sizinle ilgili bilgileri bulamadı!", ephemeral: true })
            if (!getData.data["User"]["sex"].sex) return interaction.reply({ content: "Mys API sizinle ilgili bilgileri bulamadı!", ephemeral: true })
            const Name = getData.data["User"].mostCommonName
            const Age = getData.data["User"].mostCommonAge
            const Sex = getData.data["User"]["sex"].sex




            interaction.reply({ content: `Isminiz : ${Name}\nYaşınız: ${Age}\nCinsiyetiniz:${Sex}\nYapay Zeka Kayıt ile kayıt sistemi!`, ephemeral: true })
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
            if (!data.data["User"]) return interaction.reply({ content: "Mys API sizinle ilgili bilgileri bulamadı!", ephemeral: true })
            if (!data.data["User"]["Isimler"]) return interaction.reply({ content: "Mys API sizinle ilgili bilgileri bulamadı!", ephemeral: true })

            const OtherName = data.data["User"]["Isimler"].map((x) => x).join("\n");
            interaction.reply({ embeds: [embed.setDescription(`Diğer Sunuculardaki Isim Kayıtlarınız ;\n\`\`\`${OtherName}\`\`\``)], ephemeral: true })
        }
    }
};

async function FetchUser(userId) {
    const apiKey = 'test'; // API anahtarınızı buraya ekleyin
    const apiUrl = `http://89.150.148.119:10000/user/${userId}`;
    // Axios ile GET isteği gönderme
    const getData = await axios.get(apiUrl, {
        headers: {
            'x-api-key': apiKey,
        },
    }).catch((error) => { console.error('Hata:', error) });
    return getData
}

module.exports.config = {
    Event: Events.InteractionCreate,
    System: true,
};
