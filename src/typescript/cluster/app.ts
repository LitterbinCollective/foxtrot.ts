import {
  Constants as DetritusConstants,
  ClusterClient,
  CommandClient,
  InteractionCommandClient,
} from 'detritus-client';

import { Constants, Logger } from '@cluster/utils';
import { applicationCreated } from '@cluster/stores';
import mediaservice from '@cluster/managers/mediaservices';

import config from '@/managers/config';
import { getOrCreateSettings } from '@/db/queries';
import com, { ClusterServerCommunicationWrapper } from '@/com';

import '@cluster/managers/special';
import '@cluster/managers/activities';

type Emojis = {
  [K in Extract<keyof typeof Constants.EMOJIS, string>]?: string;
}

export default class Application {
  public startAt: number;
  public readonly commandClient: CommandClient;
  public readonly clusterClient: ClusterClient;
  public readonly interactionCommandClient: InteractionCommandClient;
  private emojis: Emojis = {};

  constructor() {
    const { token, prefix } = config.app;

    this.clusterClient = new ClusterClient(token, {
      cache: {
        applicationCommandPermissions: { enabled: true },
        messages: { expire: 60 * 60 * 1000 }
      },
      gateway: {
        presence: {
          activity: {
            type: DetritusConstants.ActivityTypes.PLAYING,
            name: `media | run ${prefix}help`,
          },
        },
        intents: [
          DetritusConstants.GatewayIntents.GUILDS,
          DetritusConstants.GatewayIntents.GUILD_MESSAGES,
          DetritusConstants.GatewayIntents.GUILD_BANS,
          DetritusConstants.GatewayIntents.GUILD_INTEGRATIONS,
          DetritusConstants.GatewayIntents.GUILD_WEBHOOKS,
          DetritusConstants.GatewayIntents.GUILD_EMOJIS,
          DetritusConstants.GatewayIntents.DIRECT_MESSAGES,
          DetritusConstants.GatewayIntents.DIRECT_MESSAGE_REACTIONS,
          DetritusConstants.GatewayIntents.DIRECT_MESSAGE_TYPING,
          DetritusConstants.GatewayIntents.GUILD_SCHEDULED_EVENTS,
          DetritusConstants.GatewayIntents.AUTO_MODERATION_CONFIGURATION,
          DetritusConstants.GatewayIntents.AUTO_MODERATION_EXECUTION,
          DetritusConstants.GatewayIntents.GUILD_MESSAGE_POLLS,
          DetritusConstants.GatewayIntents.DIRECT_MESSAGE_POLLS,
          DetritusConstants.GatewayIntents.GUILD_MESSAGE_TYPING,
          DetritusConstants.GatewayIntents.GUILD_MESSAGE_REACTIONS,
          DetritusConstants.GatewayIntents.GUILD_VOICE_STATES,
          DetritusConstants.GatewayIntents.MESSAGE_CONTENT
        ],
      },
    });

    const server = new ClusterServerCommunicationWrapper(this.clusterClient);
    com.addServer(server);

    let processTitle = `Shard ${this.clusterClient.shardStart} - ${this.clusterClient.shardEnd}`;
    if (this.clusterClient.manager) {
      processTitle =
        `Cluster [${this.clusterClient.clusterId}] - ` + processTitle;
    }

    process.title = processTitle;

    {
      this.commandClient = new CommandClient(this.clusterClient, {
        prefix,
        activateOnEdits: true,
        onPrefixCheck: async (ctx) => {
          if (ctx.guildId) {
            const settings = await getOrCreateSettings(ctx.guildId);
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
        .catch(err =>
          Logger.error(err)
        );

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
        .catch(err =>
          Logger.error(err)
        );

      mediaservice.addSlashCommands(this.interactionCommandClient);
    }

    this.startAt = Date.now();

    applicationCreated(this);
    this.initialize();
  }

  public emoji(emoji: keyof typeof this.emojis) {
    return this.emojis[emoji] || Constants.EMOJIS[emoji];
  }

  private async getEmojis() {
    const shard = this.clusterClient.shards.first();
    if (!shard) return;

    const { applicationEmojis } = shard;
    await applicationEmojis.fill();

    for (const key in Constants.EMOJIS) {
      const emoji = applicationEmojis.find(x => x.name === key.toLowerCase());
      if (!emoji) continue;

      this.emojis[key as keyof typeof this.emojis] = emoji.format;
    }
  }

  private async initialize() {
    await this.clusterClient.run();
    await this.getEmojis();

    await Promise.all([
      this.commandClient.run(),
      this.interactionCommandClient.run(),
    ]);

    Logger.log('bot online!');
    Logger.info(
      `loaded shards #(${this.clusterClient.shards
        .map(shard => shard.shardId)
        .join(', ')})`
    );
  }
}
