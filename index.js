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

// Import des commandes
const downloadCommands = require('./commands/download');
const groupCommands = require('./commands/group');
const ownerCommands = require('./commands/owner');
const otherCommands = require('./commands/other');
const { isUrl, getRandom } = require('./commands/utils');

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
            const isGroup = jid.endsWith('@g.us');
            const isOwner = config.OWNERS.includes(user);
            const isAdmin = isGroup ? await isGroupAdmin(sock, jid, user + '@s.whatsapp.net') : false;

            // Auto-read messages
            if (config.AUTO_READ) await sock.readMessages([message.key]);

            // Command handler
            if (isCmd) {
                const cmd = body.slice(config.PREFIX.length).trim().split(/ +/)[0].toLowerCase();
                const args = body.split(/ +/).slice(1);
                
                try {
                    // Menu command
                    if (cmd === 'menu') {
                        await showMenu(sock, jid);
                        return;
                    }

                    // Handle commands by category
                    if (downloadCommands[cmd]) {
                        await downloadCommands[cmd](sock, jid, args, message);
                    } 
                    else if (groupCommands[cmd]) {
                        if (isGroup) {
                            await groupCommands[cmd](sock, jid, user, args, message, isAdmin);
                        } else {
                            await sock.sendMessage(jid, { text: 'Cette commande est réservée aux groupes' });
                        }
                    }
                    else if (ownerCommands[cmd]) {
                        if (isOwner) {
                            await ownerCommands[cmd](sock, jid, args, message);
                        } else {
                            await sock.sendMessage(jid, { text: 'Commande réservée aux owners' });
                        }
                    }
                    else if (otherCommands[cmd]) {
                        await otherCommands[cmd](sock, jid, args, message);
                    }
                    else {
                        await sock.sendMessage(jid, { 
                            text: `Commande inconnue. Tapez ${config.PREFIX}menu pour voir les commandes disponibles`
                        });
                    }
                } catch (error) {
                    console.error('Command error:', error);
                    await sock.sendMessage(jid, { text: 'Une erreur est survenue lors de l\'exécution de la commande' });
                }
            }
        }
    }

    async function handleGroupUpdate({ id, participants, action }) {
        if (!config.WELCOME_ENABLED && !config.GOODBYE_ENABLED) return;
        
        const metadata = await sock.groupMetadata(id);
        
        for (const participant of participants) {
            const user = participant.split('@')[0];
            if (action === 'add' && config.WELCOME_ENABLED) {
                const msg = config.WELCOME_MSG
                    .replace('{user}', user)
                    .replace('{group}', metadata.subject);
                await sock.sendMessage(id, { text: msg, mentions: [participant] });
            } 
            else if (action === 'remove' && config.GOODBYE_ENABLED) {
                const msg = config.GOODBYE_MSG.replace('{user}', user);
                await sock.sendMessage(id, { text: msg, mentions: [participant] });
            }
        }
    }

    async function isGroupAdmin(sock, groupJid, userJid) {
        try {
            const metadata = await sock.groupMetadata(groupJid);
            const participant = metadata.participants.find(p => p.id === userJid);
            return participant?.admin === 'admin' || participant?.admin === 'superadmin';
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    }

    async function showMenu(sock, jid) {
        const menuSections = [
            config.MENU_HEADER,
            `┃ *Prefix* : [ ${config.PREFIX} ]`,
            `┃ *Version* : 2.0.0`,
            `┃ *Mode* : ${config.MODE}`,
            config.MENU_FOOTER,
            "",
            "┏▣ ◈ *DOWNLOAD MENU* ◈",
            "│➽ tiktok [lien]",
            config.MENU_FOOTER,
            "",
            "┏▣ ◈ *GROUP MENU* ◈",
            "│➽ add [num]",
            "│➽ antilink [on/off]",
            "│➽ welcome [message]",
            "│➽ kick @user",
            "│➽ promote @user",
            "│➽ demote @user",
            "│➽ tagall [message]",
            config.MENU_FOOTER,
            "",
            "┏▣ ◈ *OTHER MENU* ◈",
            "│➽ ping",
            "│➽ runtime",
            "│➽ time",
            config.MENU_FOOTER,
            "",
            "┏▣ ◈ *OWNER MENU* ◈",
            "│➽ block @user",
            "│➽ restart",
            "│➽ setppbot [image]",
            config.MENU_FOOTER
        ].join('\n');
        
        await sock.sendMessage(jid, { text: menuSections });
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

// Start bot with error handling
startBot().catch(err => {
    console.error('Bot error:', err);
    process.exit(1);
});
