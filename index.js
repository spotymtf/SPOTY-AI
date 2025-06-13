require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { 
    makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const config = require('./config');
const { imageToWebp } = require('wa-sticker-formatter');

// Logger setup
const logger = pino({ level: 'silent' });

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'auth'));
    const { version } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: true,
        auth: state,
        browser: [config.BOT_NAME, 'Safari', '3.0'],
        getMessage: async (key) => ({ conversation: 'SPOTY-AI is active' })
    });

    // Event Handlers
    sock.ev.on('connection.update', handleConnection);
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('messages.upsert', handleMessages);
    sock.ev.on('group-participants.update', handleGroupUpdate);

    async function handleConnection(update) {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                console.log('Reconnecting...');
                startBot();
            }
        } else if (connection === 'open') {
            console.log(`${config.BOT_NAME} successfully connected!`);
        }
    }

    async function handleMessages({ messages, type }) {
        if (type !== 'notify') return;
        
        for (const message of messages) {
            const msg = message.message;
            if (!msg) continue;
            
            const jid = message.key.remoteJid;
            const user = (message.key.participant || jid).split('@')[0];
            const body = msg.conversation || msg.extendedTextMessage?.text || '';
            const isCmd = body.startsWith(config.PREFIX);
            const isOwner = config.OWNERS.includes(jid.replace('@s.whatsapp.net', ''));

            // Auto-read messages
            if (config.AUTO_READ) await sock.readMessages([message.key]);

            // Command handler
            if (isCmd) {
                const cmd = body.slice(config.PREFIX.length).trim().split(/ +/)[0].toLowerCase();
                const args = body.split(/ +/).slice(1);
                
                try {
                    switch (cmd) {
                        case 'ping':
                            await sock.sendMessage(jid, { text: '🚀 Pong!' });
                            break;
                            
                        case 'owner':
                            const ownerList = config.OWNERS.map((num, i) => 
                                `${i+1}. ${num}`).join('\n');
                            await sock.sendMessage(jid, {
                                text: `👑 *SPOTY AI Owners* 👑\n\n${ownerList}`,
                                mentions: config.OWNERS.map(num => num + '@s.whatsapp.net')
                            });
                            break;
                            
                        case 'sticker':
                            if (msg.imageMessage) {
                                const media = await downloadContent(message);
                                const sticker = await imageToWebp(media);
                                await sock.sendMessage(jid, { sticker }, { quoted: message });
                            }
                            break;
                            
                        // Add more commands here
                    }
                } catch (error) {
                    console.error('Command error:', error);
                }
            }
        }
    }

    async function handleGroupUpdate({ id, participants, action }) {
        const metadata = await sock.groupMetadata(id);
        
        for (const participant of participants) {
            const user = participant.split('@')[0];
            const msg = action === 'add' 
                ? config.WELCOME_MSG
                    .replace('{user}', user)
                    .replace('{group}', metadata.subject)
                : config.GOODBYE_MSG.replace('{user}', user);
            
            await sock.sendMessage(id, { 
                text: msg, 
                mentions: [participant] 
            });
        }
    }

    // Helper function
    async function downloadContent(message) {
        const stream = await downloadContentFromMessage(message, 'buffer', {});
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    }
}

// Start bot with error handling
startBot().catch(err => {
    console.error('Bot error:', err);
    process.exit(1);
});
