const fetch = require("node-fetch");
const Discord = require('discord.js');
const client = new Discord.Client();
const config = require("../configs/super.json");
client.login(config.discord.token);

client.on('ready', () => {
    console.log(`Connected as ${client.user.tag}`);

    // Set presence
    client.user.setPresence({ "activity": config.discord.presence });

    console.log(`Currently active in the following guilds:`);
    console.log(client.guilds.cache.map(g => `${g.id} ${g.name}`).join('\n'));

    // Renaming from SLMN BenchBot to BenchBot
    client.guilds.cache.forEach(guild => guild.me.setNickname(config.discord.name));

    // Output current setup for pings
    const guild = client.guilds.resolve(config.discord.variety.guild);
    const channel = guild.channels.resolve(config.discord.variety.channel);
    const role = guild.roles.resolve(config.discord.variety.role);
    console.log(`- Variety ping:`);
    console.log(`- Will send to channel #${channel.name} [${channel.id}]`);
    console.log(`- and ping @${role.name} [${role.id}]`);

});

client.on('guildCreate', guild => {
    console.log(`-> Joined new guild [${guild.id}] ${guild.name}`);
    guild.me.setNickname(config.discord.name)
});

client.on('message', (message) => {
    if (message.author.id !== config.discord.users.slmn) return;
    if (message.content === ".roles") {
        message.react(`💻`);
        console.log(`Roles for [${message.guild.id}] ${message.guild.name}`);
        console.log(message.guild.roles.cache.map(r => `${r.id} ${r.name}`).join('\n'));
    }
    if (message.content === ".testping") {
        sendMessage({"id":"488552","name":"Overwatch","box_art_url":"https:\/\/static-cdn.jtvnw.net\/ttv-boxart\/Overwatch-{width}x{height}.jpg"}, {thumbnail_url: "https://static-cdn.jtvnw.net/cf_vods/d2nvs31859zcd8/4d45ce31a70cf246e1e6_supertf_37873256592_1435930002/thumb/thumb0-{width}x{height}.jpg"})
    }

    if (message.content === ".ping") {
        const roleID = config.discord.variety.role;
        const role = message.guild.roles.resolve(roleID);
        if (!role) return console.log('no role.');
        let response = `${role}`;
        console.log(response);
        message.channel.send(response);
    }
});


let prevGameID;

async function getToken() {

    const params = {
        "client_id": config.twitch.client_id,
        "client_secret": config.twitch.client_secret,
        "grant_type": "client_credentials"
    };

    const data = await fetch(`https://id.twitch.tv/oauth2/token?${Object.entries(params).map(([key, val]) => `${key}=${val}`).join('&')}`, {method:"POST"})
        .then(res => res.json());

    console.log("Collected token");
    config.twitch.token = data.access_token;
}

function checkAPI() {
    fetch(`https://api.twitch.tv/helix/streams?user_login=${config.twitch.channel}`, { headers: {'Authorization': `Bearer ${config.twitch.token}`, "Client-ID": config.twitch.client_id} }).then(res => res.json()).then(streamData => {
        if (streamData.error) return console.error(streamData);
        streamData = streamData.data[0];
        if (!streamData) { prevGameID = null; console.log('x: not live'); return; }
        fetch(`https://gigabra.in/api/twitch/game.php?games=${streamData.game_id}`).then(res => res.json()).then(([gameData]) => {
            gameDiff(prevGameID, gameData, streamData);
            prevGameID = gameData.id;
        }).catch(console.error)
    }).catch(console.error);

}


function gameDiff(prevID, newGame, streamData) {
    // Overwatch, Just Chatting, Talk Shows
    const exclusions = ["488552", "509658", "417752"];



    if (prevID === null || prevID === undefined) return;
    // if (Math.random() > 0.8) { newGame.id = 20; console.log("rng change"); }
    if (prevID !== newGame.id) {
        // Do a check here for games that don't need a ping
        // ie OW / Just Chatting
        console.log(`o: now playing ${newGame.name}`);

        if (exclusions.includes(newGame.id)) {
            console.log(`i: excluded game for pings`);
        } else {
            sendMessage(newGame, streamData);
        }
    } else {
        console.log(`x: still playing ${newGame.name} 4Weird`);
    }
}

async function sendMessage(game, stream) {
    const guild = client.guilds.resolve(config.discord.variety.guild);
    const channel = guild.channels.resolve(config.discord.variety.channel);
    const role = guild.roles.resolve(config.discord.variety.role);

    // streamcrop = 1920x1080
    // gamecrop = 285x380

    await role.setMentionable(true, `Pinging role`);

    await channel.send({
        "content": `${role}: <https://twitch.tv/${config.twitch.channel}>\nsuper's switched to **${game.name}**!`,
        "embed": {
            "author": {
                "name": "supertf",
                "url": `https://twitch.tv/${config.twitch.channel}`,
                "icon_url": "https://static-cdn.jtvnw.net/jtv_user_pictures/supertf-profile_image-4a7fae211a68ae1f-70x70.jpeg"
            },
            "title": `Switched to: **${game.name}**`,
            "url": `https://twitch.tv/${config.twitch.channel}`,
            "thumbnail": {
                "url": game.box_art_url.replace('{width}x{height}', '285x380')
            },
            "image": {
                "url": stream.thumbnail_url.replace('{width}x{height}', '1280x720')
            }
        }
    });

    await role.setMentionable(false, `Pinging finished`);
}

(async function() {
    await getToken();
    checkAPI();
    setInterval(checkAPI, 30 * 1000);
})();