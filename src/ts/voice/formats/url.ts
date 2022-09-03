import { spawn } from 'child_process';
import { lookup } from 'dns';
import { URL } from 'url';

import { BaseFormat } from './baseformat';
import { VoiceFormatResponseType, VoiceFormatResponseURL } from '../managers';

export default class URLFormat extends BaseFormat {
  public regex =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
  public printName = 'URL';
  private readonly LOCAL_IPS = ['::1', '::ffff:127.0.0.1', '127.0.0.1'];

  private isUrlLocal(url: string) {
    const { hostname } = new URL(url);
    return new Promise((res, rej) => {
      lookup(hostname, (err, address) =>
        err ? rej(err) : res(this.LOCAL_IPS.indexOf(address) !== -1)
      );
    });
  }

  private createThumbnail(url: string): Promise<Buffer> {
    return new Promise((res, rej) => {
      const child = spawn('ffmpeg', [
        '-ss',
        '00:00:01.00',
        '-i',
        url,
        '-vf',
        'scale=320:240:force_original_aspect_ratio=decrease',
        '-vframes',
        '1',
        '-f',
        'mjpeg',
        '-',
      ]);

      let buffer = Buffer.alloc(0);
      child.stdout.on('data', (data) => {
        buffer = Buffer.concat([buffer, data]);
      });

      child.stdout.on('end', () => {
        res(buffer);
      });
    });
  }

  private probe(url: string): Promise<{ duration: number; isVideo: boolean }> {
    return new Promise((res, rej) => {
      const child = spawn('ffprobe', [
        '-v',
        'error',
        '-show_entries',
        'format=duration:stream=codec_type',
        '-of',
        'default=noprint_wrappers=1',
        url,
      ]);

      let buffer = Buffer.alloc(0);
      child.stdout.on('data', (data) => {
        buffer = Buffer.concat([buffer, data]);
      });

      child.stdout.on('end', () => {
        let duration: number = -1;
        let isVideo = false;
        for (const line of buffer.toString().split('\n')) {
          const [key, value] = line.split('=');
          if (key === 'duration') {
            duration = parseFloat(value);
          } else if (key === 'codec_type' && value.trim() === 'video') {
            isVideo = true;
          }
        }
        res({ duration, isVideo });
      });

      child.stderr.on('data', (data) => rej(data.toString()));
    });
  }

  public async process(matched: string) {
    if (await this.isUrlLocal(matched)) return false;

    let duration: number;
    let image: string | Buffer =
      'https://wicopee.came-in-your.mom/mNJWnlmlV3.png';
    try {
      const info = await this.probe(matched);
      duration = info.duration;
      if (info.isVideo) image = await this.createThumbnail(matched);
    } catch (err) {
      return false;
    }

    const url = new URL(matched);
    return {
      type: VoiceFormatResponseType.URL,
      url: matched,
      info: {
        title: url.pathname.split('/').pop(),
        url: matched,
        duration,
        image,
      },
    } as VoiceFormatResponseURL;
  }
}
