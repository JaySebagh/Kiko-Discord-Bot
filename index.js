require('dotenv').config()
const Discord = require("discord.js");
const token = process.env.DISCORD_KEY;
const client = new Discord.Client();
const superagent = require("superagent");

client.on('ready', () => {
    console.log('Bot is now connected');
    // client.channels.find(x => x.name === "general").send("Kiko has connected!");
})

client.on('message', async (msg) => {
    if (msg.content === ".hello") {
        msg.channel.send(`Hello ${msg.author}!`);
    }
    if (msg.content === ".master") {
        msg.channel.send(`My creator is Koe`);
    }
    if (msg.content === ".cat") {
        let {body} = await superagent.get("http://aws.random.cat/meow")
        if(!{body}) return msg.channel.send("Error. Try Again.")
            let cEmbed = new Discord.RichEmbed()
            .setImage(body.file)
            msg.channel.send({embed: cEmbed})
            msg.delete();
    }
});

client.login(token);