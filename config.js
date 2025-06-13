const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

module.exports = {
    // Core Configuration
    SESSION_ID: process.env.SESSION_ID || "",
    PREFIX: process.env.PREFIX || ".",
    BOT_NAME: process.env.BOT_NAME || "SPOTY-AI",
    
    // Owners Management
    OWNERS: process.env.OWNERS ? process.env.OWNERS.split(',') : [
        "+50946904797",
        "+50944156629"
    ],
    
    // Bot Features
    MODE: process.env.MODE || "public",
    AUTO_READ: process.env.AUTO_READ === "true" || true,
    
    // Media Settings
    STICKER_PACK: process.env.STICKER_PACK || "SPOTY-AI",
    MENU_IMAGE: process.env.MENU_IMAGE || "https://i.imgur.com/your-image.jpg",
    
    // Messages
    WELCOME_MSG: process.env.WELCOME_MSG || "Welcome @{user} to {group}!",
    GOODBYE_MSG: process.env.GOODBYE_MSG || "Goodbye @{user}, we'll miss you!",
    
    // Security
    ANTILINK: process.env.ANTILINK === "true" || false
};
