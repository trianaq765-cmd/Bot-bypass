const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const express = require('express');
const https = require('https');
const http = require('http');

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
        patterns: [/platoboost/i, /platorelay/i, /plato\.gg/i, /gateway\.plato/i] 
    },
    linkvertise: { 
        name: 'Linkvertise', 
        emoji: '🟢', 
        patterns: [/linkvertise/i, /link-to\.net/i, /direct-link\.net/i, /link-center\.net/i, /link-target\.net/i] 
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
    workink: { 
        name: 'Work.ink', 
        emoji: '💼', 
        patterns: [/work\.ink/i] 
    },
    rekonise: { 
        name: 'Rekonise', 
        emoji: '🟣', 
        patterns: [/rekonise/i, /rektink/i] 
    },
    socialunlock: {
        name: 'Social Unlock',
        emoji: '🔓',
        patterns: [/social-unlock/i, /socialunlock/i]
    },
    adfly: { 
        name: 'AdFly', 
        emoji: '🦋', 
        patterns: [/adf\.ly/i, /j\.gs/i, /q\.gs/i] 
    },
    shorte: { 
        name: 'Shorte.st', 
        emoji: '🔗', 
        patterns: [/shorte\.st/i, /sh\.st/i, /gestyy/i] 
    },
    gplinks: {
        name: 'GPLinks',
        emoji: '🟩',
        patterns: [/gplinks/i]
    }
};

function detectService(url) {
    const lowerUrl = url.toLowerCase();
    for (const [key, service] of Object.entries(SERVICES)) {
        if (service.patterns.some(p => p.test(lowerUrl))) {
            return { key, ...service };
        }
    }
    return null;
}

// ============================================
// REAL BYPASS FUNCTIONS
// ============================================

function fetchUrl(url, options = {}) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https');
        const lib = isHttps ? https : http;
        
        const req = lib.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                ...options.headers
            },
            timeout: 15000
        }, (res) => {
            let data = '';
            
            // Handle redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchUrl(res.headers.location, options).then(resolve).catch(reject);
            }
            
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ data, status: res.statusCode, headers: res.headers });
                } catch (e) {
                    resolve({ data, status: res.statusCode, headers: res.headers });
                }
            });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

function postUrl(url, body, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = url.startsWith('https');
        const lib = isHttps ? https : http;
        
        const postData = typeof body === 'string' ? body : JSON.stringify(body);
        
        const reqOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'Accept': 'application/json',
                ...options.headers
            },
            timeout: 15000
        };
        
        const req = lib.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ data: JSON.parse(data), status: res.statusCode });
                } catch {
                    resolve({ data, status: res.statusCode });
                }
            });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.write(postData);
        req.end();
    });
}

// ============================================
// BYPASS APIS (Multiple sources for reliability)
// ============================================

const BYPASS_APIS = [
    {
        name: 'bypass.vip',
        url: 'https://api.bypass.vip/bypass?url=',
        parse: (data) => {
            if (typeof data === 'object' && data.destination) return data.destination;
            if (typeof data === 'object' && data.result) return data.result;
            return null;
        }
    },
    {
        name: 'api.bypass.vip',
        url: 'https://api.bypass.vip/bypass?url=',
        parse: (data) => data?.destination || data?.result || null
    },
    {
        name: 'bypass.pm (v1)',
        url: 'https://bypass.pm/bypass2?url=',
        parse: (data) => data?.destination || data?.bypassed || null
    }
];

async function tryBypassAPIs(url) {
    const errors = [];
    
    for (const api of BYPASS_APIS) {
        try {
            console.log(`[Bypass] Trying ${api.name}...`);
            const response = await fetchUrl(api.url + encodeURIComponent(url));
            
            let data;
            try {
                data = JSON.parse(response.data);
            } catch {
                data = response.data;
            }
            
            console.log(`[Bypass] ${api.name} response:`, typeof data === 'object' ? JSON.stringify(data).substring(0, 200) : data.substring(0, 200));
            
            const result = api.parse(data);
            if (result && result.length > 5) {
                return { success: true, result, api: api.name };
            }
        } catch (error) {
            console.log(`[Bypass] ${api.name} failed:`, error.message);
            errors.push(`${api.name}: ${error.message}`);
        }
    }
    
    return { success: false, errors };
}

