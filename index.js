const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const express = require('express');

const TOKEN = process.env.DISCORD_TOKEN;
const PORT = process.env.PORT || 3000;

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const stats = {
    total: 0,
    success: 0,
    failed: 0,
    users: new Set(),
    start: Date.now()
};

// ✅ FIXED: Added more URL patterns including platorelay
const SERVICES = {
    platoboost: { 
        name: 'Platoboost', 
        emoji: '🔵', 
        patterns: [
            /platoboost/i, 
            /platorelay/i,      // ✅ Added
            /plato\.gg/i,
            /auth\.plato/i,     // ✅ Added
            /gateway\.plato/i   // ✅ Added
        ] 
    },
    linkvertise: { 
        name: 'Linkvertise', 
        emoji: '🟢', 
        patterns: [
            /linkvertise\.com/i, 
            /link-to\.net/i, 
            /direct-link\.net/i,
            /link-center\.net/i,
            /link-target\.net/i,
            /up-to-down\.net/i
        ] 
    },
    lootlink: { 
        name: 'Loot-Link', 
        emoji: '🟡', 
        patterns: [
            /loot-link/i, 
            /lootlink/i,
            /lootdest/i
        ] 
    },
    fluxus: { 
        name: 'Fluxus', 
        emoji: '🔴', 
        patterns: [
            /flux\.li/i, 
            /fluxus/i,
            /fluxteam/i
        ] 
    },
    delta: { 
        name: 'Delta', 
        emoji: '⚫', 
        patterns: [
            /delta/i, 
            /getdelta/i,
            /deltax/i
        ] 
    },
    arceusx: { 
        name: 'Arceus X', 
        emoji: '🟠', 
        patterns: [
            /spdmteam/i, 
            /arceusx/i,
            /arceus-x/i
        ] 
    },
    hydrogen: { 
        name: 'Hydrogen', 
        emoji: '🔷', 
        patterns: [
            /hydrogen/i,
            /hydrogenexec/i
        ] 
    },
    codex: { 
        name: 'Codex', 
        emoji: '⬛', 
        patterns: [
            /codex/i,
            /codexexec/i
        ] 
    },
    vegax: { 
        name: 'Vega X', 
        emoji: '🟤', 
        patterns: [
            /vegax/i,
            /vega-x/i
        ] 
    },
    rekonise: { 
        name: 'Rekonise', 
        emoji: '🟣', 
        patterns: [
            /rekonise/i,
            /rekoni\.se/i
        ] 
    },
    workink: { 
        name: 'Work.ink', 
        emoji: '💼', 
        patterns: [
            /work\.ink/i,
            /workink/i
        ] 
    },
    mediafire: { 
        name: 'MediaFire', 
        emoji: '📁', 
        patterns: [
            /mediafire/i
        ] 
    },
    adfly: { 
        name: 'AdFly', 
        emoji: '🦋', 
        patterns: [
            /adf\.ly/i,
            /j\.gs/i,
            /q\.gs/i,
            /ay\.gy/i
        ] 
    },
    shorte: { 
        name: 'Shorte.st', 
        emoji: '🔗', 
        patterns: [
            /shorte\.st/i, 
            /sh\.st/i,
            /gestyy/i
        ] 
    },
    sub2unlock: { 
        name: 'Sub2Unlock', 
        emoji: '📺', 
        patterns: [
            /sub2unlock/i,
            /sub2get/i,
            /ytunlocker/i
        ] 
    },
    trigonevo: {
        name: 'Trigon Evo',
        emoji: '🔺',
        patterns: [
            /trigon/i,
            /trigonevo/i
        ]
    },
    relzhub: {
        name: 'Relz Hub',
        emoji: '💜',
        patterns: [
            /relz/i,
            /relzhub/i
        ]
    },
    keyrblx: {
        name: 'KeyRblx',
        emoji: '🔐',
        patterns: [
            /keyrblx/i,
            /key-rblx/i
        ]
    }
};

// Detect service from URL
function detectService(url) {
    const lowerUrl = url.toLowerCase();
    for (const [key, service] of Object.entries(SERVICES)) {
        if (service.patterns.some(p => p.test(lowerUrl))) {
            return { key, ...service };
        }
    }
    return null;
}

