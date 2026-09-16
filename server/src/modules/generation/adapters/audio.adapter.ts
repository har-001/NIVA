// ============================================
// NIVA — Speech & Audio Synthesis Adapter
// ============================================

import path from 'path';
import fs from 'fs';
import https from 'https';
import { AudioGenOptions, AudioGenResult } from '../types';
import { logger } from '../../../utils/logger';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'generated', 'audio');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export class AudioAdapter {
  /**
   * Generate a valid PCM WAV audio buffer as fallback
   */
  private generateWavBuffer(durationSeconds: number = 2): Buffer {
    const sampleRate = 44100;
    const numChannels = 1;
    const bytesPerSample = 2; // 16-bit
    const numSamples = sampleRate * durationSeconds;
    const dataSize = numSamples * numChannels * bytesPerSample;

    const buffer = Buffer.alloc(44 + dataSize);

    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);

    // fmt subchunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // subchunk1size (16 for PCM)
    buffer.writeUInt16LE(1, 20); // audioFormat (1 for PCM)
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28); // byteRate
    buffer.writeUInt16LE(numChannels * bytesPerSample, 32); // blockAlign
    buffer.writeUInt16LE(bytesPerSample * 8, 34); // bitsPerSample

    // data subchunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    // Write subtle harmonic audio chime
    const freq = 440; // A4
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-2.5 * t);
      const sample = Math.sin(2 * Math.PI * freq * t) * decay * 0.4;
      const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
      buffer.writeInt16LE(intSample, 44 + i * 2);
    }

    return buffer;
  }

  private fetchOnlineTtsAudio(text: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cleanText = encodeURIComponent(text.slice(0, 150));
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${cleanText}`;

      const req = https.get(
        url,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            Referer: 'https://translate.google.com/',
          },
        },
        (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`TTS service returned status ${res.statusCode}`));
            return;
          }

          const fileStream = fs.createWriteStream(destPath);
          res.pipe(fileStream);

          fileStream.on('finish', () => {
            fileStream.close();
            resolve();
          });
        }
      );

      req.on('error', reject);
      req.setTimeout(8000, () => {
        req.destroy();
        reject(new Error('Audio synthesis request timed out'));
      });
    });
  }

  async generate(options: AudioGenOptions): Promise<AudioGenResult> {
    const format = options.format || 'mp3';
    const filename = `niva-audio-${Date.now()}.${format}`;
    const destPath = path.join(UPLOAD_DIR, filename);

    logger.info(`Synthesizing speech audio for: "${options.text.slice(0, 40)}..."`);

    try {
      await this.fetchOnlineTtsAudio(options.text, destPath);
      logger.info(`Audio generated successfully: ${filename}`);
      return {
        audioUrl: `/generated/audio/${filename}`,
        localPath: destPath,
        durationSeconds: 3,
      };
    } catch (err: any) {
      logger.warn(`Online audio synthesis fallback (${err.message}). Generating localized WAV chime.`);
      const wavFilename = `niva-audio-${Date.now()}.wav`;
      const wavPath = path.join(UPLOAD_DIR, wavFilename);
      const wavBuffer = this.generateWavBuffer(2);
      fs.writeFileSync(wavPath, wavBuffer);

      return {
        audioUrl: `/generated/audio/${wavFilename}`,
        localPath: wavPath,
        durationSeconds: 2,
      };
    }
  }
}

export const audioAdapter = new AudioAdapter();
