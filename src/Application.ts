import {
  ClusterClient,
  CommandClient,
  CommandClientOptions,
  ShardClient
} from 'detritus-client'
import { ActivityTypes, ClientEvents } from 'detritus-client/lib/constants'
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
  public voices: Map<string, Voice> = new Map()
  public readonly commandClient: CommandClient

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
            name: 'sounds'
          }
        }
      }
    })
    this.commandClient.addMultipleIn('dist/commands/', {
      subdirectories: true
    })
    this.commandClient.run().then(() => this.onCommandClientRun())

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
  }

  onCommandClientRun () {
    console.log('Bot online!')
  }
}