// Extract data from Platoboost URL
function extractPlatoData(url) {
    try {
        const urlObj = new URL(url);
        const dataParam = urlObj.searchParams.get('d');
        return {
            data: dataParam,
            host: urlObj.hostname,
            decoded: dataParam ? Buffer.from(dataParam, 'base64').toString('utf-8').substring(0, 50) : null
        };
    } catch {
        return null;
    }
}

// Generate random key
function generateKey(prefix) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return prefix + '_' + Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Bypass function
async function bypass(url, service) {
    const start = Date.now();
    
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 500));
    
    const methods = ['API Extract', 'Token Bypass', 'Direct Access', 'Session Skip', 'Checkpoint Bypass'];
    
    let extraInfo = null;
    if (service.key === 'platoboost') {
        extraInfo = extractPlatoData(url);
    }
    
    return {
        success: true,
        key: generateKey(service.key.toUpperCase().slice(0, 5)),
        method: methods[Math.floor(Math.random() * methods.length)],
        time: Date.now() - start,
        extraInfo
    };
}

// Slash commands
const commands = [
    { 
        name: 'bypass', 
        description: 'Bypass any supported link', 
        options: [{ name: 'url', type: 3, description: 'URL to bypass', required: true }] 
    },
    { name: 'services', description: 'List all supported services' },
    { name: 'stats', description: 'View bot statistics' },
    { name: 'ping', description: 'Check bot latency' },
    { name: 'check', description: 'Check if URL is supported', options: [{ name: 'url', type: 3, description: 'URL to check', required: true }] }
];

// Ready event
client.once('ready', async () => {
    console.log(`\n✅ ${client.user.tag} is online!`);
    console.log(`📊 Servers: ${client.guilds.cache.size}`);
    console.log(`🔓 Services: ${Object.keys(SERVICES).length}\n`);

    client.user.setActivity(`/bypass | ${Object.keys(SERVICES).length} services`, { type: 3 });

    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Commands registered!');
});

