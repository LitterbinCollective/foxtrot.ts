import {
  Constants as DetritusConstants,
  ClusterClient,
  CommandClient,
  InteractionCommandClient,
} from 'detritus-client';
import Knex from 'knex';
import { Model } from 'objection';

import { Constants, Logger } from '@/modules/utils';
import { applicationCreated } from '@/modules/stores';

const knexConfig = require('@/knexfile');

export class Application {
  public startAt: number;
  public readonly commandClient: CommandClient;
  public readonly clusterClient: ClusterClient;
  public readonly interactionCommandClient: InteractionCommandClient;
  public readonly logger: Logger;

  constructor(token: string, prefix: string = '~') {
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
      processTitle = `Cluster [${this.clusterClient.clusterId}] - ` + processTitle;
      tag = `Cluster [${this.clusterClient.clusterId}]`;
    }

    process.title = processTitle;
    this.logger = new Logger(tag);

    {
      this.commandClient = new CommandClient(this.clusterClient, {
        prefix,
        activateOnEdits: true,
      });
      this.commandClient
        .addMultipleIn('app/commands/', {
          subdirectories: true,
        })
        .catch(err => {
          this.logger.error(err);
          process.exit(1);
        });
    }

    {
      this.interactionCommandClient = new InteractionCommandClient(this.clusterClient);
      this.interactionCommandClient
        .addMultipleIn('app/interactions/', {
          subdirectories: true,
        })
        .catch(err => {
          this.logger.error(err);
          process.exit(1);
        });
    }

    const knex = Knex(knexConfig[process.env.NODE_ENV || 'development']);
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