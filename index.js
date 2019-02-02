require('dotenv').config()
const Discord = require("discord.js");
const token = process.env.DISCORD_KEY;
const client = new Discord.Client();

client.on('ready', () => {
    console.log('Bot is now connected');
})

client.login(token);