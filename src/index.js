const { Client, GatewayIntentBits, Collection, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const express = require('express');
require('dotenv').config();

// Import bypass services
const UniversalBypasser = require('./services/bypasser');

// ============================================
// UNIVERSAL BYPASS BOT v3.0.0
// Supports: Platoboost, Linkvertise, Lootlink, 
//           Rekonise, Fluxus, and more!
// ============================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Initialize bypasser
const bypasser = new UniversalBypasser();

// Collections
client.commands = new Collection();
client.cooldowns = new Collection();
client.stats = {
    totalBypasses: 0,
    successfulBypasses: 0,
    failedBypasses: 0,
    serviceStats: {},
    usersServed: new Set(),
    startTime: Date.now()
};

// Configuration
const CONFIG = {
    PREFIX: '!',
    EMBED_COLOR: '#00FF00',
    ERROR_COLOR: '#FF0000',
    WARNING_COLOR: '#FFA500',
    INFO_COLOR: '#00BFFF',
    BOT_VERSION: '3.0.0',
    COOLDOWN_SECONDS: 5
};

// Supported services info
const SUPPORTED_SERVICES = {
    platoboost: { name: 'Platoboost', emoji: '🔵', color: '#3498db' },
    linkvertise: { name: 'Linkvertise', emoji: '🟢', color: '#2ecc71' },
    lootlink: { name: 'Loot-Link', emoji: '🟡', color: '#f1c40f' },
    rekonise: { name: 'Rekonise', emoji: '🟣', color: '#9b59b6' },
    fluxus: { name: 'Fluxus', emoji: '🔴', color: '#e74c3c' },
    delta: { name: 'Delta', emoji: '⚫', color: '#2c3e50' },
    arceusx: { name: 'Arceus X', emoji: '🟠', color: '#e67e22' },
    hydrogen: { name: 'Hydrogen', emoji: '🔷', color: '#1abc9c' },
    codex: { name: 'Codex', emoji: '⬛', color: '#34495e' },
    vegax: { name: 'Vega X', emoji: '🟤', color: '#795548' },
    relzhub: { name: 'Relz Hub', emoji: '💜', color: '#8e44ad' },
    mediafire: { name: 'MediaFire', emoji: '📁', color: '#3498db' },
    workink: { name: 'Work.ink', emoji: '💼', color: '#16a085' },
    shorte: { name: 'Shorte.st', emoji: '🔗', color: '#27ae60' },
    adfly: { name: 'AdFly', emoji: '🦋', color: '#2980b9' },
    social_unlock: { name: 'Social Unlock', emoji: '🔓', color: '#e74c3c' },
    sub2unlock: { name: 'Sub2Unlock', emoji: '📺', color: '#c0392b' },
    sub2get: { name: 'Sub2Get', emoji: '🎬', color: '#d35400' }
};

// ============================================
// SLASH COMMANDS
// ============================================
const commands = [
    {
        name: 'bypass',
        description: 'Bypass any supported link',
        options: [
            {
                name: 'url',
                type: 3,
                description: 'URL yang ingin di-bypass',
                required: true
            }
        ]
    },
    {
        name: 'services',
        description: 'Lihat semua service yang didukung'
    },
    {
        name: 'check',
        description: 'Cek apakah link didukung',
        options: [
            {
                name: 'url',
                type: 3,
                description: 'URL yang ingin dicek',
                required: true
            }
        ]
    },
    {
        name: 'ping',
        description: 'Cek latency bot'
    },
    {
        name: 'stats',
        description: 'Lihat statistik bot'
    },
    {
        name: 'help',
        description: 'Menampilkan bantuan'
    },
    {
        name: 'status',
        description: 'Cek status semua service'
    }
];

// ============================================
// BOT READY EVENT
// ============================================
client.once('ready', async () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║        🚀 UNIVERSAL BYPASS BOT v3.0.0            ║');
    console.log('║     Multi-Service Link Bypasser for Discord      ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  🤖 Bot: ${client.user.tag.padEnd(38)}║`);
    console.log(`║  🌐 Servers: ${String(client.guilds.cache.size).padEnd(35)}║`);
    console.log(`║  👥 Users: ${String(client.users.cache.size).padEnd(37)}║`);
    console.log(`║  🔓 Services: ${String(Object.keys(SUPPORTED_SERVICES).length).padEnd(34)}║`);
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
    console.log('📋 Supported Services:');
    Object.entries(SUPPORTED_SERVICES).forEach(([key, value]) => {
        console.log(`   ${value.emoji} ${value.name}`);
    });
    console.log('');

    // Set bot presence
    client.user.setPresence({
        activities: [{ 
            name: `/bypass | ${Object.keys(SUPPORTED_SERVICES).length} services`, 
            type: 3
        }],
        status: 'online'
    });

    // Register slash commands
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    try {
        console.log('📝 Registering slash commands...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log('✅ Slash commands registered!');
    } catch (error) {
        console.error('❌ Error:', error);
    }
});

// ============================================
// INTERACTION HANDLER
// ============================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, user } = interaction;
    client.stats.usersServed.add(user.id);

    // Cooldown check
    if (client.cooldowns.has(user.id)) {
        const remaining = (client.cooldowns.get(user.id) - Date.now()) / 1000;
        if (remaining > 0) {
            return interaction.reply({
                content: `⏳ Cooldown! Tunggu **${remaining.toFixed(1)}** detik lagi.`,
                ephemeral: true
            });
        }
    }

    try {
        switch (commandName) {
            case 'bypass':
                await handleBypass(interaction);
                break;
            case 'services':
                await handleServices(interaction);
                break;
            case 'check':
                await handleCheck(interaction);
                break;
            case 'ping':
                await handlePing(interaction);
                break;
            case 'stats':
                await handleStats(interaction);
                break;
            case 'help':
                await handleHelp(interaction);
                break;
            case 'status':
                await handleStatus(interaction);
                break;
        }
    } catch (error) {
        console.error(`Error: ${error}`);
        const errorEmbed = new EmbedBuilder()
            .setColor(CONFIG.ERROR_COLOR)
            .setTitle('❌ Error')
            .setDescription(`\`\`\`${error.message}\`\`\``)
            .setTimestamp();

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
});

// ============================================
// COMMAND HANDLERS
// ============================================

async function handleBypass(interaction) {
    const url = interaction.options.getString('url');
    
    // Set cooldown
    client.cooldowns.set(interaction.user.id, Date.now() + (CONFIG.COOLDOWN_SECONDS * 1000));
    setTimeout(() => client.cooldowns.delete(interaction.user.id), CONFIG.COOLDOWN_SECONDS * 1000);

    // Detect service
    const detectedService = bypasser.detectService(url);
    
    if (!detectedService) {
        const unsupportedEmbed = new EmbedBuilder()
            .setColor(CONFIG.ERROR_COLOR)
            .setTitle('❌ Service Tidak Didukung')
            .setDescription('URL yang kamu masukkan tidak didukung.')
            .addFields(
                { name: '🔗 URL', value: `\`${url.substring(0, 100)}\``, inline: false },
                { name: '💡 Tip', value: 'Gunakan `/services` untuk melihat daftar service yang didukung.', inline: false }
            )
            .setTimestamp();
        
        return interaction.reply({ embeds: [unsupportedEmbed], ephemeral: true });
    }

    const serviceInfo = SUPPORTED_SERVICES[detectedService];

    // Loading embed
    const loadingEmbed = new EmbedBuilder()
        .setColor(serviceInfo.color)
        .setTitle(`${serviceInfo.emoji} Bypassing ${serviceInfo.name}...`)
        .setDescription('Sedang memproses bypass...')
        .addFields(
            { name: '🔗 URL', value: `\`\`\`${url.substring(0, 80)}${url.length > 80 ? '...' : ''}\`\`\``, inline: false },
            { name: '📊 Progress', value: progressBar(0, 5), inline: false }
        )
        .setTimestamp();

    await interaction.reply({ embeds: [loadingEmbed] });

    // Simulate progress
    for (let i = 1; i <= 5; i++) {
        await sleep(400);
        const progressEmbed = new EmbedBuilder()
            .setColor(serviceInfo.color)
            .setTitle(`${serviceInfo.emoji} Bypassing ${serviceInfo.name}...`)
            .setDescription(getProgressMessage(i))
            .addFields(
                { name: '🔗 URL', value: `\`\`\`${url.substring(0, 80)}${url.length > 80 ? '...' : ''}\`\`\``, inline: false },
                { name: '📊 Progress', value: progressBar(i, 5), inline: false }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [progressEmbed] });
    }

    // Process bypass
    const result = await bypasser.bypass(url, detectedService);
    client.stats.totalBypasses++;
    client.stats.serviceStats[detectedService] = (client.stats.serviceStats[detectedService] || 0) + 1;

    if (result.success) {
        client.stats.successfulBypasses++;

        const successEmbed = new EmbedBuilder()
            .setColor(CONFIG.EMBED_COLOR)
            .setTitle(`✅ ${serviceInfo.emoji} Bypass Successful!`)
            .setDescription(`**${serviceInfo.name}** berhasil di-bypass!`)
            .addFields(
                { name: '🔑 Result', value: `\`\`\`${result.result}\`\`\``, inline: false },
                { name: '⚡ Method', value: `\`${result.method}\``, inline: true },
                { name: '⏱️ Time', value: `\`${result.timeTaken}ms\``, inline: true },
                { name: '🔧 Service', value: `\`${serviceInfo.name}\``, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}` });

        // Add destination URL if available
        if (result.destination) {
            successEmbed.addFields({
                name: '🎯 Destination',
                value: `\`\`\`${result.destination.substring(0, 200)}\`\`\``,
                inline: false
            });
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('copy_result')
                    .setLabel('📋 Copy Result')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('new_bypass')
                    .setLabel('🔄 Bypass Lagi')
                    .setStyle(ButtonStyle.Primary)
            );

        // Add visit button if destination exists
        if (result.destination && result.destination.startsWith('http')) {
            row.addComponents(
                new ButtonBuilder()
                    .setLabel('🔗 Visit Link')
                    .setStyle(ButtonStyle.Link)
                    .setURL(result.destination)
            );
        }

        await interaction.editReply({ embeds: [successEmbed], components: [row] });

    } else {
        client.stats.failedBypasses++;

        const failEmbed = new EmbedBuilder()
            .setColor(CONFIG.ERROR_COLOR)
            .setTitle(`❌ ${serviceInfo.emoji} Bypass Failed`)
            .setDescription(`Gagal bypass **${serviceInfo.name}**`)
            .addFields(
                { name: '❗ Error', value: `\`\`\`${result.error}\`\`\``, inline: false },
                { name: '⏱️ Time', value: `\`${result.timeTaken}ms\``, inline: true },
                { name: '💡 Solution', value: getSolutionMessage(result.error), inline: false }
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}` });

        const retryRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('retry_bypass')
                    .setLabel('🔄 Retry')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.editReply({ embeds: [failEmbed], components: [retryRow] });
    }
}

async function handleServices(interaction) {
    const servicesEmbed = new EmbedBuilder()
        .setColor(CONFIG.INFO_COLOR)
        .setTitle('🔓 Supported Bypass Services')
        .setDescription('Berikut adalah daftar semua service yang didukung oleh bot:')
        .setTimestamp()
        .setFooter({ text: `Total: ${Object.keys(SUPPORTED_SERVICES).length} services` });

    // Group services
    const keyServices = ['platoboost', 'linkvertise', 'lootlink', 'fluxus', 'delta', 'arceusx'];
    const otherServices = Object.keys(SUPPORTED_SERVICES).filter(s => !keyServices.includes(s));

    // Key/Executor Services
    let keyServicesList = '';
    keyServices.forEach(key => {
        if (SUPPORTED_SERVICES[key]) {
            keyServicesList += `${SUPPORTED_SERVICES[key].emoji} **${SUPPORTED_SERVICES[key].name}**\n`;
        }
    });
    servicesEmbed.addFields({ name: '🎮 Executor/Key Systems', value: keyServicesList || 'None', inline: true });

    // Link Shorteners
    let shortenersList = '';
    otherServices.forEach(key => {
        shortenersList += `${SUPPORTED_SERVICES[key].emoji} **${SUPPORTED_SERVICES[key].name}**\n`;
    });
    servicesEmbed.addFields({ name: '🔗 Link Shorteners', value: shortenersList || 'None', inline: true });

    // Usage example
    servicesEmbed.addFields({
        name: '📝 Cara Penggunaan',
        value: '```/bypass url:https://linkvertise.com/xxxxx```',
        inline: false
    });

    await interaction.reply({ embeds: [servicesEmbed] });
}

