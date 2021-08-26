import { ClusterClient } from 'detritus-client'
import { Context } from 'detritus-client/lib/command'

import { CommandClientExtended } from '../../Application'
import BaseCommand from '../../BaseCommand'

export default class PingCommand extends BaseCommand {
  constructor (commandClient: CommandClientExtended) {
    super(commandClient, {
      name: 'ping'
    })
  }

  public async run (ctx: Context) {
    const {
      gateway,
      rest
    } = await (this.commandClient.client as ClusterClient).shards.get(ctx.shardId).ping()

    ctx.reply(
      'Pong! REST: ' + rest + 'ms / Gateway: ' + gateway + 'ms. (shardId: ' + ctx.shardId + ')'
    )
  }
}
