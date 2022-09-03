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
import Knex from 'knex';
import { Model } from 'objection';
import Sh from 'sh';

import config from '../../config.json';
import { EXTERNAL_IPC_OP_CODES } from './constants';
import { Logger } from './utils';
import { broadcastOnApplication, GuildSettingsStore } from './stores';

const knexConfig = require('../../knexfile');

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
    if (ctx.guild) {
      const settings = await GuildSettingsStore.getOrCreate(ctx.guild.id);
      if (settings && settings.prefix) return [settings.prefix];
    }
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

export class Application {
  public sh!: Sh;
  public startAt: number;
  public readonly commandClient: CatvoxCommandClient;
  public readonly clusterClient: ClusterClient;
  public readonly interactionCommandClient: CatvoxInteractionCommandClient;
  public readonly logger: Logger;

  constructor(token: string) {
    const prefix = config.prefix || '~';

    this.clusterClient = new ClusterClient(token, {
      cache: { messages: { expire: 60 * 60 * 1000 } },
      gateway: {
        presence: {
          activity: {
            type: ActivityTypes.PLAYING,
            name: `media | run ${prefix}help`,
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
        prefix,
        activateOnEdits: true,
      });
      this.commandClient
        .addMultipleIn('dist/src/ts/commands/', {
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
        .addMultipleIn('dist/src/ts/interactions/', {
          subdirectories: true,
        })
        .catch((err) => {
          this.logger.error(err);
          process.exit(1);
        });
    }

    const knex = Knex(knexConfig[process.env.NODE_ENV || 'development']);
    Model.knex(knex);

    this.startAt = Date.now();

    this.initialize();
  }

  private async initialize() {
    await this.clusterClient.run();
    await this.commandClient.run();
    await this.interactionCommandClient.run();
    broadcastOnApplication(this);

    this.logger.log('bot online!');
    this.logger.info(
      `loaded shards #(${this.clusterClient.shards
        .map((shard) => shard.shardId)
        .join(', ')})`
    );
  }
}
