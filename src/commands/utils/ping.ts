import { ClusterClient } from 'detritus-client';
import { Context } from 'detritus-client/lib/command';

import { GMCommandClient } from '../../Application';
import { BaseCommand } from '../../BaseCommand';

export default class PingCommand extends BaseCommand {
  constructor(commandClient: GMCommandClient) {
    super(commandClient, {
      name: 'ping',
    });
  }

  public async run(ctx: Context) {
    const { gateway, rest } = await (
      this.commandClient.client as ClusterClient
    ).shards
      .get(ctx.shardId)
      .ping();
    const text: string[] = [
      'REST: ' + rest + 'ms',
      'Gateway: ' + gateway + 'ms',
    ];

    ctx.reply('Pong! ' + text.join(' / ') + '. (shardId: ' + ctx.shardId + ')');
  }
}
