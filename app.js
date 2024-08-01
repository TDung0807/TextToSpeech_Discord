const { Client, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');
const TTSService = require('./TTSService');

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

            await ttsService.handleTTS(text, voiceChannel);
        },
        '!adj': async () => {
            if (args.length < 1) return message.reply('Quên số kìa em');

            const speed = parseFloat(args[0]);
            if (speed < 0.5 || speed > 5) {
                return message.reply('Chỉnh spd từ 0.5 - 5 thôi thz ngu');
            }
            if (isNaN(speed)) return message.reply('Chỉnh speed đưa chữ ăn lz à');

            ttsService.globalSpeed = speed;
            message.reply(`Global speed adjustment set to ${speed}.`);
        },
        '!language': async()=>{
            if (args.length < 1) return message.reply('Biết gõ k:(vi, en)');
            const language = args[0];
            console.log(language)
            if (language !== 'vi' && language !== 'en') {
                return message.reply('Biết gõ k:(vi, en)');
            }
            
            ttsService.language = language;
            message.reply(`Global language adjustment set to ${language}.`);
        }
    };

    if (commandHandlers[command]) {
        await commandHandlers[command]();
    }
});

client.login(token);
