require('dotenv').config()
const Discord = require("discord.js");
const token = process.env.DISCORD_KEY;
const client = new Discord.Client({disableEveryone: true});
const superagent = require("superagent");
const ytdl = require("ytdl-core");

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

// music
client.on('warn', console.warn);
client.on('error', console.error);
client.on('ready', () => console.log("Ready"));
client.on('disconnect', () => console.log("Disconnected"));
client.on('reconnecting', () => console.log("Reconnecting"));

client.on('message', async msg => {
    if (msg.author.bot) return undefined;
    if(!msg.content.startsWith(".")) return undefined;
    const args = msg.content.split(" ");

    if(msg.content.startsWith(".play")) {
        const voiceChannel = msg.member.voiceChannel;
        if(!voiceChannel) return msg.channel.send("Must be in voice channel to play music.");
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if(!permissions.has("CONNECT")) {
            return msg.channel.send("Cannot connect to voice chat. Make sure I have permission.");
        }
        if(!permissions.has("SPEAK")) {
            return msg.channel.send("Cannot speak in this voice channel. Make sure I have permission.");
        }

        try {
            var connection = await voiceChannel.join();
        } catch (error) {
            console.error(`Could not join the voice channel: ${error}`);
            return msg.channel.send(`Could not join the voice channel: ${error}`);
        }

        const dispatcher = connection.playStream(ytdl(args[1]))
            .on("end", () => {
                console.log("Song ended.");
                voiceChannel.leave();
            })
            .on("error", error => {
                console.error(error);
            })
        dispatcher.setVolumeLogarithmic(1 / 5);
    } else if (msg.content.startsWith(".stop")) {
        if (!msg.member.voiceChannel) return msg.channel.send("Must be in voice channel.");
        msg.member.voiceChannel.leave();
        return undefined;
    }
})