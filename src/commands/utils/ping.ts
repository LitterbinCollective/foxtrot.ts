import { ClusterClient } from 'detritus-client'
import { Context } from 'detritus-client/lib/command'

import { CommandClientExtended } from '../../Application'
import { BaseCommand } from '../../BaseCommand'

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
    const text: string[] = [
      'REST: ' + rest + 'ms',
      'Gateway: ' + gateway + 'ms'
    ]
    const res = this.commandClient.application.voices.get(ctx.guild.id)
    if (res) {
      let voice = await res.connection.gateway.ping()
      text.push('Voice: ' + voice + 'ms')
    }

    ctx.reply(
      'Pong! ' + text.join(' / ') + '. (shardId: ' + ctx.shardId + ')'
    )
  }
}
