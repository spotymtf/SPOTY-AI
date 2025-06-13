const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

module.exports = {
    // Core Configuration
    SESSION_ID: process.env.SESSION_ID || "",
    PREFIX: process.env.PREFIX || ".",
    BOT_NAME: process.env.BOT_NAME || "SPOTY-AI",
    
    // Owners Management
    OWNERS: process.env.OWNERS ? process.env.OWNERS.split(',') : [],
    SUDO: process.env.SUDO ? process.env.SUDO.split(',') : [],
    BLOCKED: process.env.BLOCKED ? process.env.BLOCKED.split(',') : [],
    
    // Bot Features
    MODE: process.env.MODE || "public",
    AUTO_READ: process.env.AUTO_READ !== "false",
    DISABLED_CMDS: process.env.DISABLED_CMDS ? process.env.DISABLED_CMDS.split(',') : [],
    
    // Group Settings
    WELCOME_ENABLED: process.env.WELCOME_ENABLED !== "false",
    GOODBYE_ENABLED: process.env.GOODBYE_ENABLED !== "false",
    ANTILINK: process.env.ANTILINK === "true",
    ANTILINK_ACTION: process.env.ANTILINK_ACTION || "warn",
    
    // Media Settings
    STICKER_PACK: process.env.STICKER_PACK || "SPOTY-AI",
    MENU_IMAGE: process.env.MENU_IMAGE || "",
    
    // Messages
    WELCOME_MSG: process.env.WELCOME_MSG || "✨ Welcome @{user} to {group}!",
    GOODBYE_MSG: process.env.GOODBYE_MSG || "😢 Goodbye @{user}, hope to see you again!",
    MENU_HEADER: process.env.MENU_HEADER || "┏▣ ◈ *SPOTY-AI* ◈",
    MENU_FOOTER: process.env.MENU_FOOTER || "┗▣"
};
