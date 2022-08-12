import {
  ClusterClient,
  CommandClient,
  CommandClientOptions,
  CommandClientPrefixes,
  InteractionCommandClient,
  InteractionCommandClientOptions,
  ShardClient,
} from 'detritus-client';
import { ActivityTypes } from 'detritus-client/lib/constants';
import { Context } from 'detritus-client/lib/command';
import {
  ChannelGuildVoice,
  ChannelTextType,
} from 'detritus-client/lib/structures';
import fs from 'fs';
import { PackageJson } from 'type-fest';
import Sh from 'sh';
import { Sequelize } from 'sequelize';

import { EXTERNAL_IPC_OP_CODES, FILENAME_REGEX } from './constants';
import NewVoice from './voice/new';
import Logger from './logger';

export class CatvoxCommandClient extends CommandClient {
  public readonly application: Application;

  constructor(
    application: Application,
    token: string | ClusterClient | ShardClient,
    options?: CommandClientOptions
  ) {
    super(token, options);
    this.application = application;
  }

  public async onPrefixCheck(ctx: Context): Promise<CommandClientPrefixes> {
    const settings: any =
      await this.application.sequelize.models.settings.findOne({
        where: { serverId: ctx.guildId },
      });
    if (settings && settings.prefix) return [settings.prefix];
    return this.prefixes.custom;
  }
}

export class CatvoxInteractionCommandClient extends InteractionCommandClient {
  public readonly application: Application;

  constructor(
    application: Application,
    token: string | ClusterClient | ShardClient,
    options?: InteractionCommandClientOptions
  ) {
    super(token, options);
    this.application = application;
  }
}

export class VoiceStore {
  private cycleTimeout: NodeJS.Timeout | null = null;
  private nextCycle: number = 0;
  private readonly _map: Map<string, NewVoice> = new Map();
  private readonly application: Application;
  private readonly OPUS_FRAME_LENGTH = 20;

  constructor(application: Application) {
    this.application = application;
  }

  private cycleOverVoices(iterator: IterableIterator<NewVoice>) {
    const next = iterator.next().value;

    if (!next) {
      if (this.nextCycle !== -1) {
        this.cycleTimeout = setTimeout(() => {
          this.nextCycle += this.OPUS_FRAME_LENGTH;
          this.cycleOverVoices(this._map.values());
        }, this.nextCycle - Date.now());
      }
      return;
    }

    next.update();
    setImmediate(() => this.cycleOverVoices(iterator));
  }

  private initializeCycle() {
    this.nextCycle = Date.now();
    setImmediate(() => this.cycleOverVoices(this._map.values()));
  }

  private killCycle() {
    if (this.cycleTimeout) {
      clearTimeout(this.cycleTimeout);
      this.cycleTimeout = null;
    }
    this.nextCycle = -1;
  }

  public create(
    voiceChannel: ChannelGuildVoice,
    textChannel: ChannelTextType
  ): NewVoice {
    if (voiceChannel.guildId !== textChannel.guildId)
      throw new Error(
        'The specified text channel is not in the same ' +
          'guild as the specified voice channel'
      );

    if (this.has(voiceChannel.guildId))
      throw new Error(
        'Already connected to a voice channel on this ' + 'server'
      );

    const voice = new NewVoice(this.application, voiceChannel, textChannel);
    this.set(voiceChannel.guildId, voice);
    return voice;
  }

  public get(guildId: string): NewVoice | undefined {
    return this._map.get(guildId);
  }

  public set(guildId: string, voice: NewVoice): void {
    this._map.set(guildId, voice);
    if (this._map.size === 1) this.initializeCycle();
  }

  public delete(guildId: string): void {
    this._map.delete(guildId);
    if (this._map.size === 0) this.killCycle();
  }

  public has(guildId: string): boolean {
    return this._map.has(guildId);
  }

  public clear(): void {
    this._map.forEach((x) => x.kill());
    this._map.clear();
    this.killCycle();
  }
}

export class Application {
  public config: IConfig;
  public packageJson: PackageJson;
  public sh!: Sh;
  public soundeffects: Record<string, string[]> = {};
  public startAt: number;
  public newvoices: VoiceStore = new VoiceStore(this);
  public readonly commandClient: CatvoxCommandClient;
  public readonly clusterClient: ClusterClient;
  public readonly interactionCommandClient: CatvoxInteractionCommandClient;
  public readonly logger: Logger;
  public readonly sequelize: Sequelize;

  constructor(token: string, config: IConfig, packageJson: PackageJson) {
    this.config = config;
    this.packageJson = packageJson;

    this.clusterClient = new ClusterClient(token, {
      cache: { messages: { expire: 60 * 60 * 1000 } },
      gateway: {
        presence: {
          activity: {
            type: ActivityTypes.PLAYING,
            name: 'sounds / new voice is here, some bugs may occur',
          },
        },
      },
    });

    const defaultTitle = `Shard ${this.clusterClient.shardStart} - ${this.clusterClient.shardEnd}`;
    if (this.clusterClient.manager) {
      this.clusterClient.manager.on(
        'ipc',
        (message: { op: number; data: any }) => {
          if (message.op === EXTERNAL_IPC_OP_CODES.SHARE_SHAT) {
            this.logger.info('received shat data from manager');
            this.sh = new Sh(message.data);
          }
        }
      );

      process.title = `Cluster [${this.clusterClient.clusterId}] - ${defaultTitle}`;
      this.logger = new Logger(`Cluster [${this.clusterClient.clusterId}]`);
    } else {
      process.title = defaultTitle;
      this.logger = new Logger('Shard');
    }

    {
      this.commandClient = new CatvoxCommandClient(this, this.clusterClient, {
        prefix: this.config.prefix || '~',
        activateOnEdits: true,
      });
      this.commandClient
        .addMultipleIn('dist/commands/', {
          subdirectories: true,
        })
        .catch((err) => {
          this.logger.error(err);
          process.exit(1);
        });
    }

    {
      this.interactionCommandClient = new CatvoxInteractionCommandClient(
        this,
        this.clusterClient
      );
      this.interactionCommandClient
        .addMultipleIn('dist/interactions/', {
          subdirectories: true,
        })
        .catch((err) => {
          this.logger.error(err);
          process.exit(1);
        });
    }

    this.sequelize = new Sequelize(this.config.databaseDSN, {
      logging: false,
    });
    for (const storeFileName of fs.readdirSync('dist/models/')) {
      const fileName = storeFileName.replace(FILENAME_REGEX, '');
      const { name, attributes } = require('./models/' + fileName);
      this.sequelize.define(name, attributes);
    }

    this.startAt = Date.now();

    this.initialize();
  }

  private async initialize() {
    await this.sequelize.sync();
    await this.clusterClient.run();
    await this.commandClient.run();
    await this.interactionCommandClient.run();

    this.logger.log('bot online!');
    this.logger.info(
      `loaded shards #(${this.clusterClient.shards
        .map((shard) => shard.shardId)
        .join(', ')})`
    );
  }

  // Source: https://github.com/Metastruct/Chatsounds-X/blob/master/app/src/ChatsoundsFetcher.ts
}
