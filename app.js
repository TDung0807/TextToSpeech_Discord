const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { token } = require('./config.json');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const fetch = require('node-fetch'); // Ensure you have node-fetch installed
const ffmpeg = require('fluent-ffmpeg');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
});

let globalSpeed = 1.0; // Default speed

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const [command, ...args] = message.content.split(' ');

    const commandHandlers = {
        '!tts': async () => {
            const text = args.join(' ');
            if (!text) return message.reply('Đã câm con cụt');

            const voiceChannel = message.member.voice.channel;
            if (!voiceChannel) return message.reply('Đã câm còn bị tự kỉ');

            await handleTTS(text, voiceChannel);
        },
        '!adj': async () => {
            if (args.length < 1) return message.reply('Quên số kìa em');

            const speed = parseFloat(args[0]);
            if (speed < 0.5 || speed > 5) {
                return message.reply('Chỉnh spd từ 0.5 - 5 thôi thz ngu');
            }
            if (isNaN(speed)) return message.reply('Chỉnh speed đưa chữ ăn lz à');

            globalSpeed = speed;
            message.reply(`Global speed adjustment set to ${speed}.`);
        }
    };

    if (commandHandlers[command]) {
        await commandHandlers[command]();
    }
});

async function handleTTS(text, voiceChannel) {
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    const audioFilePath = await fetchTTS(text);
    const outputFilePath = path.join(__dirname, 'tts_fast.mp3');
    await adjustSpeed(audioFilePath, outputFilePath, globalSpeed);

    console.log('Audio processed and saved at', outputFilePath);

    playAudio(outputFilePath, connection, audioFilePath);
}

async function fetchTTS(text) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=vi&client=tw-ob`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch TTS audio');

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const filePath = path.join(__dirname, 'tts.mp3');
    fs.writeFileSync(filePath, buffer);

    return filePath;
}

function adjustSpeed(inputPath, outputPath, speed) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .audioFilters(`atempo=${speed}`)
            .on('end', () => resolve(outputPath))
            .on('error', (err) => reject(err))
            .save(outputPath);
    });
}

function playAudio(filePath, connection, originalFilePath) {
    const audioResource = createAudioResource(filePath);
    const audioPlayer = createAudioPlayer();

    audioPlayer.play(audioResource);
    connection.subscribe(audioPlayer);

    audioPlayer.on(AudioPlayerStatus.Idle, () => {
        fs.unlinkSync(filePath); // Clean up the temporary file
        if (originalFilePath) fs.unlinkSync(originalFilePath); // Clean up the original TTS file if provided
    });
}

client.login(token);
