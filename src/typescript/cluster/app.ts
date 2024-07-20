import {
  Constants as DetritusConstants,
  ClusterClient,
  CommandClient,
  InteractionCommandClient,
} from 'detritus-client';
import Knex from 'knex';
import { Model } from 'objection';

import { Logger } from '@cluster/utils';
import { GuildSettingsStore, applicationCreated } from '@cluster/stores';
import mediaservice from '@cluster/managers/mediaservices';

import '@cluster/managers/special';
import config from '@/managers/config';

export default class Application {
  public startAt: number;
  public readonly commandClient: CommandClient;
  public readonly clusterClient: ClusterClient;
  public readonly interactionCommandClient: InteractionCommandClient;
  public readonly logger: Logger;

  constructor() {
    const { token, prefix } = config.app;

    this.clusterClient = new ClusterClient(token, {
      cache: { messages: { expire: 60 * 60 * 1000 } },
      gateway: {
        presence: {
          activity: {
            type: DetritusConstants.ActivityTypes.PLAYING,
            name: `media | run ${prefix}help`,
          },
        },
      },
    });

    let processTitle = `Shard ${this.clusterClient.shardStart} - ${this.clusterClient.shardEnd}`;
    let tag = 'Shard';
    if (this.clusterClient.manager) {
      processTitle =
        `Cluster [${this.clusterClient.clusterId}] - ` + processTitle;
      tag = `Cluster [${this.clusterClient.clusterId}]`;
    }

    process.title = processTitle;
    this.logger = new Logger(tag);

    {
      this.commandClient = new CommandClient(this.clusterClient, {
        prefix,
        activateOnEdits: true,
        onPrefixCheck: async (ctx) => {
          if (ctx.guildId) {
            const settings = await GuildSettingsStore.getOrCreate(ctx.guildId);
            if (settings.prefix)
              return [settings.prefix];
          }
          return this.commandClient.prefixes.custom;
        }
      });
      this.commandClient
        .addMultipleIn('commands/', {
          subdirectories: true,
        })
        .catch(err => {
          this.logger.error(err);
          process.exit(1);
        });

      mediaservice.addPrefixedCommands(this.commandClient);
    }

    {
      this.interactionCommandClient = new InteractionCommandClient(
        this.clusterClient
      );
      this.interactionCommandClient
        .addMultipleIn('interactions/', {
          subdirectories: true,
        })
        .catch(err => {
          this.logger.error(err);
          process.exit(1);
        });

      mediaservice.addSlashCommands(this.interactionCommandClient);
    }

    const knexConfig = config.knex[process.env.NODE_ENV || 'development']
    if (!knexConfig)
      throw new Error('no knex config for specified NODE_ENV or "development"');

    const knex = Knex(knexConfig);
    Model.knex(knex);

    this.startAt = Date.now();

    applicationCreated(this);
    this.initialize();
  }

  private async initialize() {
    await this.clusterClient.run();
    await this.commandClient.run();
    await this.interactionCommandClient.run();

    this.logger.log('bot online!');
    this.logger.info(
      `loaded shards #(${this.clusterClient.shards
        .map(shard => shard.shardId)
        .join(', ')})`
    );
  }
}
