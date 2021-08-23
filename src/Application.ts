import {
  ClusterClient,
  CommandClient,
  CommandClientOptions,
  ShardClient,
} from 'detritus-client';
import { ActivityTypes } from 'detritus-client/lib/constants';

import { Voice } from './voice';

export class CommandClientExtended extends CommandClient {
  public readonly application: Application;

  constructor(
    application: Application,
    token: string | ClusterClient | ShardClient,
    options?: CommandClientOptions
  ) {
    super(token, options);
    this.application = application;
  }
}

export class Application {
  public config: IConfig;
  public voices: Map<string, Voice> = new Map();
  public readonly commandClient: CommandClient;

  constructor(config: IConfig) {
    this.config = config;

    this.commandClient = new CommandClientExtended(this, this.config.token, {
      prefix: 'mb!',
      gateway: {
        presence: {
          activity: {
            type: ActivityTypes.PLAYING,
            name: 'sounds',
          },
        },
      },
    });
    this.commandClient.addMultipleIn('dist/commands/', {
      subdirectories: true,
    });
    this.commandClient.run().then(() => this.onCommandClientRun());
  }

  onCommandClientRun() {
    console.log('Bot online!');
  }
}
