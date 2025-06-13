module.exports = {
    ping: async (sock, jid) => {
        const start = Date.now();
        const msg = await sock.sendMessage(jid, { text: 'Pong!' });
        const latency = Date.now() - start;
        await sock.sendMessage(jid, { text: `🚀 Latence: ${latency}ms` });
    },

    runtime: async (sock, jid) => {
        const uptime = process.uptime();
        const days = Math.floor(uptime / (3600 * 24));
        const hours = Math.floor((uptime % (3600 * 24)) / 3600);
        const mins = Math.floor((uptime % 3600) / 60);
        const secs = Math.floor(uptime % 60);
        
        await sock.sendMessage(jid, { 
            text: `⏳ Temps de fonctionnement: ${days}d ${hours}h ${mins}m ${secs}s` 
        });
    },

    time: async (sock, jid) => {
        const now = new Date();
        await sock.sendMessage(jid, { 
            text: `🕒 Heure actuelle: ${now.toLocaleString()}` 
        });
    }
};
