import { Interaction, Utils } from 'detritus-client';

import { Constants } from '@/modules/utils';

import { BaseSlashCommand } from '../../base';

export default class PingCommand extends BaseSlashCommand {
  public name = 'ping';
  public description = 'Ping-pong!';

  public async run(ctx: Interaction.InteractionContext) {
    const { rest, gateway } = await ctx.client.ping();

    const embed = new Utils.Embed({
      title: 'Pong!',
      description: Constants.EMOJIS.LINK + ' ' + rest + 'ms\n' +
        Constants.EMOJIS.SATELLITE + ' ' + gateway + 'ms',
      footer: { text: 'Shard ID: ' + ctx.shardId },
      color: Constants.EMBED_COLORS.DEFAULT,
    });

    ctx.editOrRespond({ embed });
  }
}
