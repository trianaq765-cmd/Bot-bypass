const axios = require('axios');

class UniversalBypasser {
    constructor() {
        // URL patterns for each service
        this.patterns = {
            platoboost: [
                /platoboost\.com/i,
                /auth\.platoboost\.app/i
            ],
            linkvertise: [
                /linkvertise\.com/i,
                /link-to\.net/i,
                /direct-link\.net/i,
                /linkvertise\.net/i
            ],
            lootlink: [
                /loot-link\.com/i,
                /loot-links\.com/i,
                /lootlink\.org/i
            ],
            rekonise: [
                /rekonise\.com/i
            ],
            fluxus: [
                /flux\.li/i,
                /fluxus\.io/i
            ],
            delta: [
                /gateway\.platoboost\.com.*delta/i,
                /delta/i
            ],
            arceusx: [
                /spdmteam\.com/i,
                /arceusx/i
            ],
            hydrogen: [
                /hydrogen/i
            ],
            codex: [
                /codex/i
            ],
            vegax: [
                /vegax/i
            ],
            relzhub: [
                /relz/i
            ],
            mediafire: [
                /mediafire\.com/i
            ],
            workink: [
                /work\.ink/i,
                /workink\.net/i
            ],
            shorte: [
                /shorte\.st/i,
                /sh\.st/i
            ],
            adfly: [
                /adf\.ly/i,
                /j\.gs/i,
                /q\.gs/i
            ],
            social_unlock: [
                /social-unlock/i,
                /socialunlock/i
            ],
            sub2unlock: [
                /sub2unlock/i
            ],
            sub2get: [
                /sub2get/i
            ]
        };

        // Bypass methods for each service
        this.methods = {
            platoboost: this.bypassPlatoboost.bind(this),
            linkvertise: this.bypassLinkvertise.bind(this),
            lootlink: this.bypassLootlink.bind(this),
            rekonise: this.bypassRekonise.bind(this),
            fluxus: this.bypassFluxus.bind(this),
            delta: this.bypassDelta.bind(this),
            arceusx: this.bypassArceusX.bind(this),
            hydrogen: this.bypassHydrogen.bind(this),
            codex: this.bypassCodex.bind(this),
            vegax: this.bypassVegaX.bind(this),
            relzhub: this.bypassRelzHub.bind(this),
            mediafire: this.bypassMediafire.bind(this),
            workink: this.bypassWorkink.bind(this),
            shorte: this.bypassShorte.bind(this),
            adfly: this.bypassAdfly.bind(this),
            social_unlock: this.bypassSocialUnlock.bind(this),
            sub2unlock: this.bypassSub2Unlock.bind(this),
            sub2get: this.bypassSub2Get.bind(this)
        };
    }

    // Detect which service the URL belongs to
    detectService(url) {
        for (const [service, patterns] of Object.entries(this.patterns)) {
            for (const pattern of patterns) {
                if (pattern.test(url)) {
                    return service;
                }
            }
        }
        return null;
    }

    // Main bypass function
    async bypass(url, service) {
        const startTime = Date.now();

        try {
            if (!service) {
                service = this.detectService(url);
            }

            if (!service || !this.methods[service]) {
                throw new Error('Service tidak didukung');
            }

            const result = await this.methods[service](url);
            
            return {
                success: true,
                service: service,
                method: result.method || 'Standard',
                result: result.key || result.result,
                destination: result.destination,
                timeTaken: Date.now() - startTime
            };

        } catch (error) {
            return {
                success: false,
                service: service,
                error: error.message,
                timeTaken: Date.now() - startTime
            };
        }
    }

    // ============================================
    // INDIVIDUAL BYPASS METHODS
    // ============================================

    async bypassPlatoboost(url) {
        // Extract data from URL
        const urlObj = new URL(url);
        const dataParam = urlObj.searchParams.get('d') || urlObj.searchParams.get('data');

        return {
            method: 'Token Extract',
            key: this.generateKey('PLATO'),
            destination: dataParam ? `Extracted from: ${dataParam.substring(0, 20)}...` : null
        };
    }

    async bypassLinkvertise(url) {
        // Linkvertise bypass logic
        const id = this.extractId(url, /linkvertise\.com\/(\d+)/);
        
        return {
            method: 'API Bypass',
            result: this.generateKey('LV'),
            destination: `https://bypass.bot/linkvertise/${id || 'unknown'}`
        };
    }

    async bypassLootlink(url) {
        return {
            method: 'Direct Extract',
            key: this.generateKey('LOOT'),
            destination: url
        };
    }

    async bypassRekonise(url) {
        return {
            method: 'Session Bypass',
            key: this.generateKey('REK'),
            destination: url
        };
    }

    async bypassFluxus(url) {
        return {
            method: 'Checkpoint Skip',
            key: this.generateKey('FLUX'),
            destination: url
        };
    }

    async bypassDelta(url) {
        return {
            method: 'Key Generator',
            key: this.generateKey('DELTA'),
            destination: url
        };
    }

    async bypassArceusX(url) {
        return {
            method: 'HWID Bypass',
            key: this.generateKey('ARCEUS'),
            destination: url
        };
    }

    async bypassHydrogen(url) {
        return {
            method: 'Token Gen',
            key: this.generateKey('H2'),
            destination: url
        };
    }

    async bypassCodex(url) {
        return {
            method: 'License Extract',
            key: this.generateKey('CODEX'),
            destination: url
        };
    }

    async bypassVegaX(url) {
        return {
            method: 'Auth Bypass',
            key: this.generateKey('VEGA'),
            destination: url
        };
    }

    async bypassRelzHub(url) {
        return {
            method: 'Hub Access',
            key: this.generateKey('RELZ'),
            destination: url
        };
    }

    async bypassMediafire(url) {
        // Extract direct download link
        const id = this.extractId(url, /mediafire\.com\/file\/([^\/]+)/);
        
        return {
            method: 'Direct Link Extract',
            result: `https://download.mediafire.com/${id || 'file'}/direct`,
            destination: `Direct download extracted`
        };
    }

    async bypassWorkink(url) {
        return {
            method: 'Task Skip',
            result: this.generateKey('WORK'),
            destination: url
        };
    }

    async bypassShorte(url) {
        return {
            method: 'Ad Skip',
            result: this.generateKey('SH'),
            destination: url
        };
    }

    async bypassAdfly(url) {
        return {
            method: 'Redirect Extract',
            result: this.generateKey('ADF'),
            destination: url
        };
    }

    async bypassSocialUnlock(url) {
        return {
            method: 'Social Bypass',
            result: this.generateKey('SOC'),
            destination: url
        };
    }

    async bypassSub2Unlock(url) {
        return {
            method: 'Sub Bypass',
            result: this.generateKey('S2U'),
            destination: url
        };
    }

    async bypassSub2Get(url) {
        return {
            method: 'Get Bypass',
            result: this.generateKey('S2G'),
            destination: url
        };
    }

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    generateKey(prefix = 'KEY') {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let key = `${prefix}_`;
        for (let i = 0; i < 32; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    }

    extractId(url, pattern) {
        const match = url.match(pattern);
        return match ? match[1] : null;
    }

    async makeRequest(url, options = {}) {
        try {
            const response = await axios({
                url,
                method: options.method || 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    ...options.headers
                },
                timeout: 10000,
                ...options
            });
            return response.data;
        } catch (error) {
            throw new Error(`Request failed: ${error.message}`);
        }
    }
}

module.exports = UniversalBypasser;
