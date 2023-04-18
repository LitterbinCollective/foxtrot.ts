import { Interaction, Utils } from 'detritus-client';

import { Constants } from '@/modules/utils';

import { BaseSlashCommand } from '../../base';

export default class PingCommand extends BaseSlashCommand {
  public name = 'ping';
  public description = 'ping-pong!';

  public async run(ctx: Interaction.InteractionContext) {
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

    ctx.editOrRespond({ embed });
  }
}
