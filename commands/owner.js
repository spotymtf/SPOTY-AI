const fs = require('fs');
const config = require('../config');

module.exports = {
    block: async (sock, jid, args, message) => {
        const user = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!user) {
            return sock.sendMessage(jid, { text: 'Veuillez mentionner un utilisateur' });
        }

        await sock.updateBlockStatus(user, 'block');
        await sock.sendMessage(jid, { text: 'Utilisateur bloqué' });
    },

    restart: async (sock, jid) => {
        await sock.sendMessage(jid, { text: 'Redémarrage du bot...' });
        process.exit(1);
    },

    setppbot: async (sock, jid, args, message) => {
        if (!message.message.imageMessage) {
            return sock.sendMessage(jid, { text: 'Veuillez envoyer une image' });
        }

        const media = await downloadContent(message);
        await sock.updateProfilePicture(sock.user.id, { url: media });
        await sock.sendMessage(jid, { text: 'Photo de profil mise à jour' });
    }
};
