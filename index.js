require('dotenv').config()
const Discord = require("discord.js");
const token = process.env.DISCORD_KEY;
const client = new Discord.Client({disableEveryone: true});
const superagent = require("superagent");
const YouTube = require('simple-youtube-api');
const ytdl = require("ytdl-core");
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const youtube = new YouTube(GOOGLE_API_KEY);

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
const queue = new Map();

client.on('warn', console.warn);
client.on('error', console.error);
client.on('ready', () => console.log("Ready"));
client.on('disconnect', () => console.log("Disconnected"));
client.on('reconnecting', () => console.log("Reconnecting"));

client.on('message', async msg => {
    if (msg.author.bot) return undefined;
    if(!msg.content.startsWith(".")) return undefined;
    const args = msg.content.split(" ");
    const searchString = args.slice(1).join(' ');
    const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
    console.log(searchString);
    const serverQueue = queue.get(msg.guild.id);

    if(msg.content.startsWith(".play") || msg.content.startsWith(".p")) {
        const voiceChannel = msg.member.voiceChannel;
        if(!voiceChannel) return msg.channel.send("Must be in voice channel to play music.");
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if(!permissions.has("CONNECT")) {
            return msg.channel.send("Cannot connect to voice chat. Make sure I have permission.");
        }
        if(!permissions.has("SPEAK")) {
            return msg.channel.send("Cannot speak in this voice channel. Make sure I have permission.");
        }

        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();
            for (const video of Object.values(videos)) {
                const video2 = await youtube.getVideoById(video.id);
                await handleVideo(video2, msg, voiceChannel, true);
            }
            return msg.channel.send(`Playlist: **${playlist.title}** has been added to the queue!`);
        } else {
            try {
                var video = await youtube.getVideo(url);
            } catch (error) {
                try {
                    var videos = await youtube.searchVideos(searchString, 1);
                    var video = await youtube.getVideoById(videos[0].id);
                } catch (err) {
                    console.error(err);
                    return msg.channel.send("Could not obtain any search results.");
                }
            }
        }

    }else if(msg.content.startsWith(`.skip`) || msg.content.startsWith(".next")) {
        if (!msg.member.voiceChannel) return msg.channel.send("Must be in voice channel.");
        if(!serverQueue) return msg.channel.send("There is nothing to skip.");
        serverQueue.connection.dispatcher.end("Skip command has been used.");
        return undefined;
    } else if (msg.content.startsWith(".stop")) {
        if (!msg.member.voiceChannel) return msg.channel.send("Must be in voice channel.");
        if(!serverQueue) return msg.channel.send("There is nothing playing to stop.");
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end("Stop command has been used.");
        return undefined; 
    } else if (msg.content.startsWith(`.volume`) || msg.content.startsWith(".vol") || msg.content.startsWith(".v")) {
        if (!msg.member.voiceChannel) return msg.channel.send("Must be in voice channel.");
        if(!serverQueue) return msg.channel.send("There is nothing playing.");
        if(!args[1]) return msg.channel.send(`Current Volume: **${serverQueue.volume}**`);
        serverQueue.volume = args[1];
        serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5);
        return msg.channel.send(`Volume set to: **${args[1]}**`);
    } else if (msg.content.startsWith(`.np`)) {
        if(!serverQueue) return msg.channel.send("There is nothing playing.");
        return msg.channel.send(`Track: **${serverQueue.songs[0].title}**`);
    } else if (msg.content.startsWith(`.queue`) || msg.content.startsWith(".q")) {
        if(!serverQueue) return msg.channel.send("There is nothing playing.");
        if (!msg.member.voiceChannel) return msg.channel.send("Must be in voice channel.");
        if(msg.member.voiceChannel) return msg.channel.send(`
__**Song Queue**__
${serverQueue.songs.map(song => `**-** ${song.title}`).join('\n')}

**Track:** ${serverQueue.songs[0].title}
        `);
    } else if (msg.content.startsWith(`.pause`) || msg.content.startsWith(".pp")) {
        if(serverQueue && serverQueue.playing) {
            serverQueue.playing = false;
            serverQueue.connection.dispatcher.pause();
            return msg.channel.send(`**Paused**`);
        }
        return msg.channel.send("There is nothing playing.");
    } else if (msg.content.startsWith(`.resume`) || msg.content.startsWith(".r")) {
        if(serverQueue && !serverQueue.playing) {
            serverQueue.playing = true;
            serverQueue.connection.dispatcher.resume();
            return msg.channel.send(`**Resumed**`)
    }
    return msg.channel.send(`There is nothing playing.`);
}
    return undefined;
});

async function handleVideo(video, msg, voiceChannel, playlist = false) {
    const serverQueue = queue.get(msg.guild.id);
    console.log(video);
        const song = {
            id: video.id,
            title: Util.escapeMarkDown(video.title),
            url: `https://www.youtube.com/watch?v=${video.id}`
        };
        if(!serverQueue) {
            const queueConstruct = {
                textChannel: msg.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 1,
                playing: true
            };
            queue.set(msg.guild.id, queueConstruct);

            queueConstruct.songs.push(song);
            
            try {
                var connection = await voiceChannel.join();
                queueConstruct.connection = connection;
                play(msg.guild, queueConstruct.songs[0]);
            } catch (error) {
                console.error(`Could not join the voice channel: ${error}`);
                queue.delete(msg.guild.id);
                return msg.channel.send(`Could not join the voice channel: ${error}`);
            }
        } else {
            serverQueue.songs.push(song);
            if(playlist) return undefined;
            else return msg.channel.send(`**${song.title}** has been added to the queue.`)
        }
    return undefined;
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
        .on("end", reason => {
            if (reason === 'Stream is not generating quickly enough') console.log('Song ended.');
            else console.log(reason);
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

    serverQueue.textChannel.send(`Now Playing: **${song.title}**`);
}