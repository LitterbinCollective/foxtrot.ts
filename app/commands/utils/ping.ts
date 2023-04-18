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

    const unit = await this.t(ctx, 'commands.ping.unit');
    const embed = new Utils.Embed({
      title: await this.t(ctx, 'commands.ping.pong'),
      description:
        Constants.EMOJIS.LINK +
        ' ' +
        rest +
        unit +
        '\n' +
        Constants.EMOJIS.SATELLITE +
        ' ' +
        gateway +
        unit,
      footer: {
        text: await this.t(ctx, 'commands.ping.footer', ctx.client.shardId),
      },
      color: Constants.EMBED_COLORS.DEFAULT,
    });

    ctx.reply({ embed });
  }
}