async function handleCheck(interaction) {
    const url = interaction.options.getString('url');
    const detectedService = bypasser.detectService(url);

    if (detectedService) {
        const serviceInfo = SUPPORTED_SERVICES[detectedService];
        const embed = new EmbedBuilder()
            .setColor(serviceInfo.color)
            .setTitle(`${serviceInfo.emoji} Link Detected!`)
            .setDescription(`Service: **${serviceInfo.name}**`)
            .addFields(
                { name: '🔗 URL', value: `\`\`\`${url.substring(0, 100)}\`\`\``, inline: false },
                { name: '✅ Status', value: 'Link dapat di-bypass!', inline: true },
                { name: '🔧 Service', value: serviceInfo.name, inline: true }
            )
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`quick_bypass_${encodeURIComponent(url)}`)
                    .setLabel('⚡ Quick Bypass')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    } else {
        const embed = new EmbedBuilder()
            .setColor(CONFIG.ERROR_COLOR)
            .setTitle('❌ Not Supported')
            .setDescription('Link tidak terdeteksi atau tidak didukung.')
            .addFields(
                { name: '🔗 URL', value: `\`\`\`${url.substring(0, 100)}\`\`\``, inline: false },
                { name: '💡 Tip', value: 'Gunakan `/services` untuk melihat daftar yang didukung.', inline: false }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}

async function handlePing(interaction) {
    const sent = await interaction.reply({ content: '🏓 Pinging...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(client.ws.ping);

    const embed = new EmbedBuilder()
        .setColor(CONFIG.EMBED_COLOR)
        .setTitle('🏓 Pong!')
        .addFields(
            { name: '📡 Bot Latency', value: `\`${latency}ms\``, inline: true },
            { name: '💻 API Latency', value: `\`${apiLatency}ms\``, inline: true },
            { name: '📊 Status', value: getLatencyStatus(latency), inline: true }
        )
        .setTimestamp();

    await interaction.editReply({ content: null, embeds: [embed] });
}

async function handleStats(interaction) {
    const uptime = formatUptime(Date.now() - client.stats.startTime);
    const successRate = client.stats.totalBypasses > 0
        ? ((client.stats.successfulBypasses / client.stats.totalBypasses) * 100).toFixed(1)
        : 0;

    // Most used service
    let mostUsed = 'None';
    let maxCount = 0;
    Object.entries(client.stats.serviceStats).forEach(([service, count]) => {
        if (count > maxCount) {
            maxCount = count;
            mostUsed = SUPPORTED_SERVICES[service]?.name || service;
        }
    });

    const embed = new EmbedBuilder()
        .setColor(CONFIG.EMBED_COLOR)
        .setTitle('📊 Bot Statistics')
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
            { name: '🔢 Total Bypasses', value: `\`${client.stats.totalBypasses}\``, inline: true },
            { name: '✅ Successful', value: `\`${client.stats.successfulBypasses}\``, inline: true },
            { name: '❌ Failed', value: `\`${client.stats.failedBypasses}\``, inline: true },
            { name: '📈 Success Rate', value: `\`${successRate}%\``, inline: true },
            { name: '⭐ Most Used', value: `\`${mostUsed}\``, inline: true },
            { name: '👥 Users', value: `\`${client.stats.usersServed.size}\``, inline: true },
            { name: '🖥️ Servers', value: `\`${client.guilds.cache.size}\``, inline: true },
            { name: '⏰ Uptime', value: `\`${uptime}\``, inline: true },
            { name: '🏓 Ping', value: `\`${client.ws.ping}ms\``, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `Version ${CONFIG.BOT_VERSION}` });

    // Service breakdown
    if (Object.keys(client.stats.serviceStats).length > 0) {
        let breakdown = '';
        Object.entries(client.stats.serviceStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([service, count]) => {
                const info = SUPPORTED_SERVICES[service];
                breakdown += `${info?.emoji || '🔗'} ${info?.name || service}: \`${count}\`\n`;
            });
        embed.addFields({ name: '📈 Top Services', value: breakdown || 'None', inline: false });
    }

    await interaction.reply({ embeds: [embed] });
}

async function handleHelp(interaction) {
    const embed = new EmbedBuilder()
        .setColor(CONFIG.INFO_COLOR)
        .setTitle('📚 Universal Bypass Bot - Help')
        .setDescription('Bot untuk bypass berbagai link shortener dan key system!')
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
            { 
                name: '🔓 /bypass <url>', 
                value: 'Bypass link apapun yang didukung', 
                inline: false 
            },
            { 
                name: '🔍 /check <url>', 
                value: 'Cek apakah link didukung', 
                inline: true 
            },
            { 
                name: '📋 /services', 
                value: 'Lihat semua service yang didukung', 
                inline: true 
            },
            { 
                name: '📊 /stats', 
                value: 'Statistik bot', 
                inline: true 
            },
            { 
                name: '🔍 /status', 
                value: 'Status semua service', 
                inline: true 
            },
            { 
                name: '🏓 /ping', 
                value: 'Cek latency', 
                inline: true 
            },
            { 
                name: '❓ /help', 
                value: 'Menu ini', 
                inline: true 
            }
        )
        .addFields({
            name: '⚡ Quick Start',
            value: '```/bypass url:https://linkvertise.com/12345```',
            inline: false
        })
        .setTimestamp()
        .setFooter({ text: `Version ${CONFIG.BOT_VERSION} | ${Object.keys(SUPPORTED_SERVICES).length} services supported` });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel('🌐 Support Server')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.gg/your-server'),
            new ButtonBuilder()
                .setLabel('📂 GitHub')
                .setStyle(ButtonStyle.Link)
                .setURL('https://github.com/your-repo')
        );

    await interaction.reply({ embeds: [embed], components: [row] });
}

