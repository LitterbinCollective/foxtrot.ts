import { spawn } from 'child_process';
import {
  Command,
  CommandClient,
  Constants,
  Interaction,
  InteractionCommandClient,
} from 'detritus-client';
import { lookup } from 'dns';
import UrlPattern from 'url-pattern';

import { BaseCommandOption, BaseSlashCommand } from '@/app/interactions/base';
import { BaseCommand } from '@/app/commands/base';

import config from '@/configs/app.json';

import BaseManager from '..';
import { MediaService } from './services/baseservice';
import {
  DownloadReturnedValue,
  MediaServiceResponse,
  MediaServiceResponseMediaType,
} from './types';

const LOCAL_IPS = ['::1', '::ffff:127.0.0.1', '127.0.0.1']
export const DEFAULT_SOUND_ICON = 'https://foxtrot.litterbin.dev/sound.png';

export class URLMediaService extends MediaService {
  public noSearch = true;

  private isUrlLocal(url: string) {
    const { hostname } = new URL(url);
    return new Promise((res, rej) => {
      lookup(hostname, (err, address) =>
        err ? rej(err) : res(LOCAL_IPS.indexOf(address) !== -1)
      );
    });
  }

  private createThumbnail(url: string): Promise<Buffer> {
    return new Promise(res => {
      const args = [
        '-ss',
        '00:00:00.00',
        '-i',
        url,
        '-vf',
        'scale=320:240:force_original_aspect_ratio=decrease',
        '-vframes',
        '1',
        '-f',
        'mjpeg',
        '-',
      ];

      if (config.proxy.length !== 0) args.unshift('-http_proxy', config.proxy);

      const child = spawn('ffmpeg', args);

      let buffer = Buffer.alloc(0);
      child.stdout.on('data', data => {
        buffer = Buffer.concat([buffer, data]);
      });

      child.stdout.on('end', () => {
        res(buffer);
      });
    });
  }

  static probe(url: string): Promise<{ duration: number; isVideo: boolean }> {
    return new Promise((res, rej) => {
      const args = [
        '-v',
        'error',
        '-show_entries',
        'format=duration:stream=codec_type',
        '-of',
        'default=noprint_wrappers=1',
        url,
      ];

      if (config.proxy.length !== 0) args.unshift('-http_proxy', config.proxy);

      const child = spawn('ffprobe', args);

      let buffer = Buffer.alloc(0);
      child.stdout.on('data', data => {
        buffer = Buffer.concat([buffer, data]);
      });

      child.stdout.on('end', () => {
        let duration: number = -1;
        let isVideo = false;

        for (const line of buffer.toString().split('\n')) {
          const [key, value] = line.split('=');
          switch (key) {
            case 'duration':
              duration = parseFloat(value);
              break;
            case 'codec_type':
              switch (value.trim()) {
                case 'video':
                  isVideo = true;
                  break;
                case 'audio':
                  break;
                default:
                  return rej('not a playable format');
              }
              break;
          }
        }

        res({ duration, isVideo });
      });

      child.stderr.on('data', data => rej(data.toString()));
    });
  }

  public async download(url: string): Promise<any> {
    if (await this.isUrlLocal(url)) return false;

    let duration: number;
    let cover: string | Buffer =
      (config as any).soundIcon || DEFAULT_SOUND_ICON;
    try {
      const info = await URLMediaService.probe(url);
      duration = info.duration;
      if (info.isVideo) cover = await this.createThumbnail(url);
    } catch (err) {
      return false;
    }

    const { pathname, hostname } = new URL(url);
    return {
      information: {
        title: pathname.split('/').pop(),
        author: hostname,
        url,
        duration,
        cover,
      },
      media: {
        type: MediaServiceResponseMediaType.URL,
        url,
      },
    } as MediaServiceResponse;
  }
}

export class MediaServiceManager extends BaseManager<MediaService> {
  private lookup: Record<string, string> = {};
  private url = new URLMediaService();

  constructor() {
    super({
      create: true,
      loggerTag: 'MediaServiceManager',
      scanPath: 'mediaservices/services/',
    });

    this.formLookup();
  }

  public formLookup() {
    this.lookup = {};

    for (const service in this.processors)
      for (const host of this.processors[service].hosts)
        this.lookup[host] = service;
  }

  public async download(
    url: string | URL
  ): Promise<DownloadReturnedValue | false> {
    try {
      if (typeof url === 'string') url = new URL(url);
    } catch (err) {
      return false;
    }

    url.searchParams.delete('si');

    const domainParts = url.hostname.split('.');

    // this can break with .co.uk, etc. domains. too bad!
    const domain =
      domainParts.length === 3 ? domainParts.slice(1).join('.') : url.hostname;

    try {
      const matched = this.lookup[domain];
      if (!matched) throw new Error('nothing found');

      const service = this.processors[matched];
      url = await service.before(url);

      let matches: Record<string, string> | null = null;

      if (typeof service.patterns === 'function')
        matches = service.patterns(url);
      else {
        for (const pattern of service.patterns) {
          matches = new UrlPattern(pattern).match(url.pathname);
          if (matches) break;
        }
      }

      if (!matches) throw new Error('no matches for ' + matched);

      return await service.download(url.href, matches);
    } catch (err) {
      this.logger.debug(err);
    }

    try {
      this.logger.debug('looked up nothing for', domain, 'defaulting to url');
      return this.url.download(url.href);
    } catch (err) {}

    return false;
  }

  public addPrefixedCommands(client: CommandClient) {
    for (const name in this.processors) {
      const service = this.processors[name];
      if (service.disableSearch) continue;

      client.add({
        _class: BaseCommand,
        name: 'search ' + name,
        aliases: ['se ' + name],

        consume: true,
        label: 'query',
        required: true,

        async run(ctx: Command.Context, args: { query: string }) {
          const res = await service.findOne(args.query);
          return ctx.reply(res.information.url);
        },
      });
    }
  }

  public addSlashCommands(client: InteractionCommandClient) {
    const options: BaseCommandOption[] = [];

    for (const name in this.processors) {
      const service = this.processors[name];
      if (service.disableSearch) continue;

      const option = new BaseCommandOption({
        name,
        description: `search on ${name}`,

        options: [
          {
            name: 'query',
            description: 'search query',
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: true,
          },
        ],

        async run(
          ctx: Interaction.InteractionContext,
          args: Interaction.ParsedArgs
        ) {
          const res = await service.findOne(args.query);
          return ctx.editOrRespond(res.information.url);
        },
      });

      options.push(option);
    }

    client.add({
      _class: BaseSlashCommand,
      name: 'search',
      description: 'search media services',
      options,
    });
  }
}

export default new MediaServiceManager();
