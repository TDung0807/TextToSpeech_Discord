const { Client, GatewayIntentBits } = require('discord.js');
const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');
const { token } = require('./config.json');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const { Readable } = require('stream');
const fetch = require('node-fetch'); // Ensure you have node-fetch installed

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (!message.content.startsWith('!tts') || message.author.bot) return;

    const args = message.content.slice(4).trim();
    if (!args) return message.reply('Please provide a message to convert to speech.');

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('You need to be in a voice channel to use this command.');
    const text = message.content.replace('!tts ', '');
    if (!text) return;

    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
    });

    const audioStream = await fetchTTS(text);
    if (audioStream) {
        const audioResource = createAudioResource(audioStream);
        const audioPlayer = createAudioPlayer();

        audioPlayer.play(audioResource);
        connection.subscribe(audioPlayer);
    }
});

async function fetchTTS(text) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=vi&client=tw-ob`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch TTS audio');

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return Readable.from(buffer);
}

client.login(token);
