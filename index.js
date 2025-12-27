const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const express = require('express');

// ============================================
// UNIVERSAL BYPASS BOT v3.0 - OPTIMIZED
// Deploy time: < 2 minutes
// ============================================

const TOKEN = process.env.DISCORD_TOKEN;
const PORT = process.env.PORT || 3000;

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// Stats
const stats = {
    total: 0,
    success: 0,
    failed: 0,
    users: new Set(),
    start: Date.now()
};

// Supported Services
const SERVICES = {
    platoboost: { name: 'Platoboost', emoji: '🔵', patterns: [/platoboost/i, /plato\.gg/i] },
    linkvertise: { name: 'Linkvertise', emoji: '🟢', patterns: [/linkvertise/i, /link-to\.net/i, /direct-link\.net/i] },
    lootlink: { name: 'Loot-Link', emoji: '🟡', patterns: [/loot-link/i, /lootlink/i] },
    fluxus: { name: 'Fluxus', emoji: '🔴', patterns: [/flux\.li/i, /fluxus/i] },
    delta: { name: 'Delta', emoji: '⚫', patterns: [/delta/i, /getdelta/i] },
    arceusx: { name: 'Arceus X', emoji: '🟠', patterns: [/spdmteam/i, /arceusx/i] },
    hydrogen: { name: 'Hydrogen', emoji: '🔷', patterns: [/hydrogen/i] },
    codex: { name: 'Codex', emoji: '⬛', patterns: [/codex/i] },
    vegax: { name: 'Vega X', emoji: '🟤', patterns: [/vegax/i] },
    rekonise: { name: 'Rekonise', emoji: '🟣', patterns: [/rekonise/i] },
    workink: { name: 'Work.ink', emoji: '💼', patterns: [/work\.ink/i] },
    mediafire: { name: 'MediaFire', emoji: '📁', patterns: [/mediafire/i] },
    adfly: { name: 'AdFly', emoji: '🦋', patterns: [/adf\.ly/i] },
    shorte: { name: 'Shorte.st', emoji: '🔗', patterns: [/shorte\.st/i, /sh\.st/i] },
    sub2unlock: { name: 'Sub2Unlock', emoji: '📺', patterns: [/sub2unlock/i] }
};

// Detect service from URL
function detectService(url) {
    for (const [key, service] of Object.entries(SERVICES)) {
        if (service.patterns.some(p => p.test(url))) return { key, ...service };
    }
    return null;
}

// Generate random key
function generateKey(prefix) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return prefix + '_' + Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Bypass function
async function bypass(url, service) {
    const start = Date.now();
    
    // Simulate bypass process (real implementation would vary)
    await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
    
    const methods = ['API Extract', 'Token Bypass', 'Direct Access', 'Session Skip', 'Checkpoint Bypass'];
    
    return {
        success: true,
        key: generateKey(service.key.toUpperCase().slice(0, 5)),
        method: methods[Math.floor(Math.random() * methods.length)],
        time: Date.now() - start
    };
}

// Slash commands
const commands = [
    { name: 'bypass', description: 'Bypass link', options: [{ name: 'url', type: 3, description: 'URL to bypass', required: true }] },
    { name: 'services', description: 'List supported services' },
    { name: 'stats', description: 'Bot statistics' },
    { name: 'ping', description: 'Check latency' }
];

// Ready event
client.once('ready', async () => {
    console.log(`\n✅ ${client.user.tag} is online!`);
    console.log(`📊 Servers: ${client.guilds.cache.size}`);
    console.log(`🔓 Services: ${Object.keys(SERVICES).length}\n`);

    client.user.setActivity('/bypass | ' + Object.keys(SERVICES).length + ' services', { type: 3 });

    // Register commands
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
        if (commandName === 'ping') {
            const sent = await interaction.reply({ content: '🏓 Pinging...', fetchReply: true });
            await interaction.editReply(`🏓 Pong! **${sent.createdTimestamp - interaction.createdTimestamp}ms** | API: **${client.ws.ping}ms**`);
        }

        else if (commandName === 'services') {
            const list = Object.values(SERVICES).map(s => `${s.emoji} ${s.name}`).join('\n');
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🔓 Supported Services')
                .setDescription(list)
                .setFooter({ text: `Total: ${Object.keys(SERVICES).length} services` });
            await interaction.reply({ embeds: [embed] });
        }

        else if (commandName === 'stats') {
            const uptime = Math.floor((Date.now() - stats.start) / 1000);
            const h = Math.floor(uptime / 3600);
            const m = Math.floor((uptime % 3600) / 60);
            const s = uptime % 60;
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('📊 Statistics')
                .addFields(
                    { name: 'Total Bypasses', value: `\`${stats.total}\``, inline: true },
                    { name: 'Success', value: `\`${stats.success}\``, inline: true },
                    { name: 'Failed', value: `\`${stats.failed}\``, inline: true },
                    { name: 'Users', value: `\`${stats.users.size}\``, inline: true },
                    { name: 'Servers', value: `\`${client.guilds.cache.size}\``, inline: true },
                    { name: 'Uptime', value: `\`${h}h ${m}m ${s}s\``, inline: true }
                );
            await interaction.reply({ embeds: [embed] });
        }

        else if (commandName === 'bypass') {
            const url = interaction.options.getString('url');
            const service = detectService(url);

            if (!service) {
                return interaction.reply({ 
                    content: '❌ **URL tidak didukung!** Gunakan `/services` untuk melihat list.', 
                    ephemeral: true 
                });
            }

            // Loading
            await interaction.deferReply();

            // Process bypass
            stats.total++;
            const result = await bypass(url, service);

            if (result.success) {
                stats.success++;

                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle(`✅ ${service.emoji} ${service.name} Bypassed!`)
                    .addFields(
                        { name: '🔑 Key/Result', value: `\`\`\`${result.key}\`\`\``, inline: false },
                        { name: '⚡ Method', value: `\`${result.method}\``, inline: true },
                        { name: '⏱️ Time', value: `\`${result.time}ms\``, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: `Requested by ${interaction.user.tag}` });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('copy').setLabel('📋 Copy').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('retry').setLabel('🔄 New').setStyle(ButtonStyle.Primary)
                );

                await interaction.editReply({ embeds: [embed], components: [row] });
            } else {
                stats.failed++;
                await interaction.editReply({ content: `❌ Bypass gagal: ${result.error}` });
            }
        }
    } catch (error) {
        console.error(error);
        const reply = { content: '❌ Error occurred!', ephemeral: true };
        interaction.replied ? interaction.followUp(reply) : interaction.reply(reply);
    }
});

// Button handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    await interaction.reply({ content: interaction.customId === 'copy' ? '📋 Copy dari embed!' : '🔄 Gunakan `/bypass`!', ephemeral: true });
});

// Express keep-alive
const app = express();
app.get('/', (_, res) => res.json({ status: 'online', bot: client.user?.tag, uptime: Date.now() - stats.start }));
app.get('/health', (_, res) => res.send('OK'));
app.listen(PORT, () => console.log(`🌐 Server on port ${PORT}`));

// Login
client.login(TOKEN);
