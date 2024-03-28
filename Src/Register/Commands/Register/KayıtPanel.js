const { ButtonStyle, ButtonBuilder, ActionRowBuilder } = require("discord.js")

module.exports = {
    Isim: "kayıt",
    Komut: ["kayıtpanel"],
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

    onRequest: async function (client, message) {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("yapayzeka")
                    .setLabel("Otomatik Kayıt Ol")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🏷'),
                new ButtonBuilder()
                    .setCustomId("cagır")
                    .setLabel("Kayıtçi Çağır")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🛎'),
                new ButtonBuilder()
                    .setCustomId("kayıt")
                    .setLabel("Isimlerimi Gör")
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📝'),
            );

        await message.channel.send({ content: "Gelişmiş Kayıt Menüsüne Hoşgeldin 🎉", components: [row] })

    }
};