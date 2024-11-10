const { Client, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');
const TTSService = require('./TTSService');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
});

let globalSpeed = 1.0; // Default speed
const ttsService = new TTSService(globalSpeed);

const textQueue = [];
const MAX_QUEUE_SIZE = 5;
const MAX_TEXT_LENGTH = 200; // Maximum length for each text

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const [command, ...args] = message.content.split(' ');

    const commandHandlers = {
        '!tts': async () => {
            let text = args.join(' ');
            if (!text) return message.reply('Đã câm con cụt');

            if (text.length > MAX_TEXT_LENGTH) {
                return message.reply(`ÉO NGẮN GỌN ĐƯỢC À ?`);
            }

            const voiceChannel = message.member.voice.channel;
            if (!voiceChannel) return message.reply('Đã câm còn bị tự kỉ');

            if (textQueue.length >= MAX_QUEUE_SIZE) {
                console.log('Đcm nói ít thôi');
                return message.reply('Đcm nói ít thôi');
            }

            textQueue.push({ text, voiceChannel });
            processQueue();
        },
        '!adj': async () => {
            if (args.length < 1) return message.reply('Quên số kìa em');

            const speed = parseFloat(args[0]);
            if (isNaN(speed)) return message.reply('Chỉnh speed đưa chữ ăn lz à');
            if (speed < 0.5 || speed > 5) {
                return message.reply('Chỉnh spd từ 0.5 - 5 thôi thz ngu');
            }

            ttsService.globalSpeed = speed;
            message.reply(`Global speed adjustment set to ${speed}.`);
        },
        '!language': async () => {
            if (args.length < 1) return message.reply('Biết gõ k:(vi, en)');

            const language = args[0];
            if (!['vi', 'en', 'ja'].includes(language)) {
                return message.reply('Biết gõ k:(vi, en, ja)');
            }

            ttsService.language = language;
            message.reply(`Global language adjustment set to ${language}.`);
        },
        '!stk': async () => {
            message.reply("Nhớ kĩ này, 0372406980 MB BANK");
        },
        '!help': async () => {
            const helpMessage = `
            !tts <text> - Câm con cụt
            !adj <speed> - Chính speed
            !language <language> - Chính ngôn ngữ
            !stk - Stk
            `;
            message.reply(helpMessage);
        },
        '!exit': async () => {
            message.reply('Goodbye!');
            process.exit(0);
        },
        '!qr': async () => {
            const imagePath = path.join(__dirname, 'images', 'qr.jpg'); 
            try {
                await message.reply({
                    files: [imagePath]
                });
                console.log('Image sent!');
            } catch (error) {
                console.error('Error sending image:', error);
            }
        }
    };

    if (commandHandlers[command]) {
        await commandHandlers[command]();
    }
});

async function processQueue() {
    if (textQueue.length === 0 || ttsService.isSpeaking) return;

    const { text, voiceChannel } = textQueue.shift();
    ttsService.isSpeaking = true;

    try {
        await ttsService.handleTTS(text, voiceChannel);
    } finally {
        ttsService.isSpeaking = false;
        if (textQueue.length > 0) processQueue();
    }
}

client.login(token);
