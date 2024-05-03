const { ButtonStyle, ButtonBuilder, ActionRowBuilder, EmbedBuilder, codeBlock } = require("discord.js")
const { RegisterModel } = require("../../../../Global/DataBase/Models/Register");
const { SetupModel } = require("../../../../Global/DataBase/Models/GuildModel")
const axios = require('axios');

module.exports = {
    Isim: "kayıt",
    Komut: ["k"],
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

    onRequest: async function (client, message, args) {

        if (!args[0]) {
            message.reply({ content: `Kullanıcı'nın isim ya da yaşını girmelisin.\nÖrn: .k @Mysterious3 Emre 17` }).sil(5)
            return;
        }
        const member = message.guild.members.cache.get(args[0]) || message.mentions.members.first() || message.member;
        if (!member) {
            message.reply({ content: `Bir kullanıcı etiketlemelisin ya da ID'sini girmelisin.\nÖrn: .k @Mysterious3 Emre 17` }).sil(5)
            return
        }
        if (!member.manageable) {
            message.reply({ content: `Böyle birisini kayıt edemiyorum!` })
            return;
        }
        if (member.id === message.author.id) return message.channel.send({ content: "Kendini kayıt edemezsin." })
        if (member.id === message.guild.ownerId) return message.channel.send({ content: "Sunucu sahibini kayıt edemezsin." })
        if (member.roles.highest.position >= message.member.roles.highest.position) return message.channel.send({ content: "Bu kullanıcı senden üst/aynı pozisyonda." })

        const Ayarlar = await SetupModel.findOne({ guildID: message.guild.id })

        if (!Ayarlar?.Setup) return message.channel.send({ content: `Sunucu ayarları yapılmamış!` })

        if (!Ayarlar.Setup.registeredRole) {
            return message.channel.send({ content: `Kayıtlı rolü ayarlanmamış! ❌` })
        }
        if (member.roles.cache.has(Ayarlar.Setup.registeredRole)) return message.channel.send({ content: "Bu kullanıcı zaten kayıtlı. ❌" })
        if (!Ayarlar.Setup.registerSystem) return message.channel.send({ content: `Kayıt sistemi açık olarak ayarlanmamış! ❌` })
        if (Ayarlar.Setup.registerSystem == 'Kapali') {
            return message.channel.send({
                content: `🔒 Kayıtlar bir yönetici tarafından __geçici bir süreliğine kapatılmıştır.__ Lütfen bu süreçte beklemede kalın. Anlayışla karşıladığınız için teşekkürler!`,
            });
        }

        if (((!Ayarlar.Setup.manRoles ||
            !Ayarlar.Setup.manRoles.length ||
            !Ayarlar.Setup.manRoles.some((r) => message.guild.roles.cache.has(r))) &&
            (!Ayarlar.Setup.womanRoles ||
                !Setup.womanRoles.length ||
                !Setup.womanRoles.some((r) => message.guild.roles.cache.has(r)))) ||
            (Setup?.registeredRole && !message.guild.roles.cache.has(guildData.registeredRole))
        ) {
            return message.channel.send('Rol ayarı yapılmamış.');
        }

        if (!Ayarlar.Setup.taggetMode) {
            return message.channel.send({ content: `Taglı alım modu ayarlanmamış!` })
        }

        if (Ayarlar.Setup.taggedMode === 'Acik') {
            if (System.GuildTags.length > 0) {
                const containsAllTags = System.GuildTags.every((tag) => member.user.globalName.includes(tag));
                if (!containsAllTags) {
                    return message.channel.send({ content: "Kayıt etmeye çalıştığınız kullanıcı \`Taglı Değil\` Yöneticiler \`Taglı Alım\` modunu Aktif Ettiği için kayıt edemessin! ❌" })
                }
            }
        }

        if (!Ayarlar.Setup.suspectedRole) {
            return message.channel.send({ content: `Şüpheli rolü ayarlanmamış!` })
        }
        if (member.roles.cache.has(Ayarlar.Setup.suspectedRole)) return message.channel.send({ content: "Bu kullanıcı şüpheli olduğu için kayıt edemessin! ❌" })

        if (Ayarlar.Setup.unregisterRoles && Ayarlar.Setup.unregisterRoles.length > 0) {
            if (Ayarlar.Setup.unregisterRoles.some((r) => member.roles.cache.has(r))) {


            }
        }
        if(!Ayarlar.Setup.nameAgeSystem) return message.channel.send({ content: `İsim yaş sistemi ayarlanmamış!` })
        if (Ayarlar.Setup.nameAgeSystem === 'Kapali') {
            if (isim || yaş) {
                return message.channel.send({ content: `Sunucu kayıt sistemindeki isim yaş sistemi yöneticiler tarafından \`Deaktif\` Edildi!\nYeni Komut Örn: .k @Mysterious3` })
            }
        }


        if (Ayarlar.Setup.nameAgeSystem === 'Kapali') {
            await member.roles.add([Ayarlar.Setup.registeredRole]).then(() => { 
                const UnRole = Ayarlar.Setup.unregisterRoles.map(id => message.guild.roles.cache.get(id));
                member.roles.remove(UnRole)
            }).catch(() => { })
            
            await RegisterModel.updateOne(
                { guildID: message.guild.id, userID: message.author.id },
                { $inc: { TopReg: 1 } },
                { upsert: true }
            );
            if (Ayarlar.Setup.registerChannel) {
                const registerchat = message.guild.kanalBul(Ayarlar.Setup.registerChannel)
                if (registerchat) {
                    registerchat.send({ content: `<@${member.id}> kullanıcısı aramıza katıldı, herkes selam versin :tada:` }).catch(() => { })
                }
            }

            return message.channel.send({ content: `${member} Adlı Kullanıcı Başarıyla Kayıt Edildi! :tada:` })
        }

        let isim;
        let yaş;
        let isimYaş;
        if(Ayarlar.Setup.nameAgeSystem === 'Acık'){
            args = args.slice(1).filter(arg => arg.trim() !== "");

            const isimDuzenlenecek = args
                .filter(arg => isNaN(arg)) // Sayı olmayanları al
                .map(arg => arg.charAt(0).toUpperCase() + arg.slice(1)) // İlk harfi büyük yap
                .join(" "); // İsimi birleştir
    
            yaş = args.find(arg => !isNaN(arg)) || undefined; 
            isim = isimDuzenlenecek.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ\s]/g, "") || undefined;
            isimYaş = isim + ` ${System.DefultNameSembol} ` + yaş || undefined;
    
            if (isim && yaş) {
                if (isim.length > 12) return message.channel.send({ content: "Kayıt etmeye çalıştığınız kullanıcı'nın ismi 12 karakterden büyük olamaz." })
                if (yaş.length > 2) return message.channel.send({ content: "Kayıt etmeye çalıştığınız kullanıcı'nın yaşı 2 karakterden büyük olamaz." })
                if (parseInt(yaş, 10) <= System.MinAge) return message.channel.send({ content: `Kayıt etmeye çalıştığınız kullanıcı'nın yaşı ${System.MinAge}'dan küçük olamaz.` })
            }
        }

        if (Ayarlar.Setup.needAge === 'Acık' && Ayarlar.Setup.nameAgeSystem === 'Acık') {
            if (typeof isim !== 'string' || isNaN(Number(yaş))) {
                message.reply({ content: `Kullanıcının isim ve yaşını doğru şekilde girmelisin.\nÖrn: .k @Mysterious3 Emre 17` }).sil(5);
                return;
            }
        }

        const getData = await FetchUser(member.id)
        const OtherName = getData.data["GuildsDisplayNames"].map((x) => x).join("\n");

        const DataRegister = await RegisterModel.findOne({ guildID: message.guild.id, userID: member.id });
        const embed = new EmbedBuilder()
            .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL({ size: 128, extension: 'png' }) })
            .setFooter({ text: "By mysterious3" })
            .setColor('Random')
            .setDescription(`
**${member} Adlı Kullanıcı'yı Kayıt Etmek Üzeresiniz!**

**__Kullanıcı'nın Sunucumuzdaki Geçmiş Isimleri;__**
${codeBlock(DataRegister && DataRegister.Names && DataRegister.Names.length > 0 ? (DataRegister.Names.map(x => x.name).join("\n")) : "Kullanıcı'nın Geçmiş Isimleri Bulunamadı!")}
**__Kullanıcı Bilgileri:__**
**Kayıt Eden Yetkili:** ${message.author}
**Kayıt Edilecek İsim Yaş:** \`${isimYaş ?? member.user.username}\`

**Kullanıcı'nın Kayıt Olmasını Onaylıyor Musunuz?**`)

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("man")
                    .setLabel("Erkek")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🧑'),
                new ButtonBuilder()
                    .setCustomId("women")
                    .setLabel("Kadın")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('👩‍🦰'),
                new ButtonBuilder()
                    .setCustomId("cancel")
                    .setLabel("Iptal")
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌'),
            );

        const msg = await message.channel.send({ embeds: [embed], components: [row] })

        const collector = msg.createMessageComponentCollector({
            time: 1000 * 60 * 10,
        })

        collector.on('collect', async (i) => {
            if (i.user.id !== message.author.id) return i.reply({ content: "Bu menüyü sadece komutu yazan kullanabilir.", ephemeral: true });
            if (i.customId === 'man') {
                await collector.stop('FINISH')
                if (Ayarlar.Setup.needAge !== 'Acık') {
                    const Veri = new RegisterModel({
                        guildID: message.guild.id,
                        userID: member.id,
                        Nick: isim,
                        Names: [{ admin: message.author.id, time: Date.now(), name: isim }],
                        Roles: [{ admin: message.author.id, time: Date.now(), roles: [Ayarlar.Setup.registeredRole, ...Ayarlar.Setup.manRoles] }],
                    });
                    Veri.save().catch(() => { })
                    await RegisterModel.updateOne(
                        { guildID: message.guild.id, userID: message.author.id },
                        { $inc: { TopReg: 1 } },
                        { upsert: true }
                    );
                    await member.setNickname(isim)
                    member.roles.set([]).then(() => { member.roles.add([Ayarlar.Setup.registeredRole,...Ayarlar.Setup.manRoles]) }).catch(() => { })
                }
                else {
                    const Veri = new RegisterModel({
                        guildID: message.guild.id,
                        userID: member.id,
                        Nick: isimYaş,
                        Names: [{ admin: message.author.id, time: Date.now(), name: isimYaş }],
                        Roles: [{ admin: message.author.id, time: Date.now(), roles: [Ayarlar.Setup.registeredRole, ...Ayarlar.Setup.manRoles] }],
                    });
                    Veri.save().catch(() => { })
                    await RegisterModel.updateOne(
                        { guildID: message.guild.id, userID: message.author.id },
                        { $inc: { TopReg: 1 } },
                        { upsert: true }
                    );
                    await member.setNickname(isimYaş)
                    member.roles.set([]).then(() => { member.roles.add([Ayarlar.Setup.registeredRole,...Ayarlar.Setup.manRoles]) }).catch(() => { })
                }
                if (Ayarlar.Setup.registerChannel) {
                    const registerchat = message.guild.kanalBul(Ayarlar.Setup.registerChannel)
                    if (registerchat) {
                        registerchat.send({ content: `<@${member.id}> kullanıcısı aramıza katıldı, herkes selam versin :tada:` }).catch(() => { })
                    }
                }
                await i.update({ content: `${member} Adlı Kullanıcı Başarıyla Kayıt Edildi! :tada:`, embeds: [], components: [] })
            }
            else if (i.customId === 'women') {
                
                await collector.stop('FINISH')

                if (Ayarlar.Setup.needAge !== 'Acık') {
                    const Veri = new RegisterModel({
                        guildID: message.guild.id,
                        userID: member.id,
                        Nick: isim,
                        Names: [{ admin: message.author.id, time: Date.now(), name: isim }],
                        Roles: [{ admin: message.author.id, time: Date.now(), roles: [Ayarlar.Setup.registeredRole, ...Ayarlar.Setup.womanRoles] }],
                    });
                    Veri.save().catch(() => { })
                    await RegisterModel.updateOne(
                        { guildID: message.guild.id, userID: message.author.id },
                        { $inc: { TopReg: 1 } },
                        { upsert: true }
                    );
    
                    await member.setNickname(isim)
                    member.roles.set([]).then(() => { member.roles.add([Ayarlar.Setup.registeredRole,...Ayarlar.Setup.womanRoles]) }).catch(() => { })
                }
                else{
                    const Veri = new RegisterModel({
                        guildID: message.guild.id,
                        userID: member.id,
                        Nick: isimYaş,
                        Names: [{ admin: message.author.id, time: Date.now(), name: isimYaş }],
                        Roles: [{ admin: message.author.id, time: Date.now(), roles: [Ayarlar.Setup.registeredRole, ...Ayarlar.Setup.womanRoles] }],
                    });
                    Veri.save().catch(() => { })
                    await RegisterModel.updateOne(
                        { guildID: message.guild.id, userID: message.author.id },
                        { $inc: { TopReg: 1 } },
                        { upsert: true }
                    );
    
                    await member.setNickname(isimYaş)
                    member.roles.set([]).then(() => { member.roles.add([Ayarlar.Setup.registeredRole,...Ayarlar.Setup.womanRoles]) }).catch(() => { })
                }

                if (Ayarlar.Setup.registerChannel) {
                    const registerchat = message.guild.kanalBul(Ayarlar.Setup.registerChannel)
                    if (registerchat) {
                        registerchat.send({ content: `<@${member.id}> kullanıcısı aramıza katıldı, herkes selam versin :tada:` }).catch(() => { })
                    }
                }
                await i.update({ content: `${member} Adlı Kullanıcı Başarıyla Kayıt Edildi! :tada:`, embeds: [], components: [] })
            }
            else if (i.customId === 'cancel') {
                await collector.stop('FINISH')
                await i.update({ content: `${member} Adlı Kullanıcı'nın Kayıt İşlemi İptal Edildi! ❌`, embeds: [], components: [] })
            }
        })
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