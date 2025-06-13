const config = require('../config');

module.exports = {
    add: async (sock, jid, user, args, message, isAdmin) => {
        if (!isAdmin) {
            return sock.sendMessage(jid, { text: 'Commande réservée aux admins' });
        }

        const numbers = args.map(num => num.includes('@') ? num : num + '@s.whatsapp.net');
        await sock.groupParticipantsUpdate(jid, numbers, 'add');
        await sock.sendMessage(jid, { text: 'Membres ajoutés avec succès' });
    },

    antilink: async (sock, jid, user, args) => {
        const action = args[0]?.toLowerCase();
        if (action === 'on') {
            config.ANTILINK = true;
            await sock.sendMessage(jid, { text: 'Antilink activé' });
        } else if (action === 'off') {
            config.ANTILINK = false;
            await sock.sendMessage(jid, { text: 'Antilink désactivé' });
        } else {
            await sock.sendMessage(jid, { text: `Statut antilink: ${config.ANTILINK ? 'ON' : 'OFF'}` });
        }
    },

    welcome: async (sock, jid, user, args) => {
        const newMessage = args.join(' ');
        if (newMessage) {
            config.WELCOME_MSG = newMessage;
            await sock.sendMessage(jid, { text: 'Message de bienvenue mis à jour' });
        } else {
            await sock.sendMessage(jid, { text: `Message actuel: ${config.WELCOME_MSG}` });
        }
    },

    kick: async (sock, jid, user, args, message, isAdmin) => {
        if (!isAdmin) {
            return sock.sendMessage(jid, { text: 'Commande réservée aux admins' });
        }

        const participants = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (participants.length === 0) {
            return sock.sendMessage(jid, { text: 'Veuillez mentionner un utilisateur' });
        }

        await sock.groupParticipantsUpdate(jid, participants, 'remove');
        await sock.sendMessage(jid, { text: 'Utilisateur(s) expulsé(s)' });
    }
};
