import axios from 'axios'
import {
  ClusterClient,
  CommandClient,
  CommandClientOptions,
  ShardClient
} from 'detritus-client'
import { ActivityTypes, ClientEvents } from 'detritus-client/lib/constants'
import Matcher from 'did-you-mean';
import fs from 'fs';
import { decodeArrayStream } from '@msgpack/msgpack'
import * as Sentry from '@sentry/node'
import { PackageJson } from 'type-fest'

import { Voice } from './voice'

export class CommandClientExtended extends CommandClient {
  public readonly application: Application

  constructor (
    application: Application,
    token: string | ClusterClient | ShardClient,
    options?: CommandClientOptions
  ) {
    super(token, options)
    this.application = application
  }
}

export class Application {
  public config: IConfig
  public pkg: PackageJson
  public startAt: number;
  public voices: Map<string, Voice> = new Map()
  public readonly commandClient: CommandClient
  public soundeffects: Record < string, string[] > = {}
  public soundeffectsMatcher: Matcher;

  constructor (config: IConfig, pkg: PackageJson) {
    this.config = config
    this.pkg = pkg

    this.commandClient = new CommandClientExtended(this, this.config.token, {
      prefix: 'mb!',
      useClusterClient: true,
      gateway: {
        presence: {
          activity: {
            type: ActivityTypes.PLAYING,
            name: 'sounds / WIP, report issues with mb!issue'
          }
        }
      }
    })
    this.commandClient.addMultipleIn('dist/commands/', {
      subdirectories: true
    })
    this.startAt = Date.now()

    Sentry.init({
      dsn: this.config.sentryDSN
    })

    const client = this.commandClient.client as ClusterClient
    client.on(
      ClientEvents.WARN,
      ({ error }) =>
        Sentry.captureException(error, {
          tags: { loc: 'root' }
        })
    )

    this.initialize();
  }

  private async initialize() {
    await this.fetchSoundeffects();
    await this.commandClient.run();
    console.log('Bot online!');
  }

  // Source: https://github.com/Metastruct/Chatsounds-X/blob/master/app/src/ChatsoundsFetcher.ts
  private async sfxBuildFromGitHub(repo: string, usesMsgPack: boolean, base?: string) {
    if (!base) base = 'sounds/chatsounds'

    const baseUrl = `https://raw.githubusercontent.com/${repo}/master/${base}/`;
    const sounds: Array<Array<string>> = [];

    if (usesMsgPack) {
      const resp = await axios.get(baseUrl + 'list.msgpack', { responseType: 'stream' });
      const generator: any = decodeArrayStream(resp.data);
      for await (const sound of generator)
        sounds.push(sound);
    } else {
      const responseFromGh = await axios.get(`https://api.github.com/repos/${repo}/git/trees/master?recursive=1`);
      const body: string = JSON.stringify(responseFromGh.data);
      let i: number = 0;
      for (const match of body.matchAll(/"path":\s*"([\w\/\s\.]+)"(?:\n|,|})/g)) {
        let path: string = match[1];
        if (!path || path.length === 0) continue;
        if (!path.startsWith(base) || !path.endsWith('.ogg')) continue;

        path = path.substring(base.length + 1);
        const chunks: Array<string> = path.split('/');
        const realm: string = chunks[0];
        let trigger: string = chunks[1];

        if (!chunks[2]) {
          trigger = trigger.substring(0, trigger.length - '.ogg'.length);
        }

        sounds[i] = [realm, trigger, path];

        if (trigger.startsWith('-')) {
          sounds[i][1] = sounds[i][1].substring(1);
          sounds[i][3] = `${realm}/${trigger}.txt`;
        }

        i++;
      }
    }

    for (const [ _realm, name, file ] of sounds) {
      if (!this.soundeffects[name])
        this.soundeffects[name] = [];
      this.soundeffects[name].push(baseUrl + file);
    }
  }

  private async fetchSoundeffects() {
    const exists = fs.existsSync('.shat');
    const stat = exists && fs.statSync('.shat');
    if (exists && (Date.now() - stat.mtimeMs) <= 24 * 60 * 60 * 1000) {
      this.soundeffects = JSON.parse(fs.readFileSync('.shat').toString());
    } else {
      console.log('No shat file or modification lifetime expired! Fetching...');

      const lists = {
        'PAC3-Server/chatsounds-valve-games': {
          bases: [ 'csgo', 'css', 'ep1', 'ep2', 'hl1', 'hl2', 'l4d', 'l4d2', 'portal', 'tf2' ],
          useMsgPack: true
        },
        'Metastruct/garrysmod-chatsounds': {
          bases: [ 'sound/chatsounds/autoadd' ],
          useMsgPack: false
        },
        'PAC3-Server/chatsounds': {
          bases: false,
          useMsgPack: false
        }
      };

      let i = 0;
      console.log(`Loading soundeffects... [0/${Object.entries(lists).length}]`);
      try {
        for (const repo in lists) {
          i++;
          const cfg = lists[repo];
          if (cfg.bases)
            for (const base of cfg.bases)
              await this.sfxBuildFromGitHub(repo, cfg.usesMsgPack, base)
          else
            await this.sfxBuildFromGitHub(repo, cfg.usesMsgPack);
          console.log(`Loading soundeffects... [${i}/${Object.entries(lists).length}]`);
        }

        console.log('Done! Writing...');
        fs.writeFileSync('.shat', JSON.stringify(this.soundeffects));
      } catch (err) {
        console.log(`Something went wrong while loading soundeffects! Halting loading... [${i}/${Object.entries(lists).length}]`);

        if (exists) {
          console.log('The file does exist, using it instead...');
          this.soundeffects = JSON.parse(fs.readFileSync('.shat').toString());
        }
      }
    }

    this.soundeffectsMatcher = new Matcher(Object.keys(this.soundeffects))
  }
}
