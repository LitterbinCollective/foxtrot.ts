import { Command, CommandClient, Utils } from 'detritus-client';

import { Constants } from '@/modules/utils';

import { BaseCommand } from '../base';

export default class PingCommand extends BaseCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'ping',
    });
  }

  public async run(ctx: Command.Context) {
    const { rest, gateway } = await ctx.client.ping();

    const embed = new Utils.Embed({
      title: 'Pong!',
      description:
        Constants.EMOJIS.LINK +
        ' ' +
        rest +
        'ms\n' +
        Constants.EMOJIS.SATELLITE +
        ' ' +
        gateway +
        'ms',
      footer: { text: 'Shard ID: ' + ctx.shardId },
      color: Constants.EMBED_COLORS.DEFAULT,
    });

    ctx.reply({ embed });
  }
}