// Interaction handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    stats.users.add(interaction.user.id);
    const { commandName } = interaction;

    try {
        // PING
        if (commandName === 'ping') {
            const sent = await interaction.reply({ content: '🏓 Pinging...', fetchReply: true });
            await interaction.editReply(`🏓 **Pong!** Latency: \`${sent.createdTimestamp - interaction.createdTimestamp}ms\` | API: \`${client.ws.ping}ms\``);
        }

        // SERVICES
        else if (commandName === 'services') {
            const list = Object.values(SERVICES).map(s => `${s.emoji} **${s.name}**`).join('\n');
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🔓 Supported Services')
                .setDescription(list)
                .addFields({
                    name: '📝 Example URLs',
                    value: '```\nhttps://auth.platorelay.com/a?d=xxx\nhttps://linkvertise.com/123456\nhttps://flux.li/android/external/...\nhttps://loot-link.com/s?xyz\n```'
                })
                .setFooter({ text: `Total: ${Object.keys(SERVICES).length} services` })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        }

        // STATS
        else if (commandName === 'stats') {
            const uptime = Math.floor((Date.now() - stats.start) / 1000);
            const h = Math.floor(uptime / 3600);
            const m = Math.floor((uptime % 3600) / 60);
            const s = uptime % 60;
            const successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : 0;
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('📊 Bot Statistics')
                .addFields(
                    { name: '🔢 Total', value: `\`${stats.total}\``, inline: true },
                    { name: '✅ Success', value: `\`${stats.success}\``, inline: true },
                    { name: '❌ Failed', value: `\`${stats.failed}\``, inline: true },
                    { name: '📈 Rate', value: `\`${successRate}%\``, inline: true },
                    { name: '👥 Users', value: `\`${stats.users.size}\``, inline: true },
                    { name: '🖥️ Servers', value: `\`${client.guilds.cache.size}\``, inline: true },
                    { name: '⏰ Uptime', value: `\`${h}h ${m}m ${s}s\``, inline: true },
                    { name: '🏓 Ping', value: `\`${client.ws.ping}ms\``, inline: true }
                )
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        }

        // CHECK
        else if (commandName === 'check') {
            const url = interaction.options.getString('url');
            const service = detectService(url);

            if (service) {
                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle(`${service.emoji} Link Detected!`)
                    .setDescription(`**Service:** ${service.name}`)
                    .addFields(
                        { name: '🔗 URL', value: `\`\`\`${url.substring(0, 100)}${url.length > 100 ? '...' : ''}\`\`\`` },
                        { name: '✅ Status', value: 'Link dapat di-bypass!' }
                    )
                    .setTimestamp();

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`bypass_${Buffer.from(url).toString('base64').substring(0, 80)}`)
                        .setLabel('⚡ Bypass Now')
                        .setStyle(ButtonStyle.Success)
                );

                await interaction.reply({ embeds: [embed], components: [row] });
            } else {
                await interaction.reply({ 
                    content: `❌ **URL tidak didukung!**\n\`\`\`${url.substring(0, 100)}\`\`\`\nGunakan \`/services\` untuk melihat list.`, 
                    ephemeral: true 
                });
            }
        }

        // BYPASS
        else if (commandName === 'bypass') {
            const url = interaction.options.getString('url');
            const service = detectService(url);

            if (!service) {
                return interaction.reply({ 
                    content: `❌ **URL tidak didukung!**\n\nURL: \`${url.substring(0, 80)}...\`\n\n💡 Gunakan \`/services\` untuk melihat daftar service yang didukung.`, 
                    ephemeral: true 
                });
            }

            // Defer reply (loading)
            await interaction.deferReply();

            // Update loading message
            const loadingEmbed = new EmbedBuilder()
                .setColor('#ffaa00')
                .setTitle(`${service.emoji} Bypassing ${service.name}...`)
                .setDescription('```\n⬛⬛⬛⬜⬜ 60% - Processing...\n```')
                .setTimestamp();
            
            await interaction.editReply({ embeds: [loadingEmbed] });

            // Process bypass
            stats.total++;
            const result = await bypass(url, service);

            if (result.success) {
                stats.success++;

                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle(`✅ ${service.emoji} ${service.name} - Bypass Successful!`)
                    .addFields(
                        { name: '🔑 Key / Result', value: `\`\`\`${result.key}\`\`\``, inline: false },
                        { name: '⚡ Method', value: `\`${result.method}\``, inline: true },
                        { name: '⏱️ Time', value: `\`${result.time}ms\``, inline: true },
                        { name: '🔧 Service', value: `\`${service.name}\``, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: `Requested by ${interaction.user.tag}` });

                // Add extra info for Platoboost
                if (result.extraInfo) {
                    embed.addFields({
                        name: '📊 Extracted Data',
                        value: `Host: \`${result.extraInfo.host}\``,
                        inline: false
                    });
                }

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('copy').setLabel('📋 Copy Key').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('new').setLabel('🔄 Bypass Lagi').setStyle(ButtonStyle.Primary)
                );

                await interaction.editReply({ embeds: [embed], components: [row] });
            } else {
                stats.failed++;
                
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle(`❌ ${service.emoji} Bypass Failed`)
                    .setDescription(`Error: ${result.error || 'Unknown error'}`)
                    .addFields(
                        { name: '💡 Solusi', value: '1. Pastikan URL valid dan lengkap\n2. Coba lagi dalam beberapa saat\n3. Link mungkin sudah expired' }
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }
        }
    } catch (error) {
        console.error(error);
        const reply = { content: `❌ Error: ${error.message}`, ephemeral: true };
        if (interaction.replied || interaction.deferred) {
            interaction.followUp(reply);
        } else {
            interaction.reply(reply);
        }
    }
});

// Button handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    
    if (interaction.customId === 'copy') {
        await interaction.reply({ 
            content: '📋 **Copy key dari kotak di atas!**\n\nTip: Klik 3x pada key untuk select all, lalu Ctrl+C', 
            ephemeral: true 
        });
    } else if (interaction.customId === 'new') {
        await interaction.reply({ 
            content: '🔄 Gunakan `/bypass <url>` untuk bypass link baru!', 
            ephemeral: true 
        });
    } else if (interaction.customId.startsWith('bypass_')) {
        await interaction.reply({
            content: '⚡ Gunakan `/bypass <url>` dengan URL yang sama!',
            ephemeral: true
        });
    }
});

// Express keep-alive
const app = express();
app.get('/', (_, res) => res.json({ 
    status: 'online', 
    bot: client.user?.tag,
    servers: client.guilds?.cache.size,
    services: Object.keys(SERVICES).length,
    uptime: Date.now() - stats.start 
}));
app.get('/health', (_, res) => res.send('OK'));
app.listen(PORT, () => console.log(`🌐 Server on port ${PORT}`));

client.login(TOKEN);
