const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch'); // Ensure you have node-fetch installed
const ffmpeg = require('fluent-ffmpeg');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');

class TTSService {
    constructor(globalSpeed = 1.2,language = 'vi') {
        this.globalSpeed = globalSpeed;
        this.language = language;
    }

    async handleTTS(text, voiceChannel) {
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        const audioFilePath = await this.fetchTTS(text,this.language);
        const outputFilePath = path.join(__dirname, 'tts_fast.mp3');
        await this.adjustSpeed(audioFilePath, outputFilePath, this.globalSpeed);

        console.log('Audio processed and saved at', outputFilePath);

        this.playAudio(outputFilePath, connection, audioFilePath);
    }

    async fetchTTS(text,language) {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${encodeURIComponent(language)}&client=tw-ob`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch TTS audio');

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const filePath = path.join(__dirname, 'tts.mp3');
        fs.writeFileSync(filePath, buffer);

        return filePath;
    }

    adjustSpeed(inputPath, outputPath, speed) {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .audioFilters(`atempo=${speed}`)
                .on('end', () => resolve(outputPath))
                .on('error', (err) => reject(err))
                .save(outputPath);
        });
    }

    playAudio(filePath, connection, originalFilePath) {
        const audioResource = createAudioResource(filePath);
        const audioPlayer = createAudioPlayer();

        audioPlayer.play(audioResource);
        connection.subscribe(audioPlayer);

        audioPlayer.on(AudioPlayerStatus.Idle, () => {
            fs.unlinkSync(filePath); // Clean up the temporary file
            if (originalFilePath) fs.unlinkSync(originalFilePath); // Clean up the original TTS file if provided
        });
    }
}

module.exports = TTSService;
