const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const express = require('express');
const https = require('https');

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
        patterns: [/linkvertise/i, /link-to\.net/i, /direct-link\.net/i] 
    },
    lootlink: { 
        name: 'Loot-Link', 
        emoji: '🟡', 
        patterns: [/loot-link/i, /lootlink/i] 
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
    }
};

function detectService(url) {
    for (const [key, service] of Object.entries(SERVICES)) {
        if (service.patterns.some(p => p.test(url))) {
            return { key, ...service };
        }
    }
    return null;
}

// ============================================
// PLATOBOOST REAL BYPASS
// ============================================

function httpsRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });
        
        req.on('error', reject);
        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
        
        if (postData) req.write(postData);
        req.end();
    });
}

async function bypassPlatoboost(url) {
    const start = Date.now();
    
    try {
        // Extract 'd' parameter from URL
        const urlObj = new URL(url);
        let encryptedData = urlObj.searchParams.get('d');
        
        // If no 'd' param, try to extract from path
        if (!encryptedData) {
            const pathMatch = url.match(/[?&]d=([^&]+)/);
            if (pathMatch) encryptedData = pathMatch[1];
        }
        
        if (!encryptedData) {
            // Try to get from the path itself for platorelay
            const pathParts = urlObj.pathname.split('/');
            if (pathParts.length > 2) {
                encryptedData = urlObj.searchParams.get('d') || pathParts[pathParts.length - 1];
            }
        }

        if (!encryptedData) {
            return {
                success: false,
                error: 'Tidak dapat menemukan parameter "d" dalam URL',
                time: Date.now() - start
            };
        }

        console.log(`[Platoboost] Encrypted data: ${encryptedData.substring(0, 50)}...`);

        // Step 1: Initial request to get session
        const initOptions = {
            hostname: 'api-gateway.platoboost.com',
            path: `/v1/authenticators/8/${encryptedData}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'Origin': 'https://auth.platoboost.app',
                'Referer': 'https://auth.platoboost.app/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site'
            }
        };

        console.log('[Platoboost] Sending initial request...');
        const initResponse = await httpsRequest(initOptions, '{}');
        console.log(`[Platoboost] Initial response status: ${initResponse.status}`);
        console.log(`[Platoboost] Initial response: ${initResponse.data.substring(0, 300)}`);

        let responseData;
        try {
            responseData = JSON.parse(initResponse.data);
        } catch {
            return {
                success: false,
                error: 'Invalid response from Platoboost API',
                time: Date.now() - start
            };
        }

        // Check if we got the key directly
        if (responseData.key) {
            return {
                success: true,
                key: responseData.key,
                method: 'Direct API',
                time: Date.now() - start
            };
        }

        // Check for captcha ID (means we need to solve captcha)
        if (responseData.captcha) {
            console.log('[Platoboost] Captcha required:', responseData.captcha);
            
            // Try to get key using alternative method
            const altResult = await tryAlternativeBypass(encryptedData);
            if (altResult.success) {
                return altResult;
            }
            
            return {
                success: false,
                error: 'Captcha diperlukan - tidak dapat bypass otomatis',
                captcha: true,
                time: Date.now() - start
            };
        }

        // If there's a redirect or next step
        if (responseData.redirect || responseData.url) {
            const redirectUrl = responseData.redirect || responseData.url;
            console.log('[Platoboost] Redirect to:', redirectUrl);
            
            // Follow redirect
            const redirectResult = await followRedirect(redirectUrl);
            if (redirectResult.success) {
                return {
                    success: true,
                    key: redirectResult.key,
                    method: 'Redirect Follow',
                    time: Date.now() - start
                };
            }
        }

        // Try loot endpoint
        if (responseData.lpiL) {
            const lootResult = await getLootKey(encryptedData, responseData.lpiL);
            if (lootResult.success) {
                return {
                    success: true,
                    key: lootResult.key,
                    method: 'Loot Endpoint',
                    time: Date.now() - start
                };
            }
        }

        return {
            success: false,
            error: 'Tidak dapat memperoleh key - mungkin perlu verifikasi manual',
            response: responseData,
            time: Date.now() - start
        };

    } catch (error) {
        console.error('[Platoboost] Error:', error);
        return {
            success: false,
            error: error.message,
            time: Date.now() - start
        };
    }
}

async function tryAlternativeBypass(encryptedData) {
    try {
        // Try different authenticator IDs
        const authenticatorIds = [8, 1, 2, 3, 4, 5, 6, 7, 9, 10];
        
        for (const authId of authenticatorIds) {
            const options = {
                hostname: 'api-gateway.platoboost.com',
                path: `/v1/authenticators/${authId}/${encryptedData}`,
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Origin': 'https://auth.platoboost.app',
                    'Referer': 'https://auth.platoboost.app/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            };
            
            const response = await httpsRequest(options);
            if (response.status === 200) {
                try {
                    const data = JSON.parse(response.data);
                    if (data.key) {
                        return { success: true, key: data.key };
                    }
                } catch {}
            }
        }
        
        return { success: false };
    } catch {
        return { success: false };
    }
}

async function getLootKey(encryptedData, lpiL) {
    try {
        const options = {
            hostname: 'api-gateway.platoboost.com',
            path: `/v1/authenticators/8/${encryptedData}/loot`,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': 'https://auth.platoboost.app',
                'Referer': 'https://auth.platoboost.app/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };
        
        const response = await httpsRequest(options, JSON.stringify({ lpiL }));
        const data = JSON.parse(response.data);
        
        if (data.key) {
            return { success: true, key: data.key };
        }
        
        return { success: false };
    } catch {
        return { success: false };
    }
}

async function followRedirect(url) {
    try {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'Accept': 'text/html,application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };
        
        const response = await httpsRequest(options);
        
        // Try to extract key from response
        const keyMatch = response.data.match(/FREE_[a-f0-9]{32}/i) || 
                        response.data.match(/"key"\s*:\s*"([^"]+)"/);
        
        if (keyMatch) {
            return { success: true, key: keyMatch[1] || keyMatch[0] };
        }
        
        return { success: false };
    } catch {
        return { success: false };
    }
}

// Generic bypass for other services
async function bypassGeneric(url, service) {
    const start = Date.now();
    
    // Try public bypass APIs
    const apis = [
        `https://api.bypass.vip/bypass?url=${encodeURIComponent(url)}`,
        `https://bypass.pm/bypass2?url=${encodeURIComponent(url)}`
    ];
    
    for (const apiUrl of apis) {
        try {
            const urlObj = new URL(apiUrl);
            const options = {
                hostname: urlObj.hostname,
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0'
                }
            };
            
            const response = await httpsRequest(options);
            const data = JSON.parse(response.data);
            
            if (data.destination || data.result || data.bypassed) {
                return {
                    success: true,
                    key: data.destination || data.result || data.bypassed,
                    method: 'API Bypass',
                    time: Date.now() - start
                };
            }
        } catch {}
    }
    
    return {
        success: false,
        error: 'Tidak dapat bypass link ini',
        time: Date.now() - start
    };
}