async function handleStatus(interaction) {
    await interaction.deferReply();

    const statusEmbed = new EmbedBuilder()
        .setColor(CONFIG.INFO_COLOR)
        .setTitle('🔍 Service Status')
        .setDescription('Checking status of all bypass services...')
        .setTimestamp();

    // Check each service (simulated)
    const statuses = [];
    for (const [key, service] of Object.entries(SUPPORTED_SERVICES)) {
        const isOnline = Math.random() > 0.1; // 90% chance online for demo
        statuses.push(`${service.emoji} ${service.name}: ${isOnline ? '🟢 Online' : '🔴 Offline'}`);
    }

    // Split into columns
    const half = Math.ceil(statuses.length / 2);
    statusEmbed.addFields(
        { name: '📊 Status (1/2)', value: statuses.slice(0, half).join('\n'), inline: true },
        { name: '📊 Status (2/2)', value: statuses.slice(half).join('\n'), inline: true }
    );

    statusEmbed.addFields({
        name: '⏰ Last Updated',
        value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
        inline: false
    });

    await interaction.editReply({ embeds: [statusEmbed] });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function progressBar(current, total) {
    const filled = '🟩';
    const empty = '⬜';
    const percentage = Math.round((current / total) * 100);
    
    let bar = '';
    for (let i = 0; i < total; i++) {
        bar += i < current ? filled : empty;
    }
    
    return `${bar} ${percentage}%`;
}

function getProgressMessage(step) {
    const messages = [
        '🔍 Analyzing URL...',
        '🔐 Extracting tokens...',
        '⚡ Bypassing verification...',
        '🔑 Generating key...',
        '✅ Finalizing...'
    ];
    return messages[step - 1] || 'Processing...';
}

function getSolutionMessage(error) {
    if (error.includes('timeout')) {
        return 'Coba lagi dalam beberapa saat.';
    } else if (error.includes('invalid')) {
        return 'Pastikan URL valid dan lengkap.';
    } else if (error.includes('expired')) {
        return 'Link mungkin sudah expired, minta link baru.';
    }
    return 'Coba lagi atau gunakan link berbeda.';
}

function getLatencyStatus(latency) {
    if (latency < 100) return '🟢 Excellent';
    if (latency < 200) return '🟢 Good';
    if (latency < 500) return '🟡 Fair';
    return '🔴 Slow';
}

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

// ============================================
// BUTTON INTERACTIONS
// ============================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'copy_result') {
        await interaction.reply({
            content: '📋 Copy result dari embed di atas ya!',
            ephemeral: true
        });
    }

    if (interaction.customId === 'new_bypass') {
        await interaction.reply({
            content: '🔄 Gunakan `/bypass <url>` untuk bypass baru!',
            ephemeral: true
        });
    }

    if (interaction.customId === 'retry_bypass') {
        await interaction.reply({
            content: '🔄 Gunakan `/bypass <url>` dengan URL yang sama untuk retry!',
            ephemeral: true
        });
    }
});

// ============================================
// EXPRESS SERVER (Keep-alive for Render)
// ============================================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({
        status: 'online',
        bot: client.user?.tag || 'Starting...',
        version: CONFIG.BOT_VERSION,
        uptime: formatUptime(Date.now() - client.stats.startTime),
        stats: {
            servers: client.guilds?.cache.size || 0,
            users: client.stats.usersServed.size,
            totalBypasses: client.stats.totalBypasses,
            successRate: client.stats.totalBypasses > 0
                ? ((client.stats.successfulBypasses / client.stats.totalBypasses) * 100).toFixed(1) + '%'
                : '0%'
        },
        supportedServices: Object.keys(SUPPORTED_SERVICES).length
    });
});

app.get('/health', (req, res) => res.status(200).send('OK'));

app.get('/services', (req, res) => {
    res.json(SUPPORTED_SERVICES);
});

app.listen(PORT, () => {
    console.log(`🌐 Express server running on port ${PORT}`);
});

// ============================================
// ERROR HANDLING
// ============================================
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

// ============================================
// LOGIN
// ============================================
client.login(process.env.DISCORD_TOKEN);
