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
            return
        }

        const member = message.guild.members.cache.get(args[0]) || message.mentions.members.first() || message.member;

        if (!member) {
            message.reply({ content: `Bir kullanıcı etiketlemelisin ya da ID'sini girmelisin.\nÖrn: .k @Mysterious3 Emre 17` }).sil(5)
            return
        }
        if (!member.manageable) {
            message.reply({ content: `Böyle birisini kayıt edemiyorum!` })
            return
        }

        if (member.id === message.author.id) return message.channel.send({ content: "Kendini kayıt edemezsin." })
        if (member.id === message.guild.ownerId) return message.channel.send({ content: "Sunucu sahibini kayıt edemezsin." })
        if (member.roles.highest.position >= message.member.roles.highest.position) return message.channel.send({ content: "Bu kullanıcı senden üst/aynı pozisyonda." })


        const Ayarlar = await SetupModel.findOne({ guildID: message.guild.id }).exec()
        if (!Ayarlar || !Ayarlar.Setup || !Ayarlar.Setup.suspectedRole
            || !Ayarlar.Setup.registerChannel || !Ayarlar.Setup.registeredRole || !Ayarlar.Setup.registerAuth
            || !Ayarlar.Setup.unregisterRoles || !Ayarlar.Setup.registerParent || !Ayarlar.Setup.manRoles || !Ayarlar.Setup.womanRoles
            || !Ayarlar.Setup.nameAgeSystem || !Ayarlar.Setup.changeName || !Ayarlar.Setup.needAge || !Ayarlar.Setup.taggedMode
            || !Ayarlar.Setup.registerSystem) {

            const owner = message.guild.members.cache.get(message.guild.ownerId)
            message.reply({ content: `❌ Kayıt sistemi'nin ayarları yapılmadığı için kayıt sistemi çalışmıyor!` }).sil(5)
            return await owner.send({ content: `❌ ${message.guild.name} Sunucusundaki kayıt sistemi'nin ayarları yapılmadığı için kayıt sistemi çalışmıyor!` }).catch(() => { })
        }

        if (Ayarlar.Setup.registerSystem === 'Kapali') return message.channel.send({ content: "Kayıt sistemi yöneticiler tarafından \`Deaktif\` Edildiği Icin kimseyi kayıt edemessin! ❌" })

        if (member.roles.cache.has(Ayarlar.Setup.suspectedRole)) return message.channel.send({ content: "Bu kullanıcı şüpheli olduğu için kayıt edemessin! ❌" })

        if (member.roles.cache.has(Ayarlar.Setup.registeredRole)) return message.channel.send({ content: "Bu kullanıcı zaten kayıtlı. ❌" })

        
        if (Ayarlar.Setup.taggedMode === 'Acik') {
            if (System.GuildTags.length > 0) {
                const containsAllTags = System.GuildTags.every((tag) => member.user.globalName.includes(tag));
                if (!containsAllTags) {
                    return message.channel.send({ content: "Kayıt etmeye çalıştığınız kullanıcı \`Taglı Değil\` Yöneticiler \`Taglı Alım\` modunu Aktif Ettiği için kayıt edemessin! ❌" })
                }
            }
        }
        
        console.log("test")
        args = args.slice(1).filter(arg => arg.trim() !== "");

        const isimDuzenlenecek = args
          .filter(arg => isNaN(arg)) // Sayı olmayanları al
          .map(arg => arg.charAt(0).toUpperCase() + arg.slice(1)) // İlk harfi büyük yap
          .join(" "); // İsimi birleştir
        
        const yaş = args.find(arg => !isNaN(arg)) || undefined; // İlk sayıyı yaş olarak alır, yoksa undefined
        const isim = isimDuzenlenecek.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ\s]/g, "");
        const isimYaş = isim + " | " + yaş;

        if(isim && yaş){
            if (isim.length > 12) return message.channel.send({ content: "Kayıt etmeye çalıştığınız kullanıcı'nın ismi 12 karakterden büyük olamaz." })
            if (yaş.length > 2) return message.channel.send({ content: "Kayıt etmeye çalıştığınız kullanıcı'nın yaşı 2 karakterden büyük olamaz." })
            if (parseInt(yaş, 10) <= System.MinAge) return message.channel.send({ content: `Kayıt etmeye çalıştığınız kullanıcı'nın yaşı ${System.MinAge}'dan küçük olamaz.` })
        }

        if(Ayarlar.Setup.nameAgeSystem === 'Kapali'){
            if(isim || yaş){
                return message.channel.send({content:`Sunucu kayıt sistemindeki isim yaş sistemi yöneticiler tarafından \`Deaktif\` Edildi!\nYeni Komut Örn: .k @Mysterious3`})
            }
        }

        if(Ayarlar.Setup.nameAgeSystem === 'Kapali' && !yaş && !isim){
            await member.roles.add(Ayarlar.Setup.registeredRole)
            const UnRole = Ayarlar.Setup.unregisterRoles.map(id => message.guild.roles.cache.get(id));
            await member.roles.remove(UnRole)

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

            return message.channel.send({content:`${member} Adlı Kullanıcı Başarıyla Kayıt Edildi! :tada:`})
        }
        
        
        if(Ayarlar.Setup.needAge === 'Acik' && Ayarlar.Setup.changeName === 'Acik' && Ayarlar.Setup.changeName === 'Acik'){
            if (typeof isim !== 'string' || isNaN(Number(yaş))) {
                message.reply({ content: `Kullanıcının isim ve yaşını doğru şekilde girmelisin.\nÖrn: .k @Mysterious3 Emre 17` }).sil(5);
                return;
            }
        } 

        if(Ayarlar.Setup.needAge !== 'Acik' && yaş){
            return message.channel.send({content:`Sunucu kayıt sistemindeki yaş zorunluluğu yöneticiler tarafından \`Deaktif\` Edildi!\nYeni Komut Örn: .k @Mysterious3 Emre`})
        }


        const getData = await FetchUser(member.id)
        const OtherName = getData.data["User"]["Isimler"]
        
        const DataRegister = await RegisterModel.findOne({ guildID: message.guild.id, userID: member.id });
        const embed = new EmbedBuilder()
            .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL({ size: 128, extension: 'png' }) })
            .setFooter({ text: "By mysterious3" })
            .setColor('Random')
            .setDescription(`
**${member} Adlı Kullanıcı'yı Kayıt Etmek Üzeresiniz!**

**__Kullanıcı'nın Sunucumuzdaki Geçmiş Isimleri;__**
${codeBlock(DataRegister && DataRegister.Names && DataRegister.Names.length > 0 ? (DataRegister.Names.map(x => x).join("\n")) : "Kullanıcı'nın Geçmiş Isimleri Bulunamadı!")}
**__Kullanıcı Bilgileri:__**
**Kayıt Eden Yetkili:** ${message.author}
**Kayıt Edilecek İsim Yaş:** \`${isimYaş}\`

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
                Ayarlar.Setup.manRoles.push(Ayarlar.Setup.registeredRole)
                const roles = Ayarlar.Setup.manRoles.map(id => message.guild.roles.cache.get(id));
                await member.roles.add(roles);
                const UnRole = Ayarlar.Setup.unregisterRoles.map(id => message.guild.roles.cache.get(id));
                await member.roles.remove(UnRole)
                await collector.stop('FINISH')
                if(Ayarlar.Setup.needAge !== 'Acik'){
                    await RegisterModel.updateOne(
                        { guildID: message.guild.id, userID: member.id },
                        {
                            $push: { Roles: { $each: Ayarlar.Setup.manRoles }, Names: isim },
                            $set: { Nick: isim, Staff: message.author.id }
                        },
                        { upsert: true }
                    );
                    await RegisterModel.updateOne(
                        { guildID: message.guild.id, userID: message.author.id },
                        { $inc: { TopReg: 1 } },
                        { upsert: true }
                    );
                    if(Ayarlar.Setup.changeName !== 'Kapali') await member.setNickname(isim)
                }
                else{
                    await RegisterModel.updateOne(
                        { guildID: message.guild.id, userID: member.id },
                        {
                            $push: { Roles: { $each: Ayarlar.Setup.manRoles }, Names: isimYaş },
                            $set: { Nick: isimYaş, Staff: message.author.id }
                        },
                        { upsert: true }
                    );
                    await RegisterModel.updateOne(
                        { guildID: message.guild.id, userID: message.author.id },
                        { $inc: { TopReg: 1 } },
                        { upsert: true }
                    );
                    if(Ayarlar.Setup.changeName !== 'Kapali') await member.setNickname(isimYaş)
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
                Ayarlar.Setup.womanRoles.push(Ayarlar.Setup.registeredRole)
                const roles = Ayarlar.Setup.womanRoles.map(id => message.guild.roles.cache.get(id));
                await member.roles.add(roles);
                const UnRole = Ayarlar.Setup.unregisterRoles.map(id => message.guild.roles.cache.get(id));
                await member.roles.remove(UnRole)

                await collector.stop('FINISH')

                if(Ayarlar.Setup.needAge !== 'Acik'){
                    await RegisterModel.updateOne(
                        { guildID: message.guild.id, userID: member.id },
                        {
                          $push: { Roles: {
                            Isim: isim,
                            Yas: yas,
                            Yetkili: yetkili,
                            islembilgi: islemismi,
                            Zaman: Date.now()
                          }, Names: isim },
                          $push: { Roles: { $each: Ayarlar.Setup.womanRoles }, Names: isim },
                          $set: { Nick: isim, Staff: message.author.id }
                        },
                        { upsert: true }
                      );
                      
                      await RegisterModel.updateOne(
                        { guildID: message.guild.id, userID: message.author.id },
                        { $inc: { TopReg: 1 } },
                        { upsert: true }
                      );
                      if(Ayarlar.Setup.changeName !== 'Kapali') await member.setNickname(isim)
                }
                else{
                    await RegisterModel.updateOne(
                        { guildID: message.guild.id, userID: member.id },
                        {
                          $push: { Roles: { $each: Ayarlar.Setup.womanRoles }, Names: isimYaş },
                          $set: { Nick: isimYaş, Staff: message.author.id }
                        },
                        { upsert: true }
                      );
                      
                      await RegisterModel.updateOne(
                        { guildID: message.guild.id, userID: message.author.id },
                        { $inc: { TopReg: 1 } },
                        { upsert: true }
                      );
                      if(Ayarlar.Setup.changeName !== 'Kapali') await member.setNickname(isimYaş)
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

/*        await RegisterModel.updateOne(
            { guildID: message.guild.id, userID: member.id },
            {
                $push: {
                    Roles: {
                        $each: Ayarlar.Setup.manRoles.map(role => ({
                            roleID: role.roleID, // Rolün ID'si
                            roleName: role.roleName, // Rolün adı
                            // Diğer alanlar (varsa) buraya eklenebilir
                        }))
                    }
                },
                $set: { Nick: isim, Staff: message.author.id }
            },
            { upsert: true }
        );*/
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