// Main bypass router
async function bypass(url, service) {
    console.log(`\n[Bypass] Service: ${service.name}`);
    console.log(`[Bypass] URL: ${url.substring(0, 80)}...`);
    
    if (service.key === 'platoboost') {
        return await bypassPlatoboost(url);
    }
    return await bypassGeneric(url, service);
}

// Slash commands
const commands = [
    { 
        name: 'bypass', 
        description: 'Bypass Platoboost & other links', 
        options: [{ name: 'url', type: 3, description: 'URL to bypass', required: true }] 
    },
    { name: 'services', description: 'List supported services' },
    { name: 'stats', description: 'Bot statistics' },
    { name: 'ping', description: 'Check latency' }
];

// Ready
client.once('ready', async () => {
    console.log(`\n✅ ${client.user.tag} online!`);
    console.log(`🔓 Services: ${Object.keys(SERVICES).length}`);
    console.log(`⚡ Mode: Real Platoboost Bypass\n`);

    client.user.setActivity('/bypass | Real Bypass', { type: 3 });

    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Commands registered!\n');
});

// Interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    stats.users.add(interaction.user.id);

    try {
        if (interaction.commandName === 'ping') {
            const sent = await interaction.reply({ content: '🏓 Pinging...', fetchReply: true });
            await interaction.editReply(`🏓 **${sent.createdTimestamp - interaction.createdTimestamp}ms** | API: **${client.ws.ping}ms**`);
        }

        else if (interaction.commandName === 'services') {
            const list = Object.values(SERVICES).map(s => `${s.emoji} **${s.name}**`).join('\n');
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🔓 Supported Services')
                .setDescription(list)
                .setFooter({ text: 'Real Bypass Mode' });
            await interaction.reply({ embeds: [embed] });
        }

        else if (interaction.commandName === 'stats') {
            const uptime = Math.floor((Date.now() - stats.start) / 1000 / 60);
            const rate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(0) : 0;
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('📊 Stats')
                .setDescription(`Total: **${stats.total}** | Success: **${stats.success}** (${rate}%)\nUsers: **${stats.users.size}** | Uptime: **${uptime}m**`);
            await interaction.reply({ embeds: [embed] });
        }

        else if (interaction.commandName === 'bypass') {
            const url = interaction.options.getString('url');
            const service = detectService(url);

            if (!service) {
                return interaction.reply({ 
                    content: '❌ **URL tidak didukung!**', 
                    ephemeral: true 
                });
            }

            await interaction.deferReply();

            const loadingEmbed = new EmbedBuilder()
                .setColor('#ffaa00')
                .setTitle(`${service.emoji} Bypassing ${service.name}...`)
                .setDescription('```Connecting to Platoboost API...```');
            
            await interaction.editReply({ embeds: [loadingEmbed] });

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
                    .setFooter({ text: `${interaction.user.tag}` })
                    .setTimestamp();

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('copy').setLabel('📋 Copy').setStyle(ButtonStyle.Success)
                );

                await interaction.editReply({ embeds: [embed], components: [row] });

            } else {
                stats.failed++;
                
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle(`❌ Bypass Failed`)
                    .setDescription(`\`\`\`${result.error}\`\`\``)
                    .addFields({
                        name: '💡 Kemungkinan',
                        value: result.captcha 
                            ? '• Link memerlukan CAPTCHA\n• Gunakan userscript di browser'
                            : '• Link expired\n• Perlu verifikasi manual\n• Coba lagi nanti'
                    })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }
        }
    } catch (error) {
        console.error('Error:', error);
        const reply = { content: `❌ ${error.message}`, ephemeral: true };
        interaction.replied || interaction.deferred ? interaction.followUp(reply) : interaction.reply(reply);
    }
});

client.on('interactionCreate', async i => {
    if (i.isButton() && i.customId === 'copy') {
        await i.reply({ content: '📋 Copy key dari kotak!', ephemeral: true });
    }
});

const app = express();
app.get('/', (_, r) => r.json({ status: 'online', mode: 'real_bypass' }));
app.get('/health', (_, r) => r.send('OK'));
app.listen(PORT);

client.login(TOKEN);
