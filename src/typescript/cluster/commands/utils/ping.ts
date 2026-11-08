import { Command, CommandClient, Utils } from 'detritus-client';

import { Constants } from '@cluster/utils';

import { BaseCommand } from '../base';
import app from '@cluster/index';

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
        app.emoji('LINK') +
        ' ' +
        rest +
        unit +
        '\n' +
        app.emoji('SATELLITE') +
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