// ============================================
// SPECIFIC BYPASS METHODS
// ============================================

async function bypassPlatoboost(url) {
    const start = Date.now();
    
    try {
        // Method 1: Try bypass APIs
        const apiResult = await tryBypassAPIs(url);
        if (apiResult.success) {
            return {
                success: true,
                key: apiResult.result,
                method: `API Bypass (${apiResult.api})`,
                time: Date.now() - start
            };
        }
        
        // Method 2: Direct extraction from URL
        const urlObj = new URL(url);
        const dataParam = urlObj.searchParams.get('d');
        
        if (dataParam) {
            try {
                const decoded = Buffer.from(dataParam, 'base64').toString('utf-8');
                const jsonMatch = decoded.match(/\{.*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    if (parsed.key || parsed.destination) {
                        return {
                            success: true,
                            key: parsed.key || parsed.destination,
                            method: 'Data Extract',
                            time: Date.now() - start
                        };
                    }
                }
            } catch {}
        }
        
        return {
            success: false,
            error: 'Tidak dapat bypass. API tidak tersedia atau link invalid.',
            time: Date.now() - start
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message,
            time: Date.now() - start
        };
    }
}

async function bypassLinkvertise(url) {
    const start = Date.now();
    
    try {
        const apiResult = await tryBypassAPIs(url);
        if (apiResult.success) {
            return {
                success: true,
                key: apiResult.result,
                method: `API Bypass (${apiResult.api})`,
                time: Date.now() - start
            };
        }
        
        return {
            success: false,
            error: 'Bypass API tidak tersedia',
            time: Date.now() - start
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            time: Date.now() - start
        };
    }
}

async function bypassGeneric(url, service) {
    const start = Date.now();
    
    try {
        const apiResult = await tryBypassAPIs(url);
        if (apiResult.success) {
            return {
                success: true,
                key: apiResult.result,
                method: `API Bypass (${apiResult.api})`,
                time: Date.now() - start
            };
        }
        
        return {
            success: false,
            error: 'Tidak dapat bypass link ini',
            time: Date.now() - start
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            time: Date.now() - start
        };
    }
}

// Main bypass router
async function bypass(url, service) {
    console.log(`[Bypass] Starting bypass for ${service.name}: ${url.substring(0, 50)}...`);
    
    switch (service.key) {
        case 'platoboost':
            return await bypassPlatoboost(url);
        case 'linkvertise':
            return await bypassLinkvertise(url);
        default:
            return await bypassGeneric(url, service);
    }
}

// Slash commands
const commands = [
    { 
        name: 'bypass', 
        description: 'Bypass any supported link (REAL)', 
        options: [{ name: 'url', type: 3, description: 'URL to bypass', required: true }] 
    },
    { name: 'services', description: 'List all supported services' },
    { name: 'stats', description: 'View bot statistics' },
    { name: 'ping', description: 'Check bot latency' }
];

// Ready
client.once('ready', async () => {
    console.log(`\n✅ ${client.user.tag} is online!`);
    console.log(`📊 Servers: ${client.guilds.cache.size}`);
    console.log(`🔓 Services: ${Object.keys(SERVICES).length}`);
    console.log(`⚡ Mode: REAL BYPASS\n`);

    client.user.setActivity(`/bypass | Real Bypass`, { type: 3 });

    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Commands registered!\n');
});

// Interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    stats.users.add(interaction.user.id);
    const { commandName } = interaction;

    try {
        if (commandName === 'ping') {
            const sent = await interaction.reply({ content: '🏓 Pinging...', fetchReply: true });
            await interaction.editReply(`🏓 **Pong!** \`${sent.createdTimestamp - interaction.createdTimestamp}ms\` | API: \`${client.ws.ping}ms\``);
        }

        else if (commandName === 'services') {
            const list = Object.values(SERVICES).map(s => `${s.emoji} **${s.name}**`).join('\n');
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🔓 Supported Services (Real Bypass)')
                .setDescription(list)
                .addFields({ name: '⚡ Mode', value: '```Real Bypass - Mendapatkan key/link asli```' })
                .setFooter({ text: `${Object.keys(SERVICES).length} services` })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        }

        else if (commandName === 'stats') {
            const uptime = Math.floor((Date.now() - stats.start) / 1000);
            const h = Math.floor(uptime / 3600);
            const m = Math.floor((uptime % 3600) / 60);
            const rate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : 0;
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('📊 Statistics')
                .addFields(
                    { name: 'Total', value: `\`${stats.total}\``, inline: true },
                    { name: 'Success', value: `\`${stats.success}\``, inline: true },
                    { name: 'Failed', value: `\`${stats.failed}\``, inline: true },
                    { name: 'Rate', value: `\`${rate}%\``, inline: true },
                    { name: 'Users', value: `\`${stats.users.size}\``, inline: true },
                    { name: 'Uptime', value: `\`${h}h ${m}m\``, inline: true }
                )
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        }

        else if (commandName === 'bypass') {
            const url = interaction.options.getString('url');
            const service = detectService(url);

            if (!service) {
                return interaction.reply({ 
                    content: `❌ **URL tidak didukung!**\nGunakan \`/services\` untuk melihat list.`, 
                    ephemeral: true 
                });
            }

            await interaction.deferReply();

            // Loading
            const loadingEmbed = new EmbedBuilder()
                .setColor('#ffaa00')
                .setTitle(`${service.emoji} Bypassing ${service.name}...`)
                .setDescription('```⏳ Menghubungi bypass server...\n\n[████████░░░░░░░░░░░░] 40%```')
                .setFooter({ text: 'Real Bypass - Mohon tunggu...' })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [loadingEmbed] });

            // Process real bypass
            stats.total++;
            const result = await bypass(url, service);

            if (result.success) {
                stats.success++;

                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle(`✅ ${service.emoji} ${service.name} - Bypassed!`)
                    .addFields(
                        { name: '🔑 Result', value: `\`\`\`${result.key}\`\`\``, inline: false },
                        { name: '⚡ Method', value: `\`${result.method}\``, inline: true },
                        { name: '⏱️ Time', value: `\`${result.time}ms\``, inline: true }
                    )
                    .setFooter({ text: `Real Bypass | ${interaction.user.tag}` })
                    .setTimestamp();

                // If result is a URL, add visit button
                const isUrl = result.key.startsWith('http');
                
                const row = new ActionRowBuilder();
                
                if (isUrl) {
                    row.addComponents(
                        new ButtonBuilder()
                            .setLabel('🔗 Open Link')
                            .setStyle(ButtonStyle.Link)
                            .setURL(result.key)
                    );
                }
                
                row.addComponents(
                    new ButtonBuilder().setCustomId('copy').setLabel('📋 Copy').setStyle(ButtonStyle.Secondary)
                );

                await interaction.editReply({ embeds: [embed], components: [row] });

            } else {
                stats.failed++;
                
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle(`❌ ${service.emoji} Bypass Failed`)
                    .addFields(
                        { name: '❗ Error', value: `\`\`\`${result.error}\`\`\``, inline: false },
                        { name: '⏱️ Time', value: `\`${result.time}ms\``, inline: true }
                    )
                    .addFields({
                        name: '💡 Kemungkinan Penyebab',
                        value: '• Link sudah expired\n• Service sedang down\n• Link memerlukan verifikasi manual\n• Rate limit dari API',
                        inline: false
                    })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }
        }
    } catch (error) {
        console.error('Error:', error);
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
        await interaction.reply({ content: '📋 Copy hasil dari kotak di atas!', ephemeral: true });
    }
});

// Express
const app = express();
app.get('/', (_, res) => res.json({ 
    status: 'online', 
    mode: 'real_bypass',
    bot: client.user?.tag,
    stats: { total: stats.total, success: stats.success }
}));
app.get('/health', (_, res) => res.send('OK'));
app.listen(PORT, () => console.log(`🌐 Port ${PORT}`));

client.login(TOKEN);
