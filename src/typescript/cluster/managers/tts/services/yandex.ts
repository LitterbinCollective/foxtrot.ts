import FFMpeg from '@cluster/utils/audio/ffmpeg';

import { BaseTTSService } from './basettsservice';
import { spawn } from 'child_process';

const VOICES = ['zahar', 'ermil', 'alyss', 'jane', 'oksana', 'omazh'];
const map: Record<string, string> = {
  '!': 'evil',
  ')': 'good'
};

export default class YandexTTSService extends BaseTTSService {
  public generate(content: string, additional: string, userId: string) {
    let emotion = 'neutral';

    const start = content.length - additional.length - 1;
    const last = content.substring(start, start + 1);
    if (last in map)
      emotion = map[last];

    const voice = VOICES[Math.abs(parseInt(userId.slice(-2)) % VOICES.length)];

    return new Promise<Buffer>(resolve => {
      const url = `https://tts.voicetech.yandex.net/tts?text=${encodeURIComponent(content)}&format=mp3&quality=hi&lang=ru_RU&speaker=${voice}&speed=1&emotion=${emotion}&platform=web&application=translate&chunked=0&mock-ranges=1`;

      const ffmpeg = spawn('ffmpeg', [
        '-i', url,
        '-analyzeduration',
        '0',
        '-loglevel',
        process.env.NODE_ENV === 'production' ? '0' : '32',
        '-filter:a',
        'speechnorm',
        '-f',
        's16le',
        '-ar',
        '48000',
        '-ac',
        '2',
        'pipe:1',
      ]);

      let pcmBuffer = Buffer.alloc(0);
      ffmpeg.stdout.on('data', chunk =>
        pcmBuffer = Buffer.concat([pcmBuffer, chunk])
      );
      ffmpeg.stdout.once('end', () =>
        resolve(pcmBuffer)
      );
    });
  }
}