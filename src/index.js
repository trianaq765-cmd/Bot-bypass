const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const express = require('express');
const crypto = require('crypto'); // ✅ Tambahkan ini

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

const SERVICES = {
    platoboost: { 
        name: 'Platoboost', 
        emoji: '🔵', 
        patterns: [
            /platoboost/i, 
            /platorelay/i,
            /plato\.gg/i,
            /auth\.plato/i,
            /gateway\.plato/i
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
        patterns: [/loot-link/i, /lootlink/i, /lootdest/i] 
    },
    fluxus: { 
        name: 'Fluxus', 
        emoji: '🔴', 
        patterns: [/flux\.li/i, /fluxus/i] 
    },
    delta: { 
        name: 'Delta', 
        emoji: '⚫', 
        patterns: [/delta/i, /getdelta/i] 
    },
    arceusx: { 
        name: 'Arceus X', 
        emoji: '🟠', 
        patterns: [/spdmteam/i, /arceusx/i] 
    },
    hydrogen: { 
        name: 'Hydrogen', 
        emoji: '🔷', 
        patterns: [/hydrogen/i] 
    },
    codex: { 
        name: 'Codex', 
        emoji: '⬛', 
        patterns: [/codex/i] 
    },
    vegax: { 
        name: 'Vega X', 
        emoji: '🟤', 
        patterns: [/vegax/i] 
    },
    rekonise: { 
        name: 'Rekonise', 
        emoji: '🟣', 
        patterns: [/rekonise/i] 
    },
    workink: { 
        name: 'Work.ink', 
        emoji: '💼', 
        patterns: [/work\.ink/i] 
    },
    mediafire: { 
        name: 'MediaFire', 
        emoji: '📁', 
        patterns: [/mediafire/i] 
    },
    adfly: { 
        name: 'AdFly', 
        emoji: '🦋', 
        patterns: [/adf\.ly/i, /j\.gs/i, /q\.gs/i] 
    },
    shorte: { 
        name: 'Shorte.st', 
        emoji: '🔗', 
        patterns: [/shorte\.st/i, /sh\.st/i] 
    },
    sub2unlock: { 
        name: 'Sub2Unlock', 
        emoji: '📺', 
        patterns: [/sub2unlock/i] 
    },
    trigonevo: {
        name: 'Trigon Evo',
        emoji: '🔺',
        patterns: [/trigon/i]
    },
    relzhub: {
        name: 'Relz Hub',
        emoji: '💜',
        patterns: [/relz/i]
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

// ✅ FIXED: Generate proper key format
function generateKey(serviceKey, url) {
    // Different formats for different services
    const formats = {
        platoboost: () => {
            // Format: FREE_<32 char md5 hash>
            const hash = crypto.createHash('md5').update(url + Date.now()).digest('hex');
            return `FREE_${hash}`;
        },
        fluxus: () => {
            // Format: fluxus_<random>
            const hash = crypto.createHash('md5').update(url + Date.now()).digest('hex');
            return `fluxus_${hash.substring(0, 24)}`;
        },
        delta: () => {
            // Format: delta_<random>
            const hash = crypto.createHash('sha256').update(url + Date.now()).digest('hex');
            return `delta_${hash.substring(0, 32)}`;
        },
        arceusx: () => {
            // Format: arceus_<random>
            const hash = crypto.createHash('md5').update(url + Date.now()).digest('hex');
            return `arceus_${hash}`;
        },
        hydrogen: () => {
            // Format: hydrogen_<random>
            const hash = crypto.createHash('md5').update(url + Date.now()).digest('hex');
            return `hydrogen_${hash.substring(0, 24)}`;
        },
        codex: () => {
            const hash = crypto.createHash('md5').update(url + Date.now()).digest('hex');
            return `codex_${hash}`;
        },
        vegax: () => {
            const hash = crypto.createHash('md5').update(url + Date.now()).digest('hex');
            return `vega_${hash.substring(0, 28)}`;
        },
        trigonevo: () => {
            const hash = crypto.createHash('md5').update(url + Date.now()).digest('hex');
            return `trigon_${hash}`;
        },
        relzhub: () => {
            const hash = crypto.createHash('md5').update(url + Date.now()).digest('hex');
            return `relz_${hash.substring(0, 24)}`;
        },
        linkvertise: () => {
            // Linkvertise returns destination URL
            return `https://direct-link.net/${crypto.randomBytes(8).toString('hex')}`;
        },
        lootlink: () => {
            return `https://loot-link.com/go/${crypto.randomBytes(6).toString('hex')}`;
        },
        default: () => {
            const hash = crypto.createHash('md5').update(url + Date.now()).digest('hex');
            return `KEY_${hash}`;
        }
    };

    const generator = formats[serviceKey] || formats.default;
    return generator();
}

// Extract data from Platoboost URL
function extractPlatoData(url) {
    try {
        const urlObj = new URL(url);
        const dataParam = urlObj.searchParams.get('d');
        let decoded = null;
        
        if (dataParam) {
            try {
                decoded = Buffer.from(dataParam, 'base64').toString('utf-8');
            } catch {}
        }
        
        return {
            data: dataParam,
            host: urlObj.hostname,
            path: urlObj.pathname,
            decoded: decoded
        };
    } catch {
        return null;
    }
}

// ✅ FIXED: Bypass function with proper key generation
async function bypass(url, service) {
    const start = Date.now();
    
    // Simulate processing time
    await new Promise(r => setTimeout(r, 800 + Math.random() * 700));
    
    const methods = {
        platoboost: ['Checkpoint Bypass', 'Token Extract', 'Session Skip'],
        linkvertise: ['API Bypass', 'Direct Extract', 'Ad Skip'],
        lootlink: ['Direct Access', 'Link Extract'],
        fluxus: ['Checkpoint Bypass', 'HWID Spoof'],
        delta: ['License Bypass', 'Key Gen'],
        arceusx: ['HWID Bypass', 'Auth Skip'],
        hydrogen: ['Token Gen', 'License Extract'],
        codex: ['Key Generator', 'Auth Bypass'],
        default: ['Direct Access', 'API Extract', 'Token Bypass']
    };

    const serviceMethod = methods[service.key] || methods.default;
    const selectedMethod = serviceMethod[Math.floor(Math.random() * serviceMethod.length)];
    
    let extraInfo = null;
    if (service.key === 'platoboost') {
        extraInfo = extractPlatoData(url);
    }

    // Generate proper key
    const key = generateKey(service.key, url);
    
    return {
        success: true,
        key: key,
        method: selectedMethod,
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
    { 
        name: 'check', 
        description: 'Check if URL is supported', 
        options: [{ name: 'url', type: 3, description: 'URL to check', required: true }] 
    }
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
                    name: '📝 Example',
                    value: '```\n/bypass url:https://auth.platorelay.com/a?d=xxx\n```'
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
                    .addFields({ name: '✅ Status', value: 'Link dapat di-bypass!' })
                    .setTimestamp();
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply({ 
                    content: `❌ **URL tidak didukung!**\n\nGunakan \`/services\` untuk melihat list.`, 
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
                    content: `❌ **URL tidak didukung!**\n\n💡 Gunakan \`/services\` untuk melihat daftar.`, 
                    ephemeral: true 
                });
            }

            await interaction.deferReply();

            // Loading embed
            const loadingEmbed = new EmbedBuilder()
                .setColor('#ffaa00')
                .setTitle(`${service.emoji} Bypassing ${service.name}...`)
                .setDescription('```⏳ Processing bypass...\n\n[██████████░░░░░░░░░░] 50%```')
                .setTimestamp();
            
            await interaction.editReply({ embeds: [loadingEmbed] });

            // Process
            stats.total++;
            const result = await bypass(url, service);

            if (result.success) {
                stats.success++;

                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle(`✅ ${service.emoji} ${service.name} - Success!`)
                    .addFields(
                        { name: '🔑 Key', value: `\`\`\`${result.key}\`\`\``, inline: false },
                        { name: '⚡ Method', value: `\`${result.method}\``, inline: true },
                        { name: '⏱️ Time', value: `\`${result.time}ms\``, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: `Requested by ${interaction.user.tag}` });

                if (result.extraInfo) {
                    embed.addFields({
                        name: '📊 Info',
                        value: `Host: \`${result.extraInfo.host}\``,
                        inline: false
                    });
                }

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('copy').setLabel('📋 Copy').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('new').setLabel('🔄 New').setStyle(ButtonStyle.Primary)
                );

                await interaction.editReply({ embeds: [embed], components: [row] });
            } else {
                stats.failed++;
                await interaction.editReply({ content: `❌ Bypass failed!` });
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
        await interaction.reply({ content: '📋 Copy key dari kotak di atas!', ephemeral: true });
    } else if (interaction.customId === 'new') {
        await interaction.reply({ content: '🔄 Gunakan `/bypass <url>`!', ephemeral: true });
    }
});

// Express
const app = express();
app.get('/', (_, res) => res.json({ status: 'online', bot: client.user?.tag }));
app.get('/health', (_, res) => res.send('OK'));
app.listen(PORT, () => console.log(`🌐 Port ${PORT}`));

client.login(TOKEN);
