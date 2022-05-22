import { Context } from 'detritus-client/lib/command';

import { GMCommandClient } from '../../Application';
import { BaseCommand } from '../../BaseCommand';

export default class NLeaveCommand extends BaseCommand {
  constructor(commandClient: GMCommandClient) {
    super(commandClient, {
      name: 'nleave',
      aliases: ['nl', 'ngtfo', 'nstop'],
    });
  }

  public async run(ctx: Context) {
    const voice = this.commandClient.application.newvoices.get(ctx.guild.id);
    if (!voice) {
      return await ctx.reply('Already gone.');
    }
    if (!voice.canLeave(ctx.member)) {
      return await ctx.reply(
        'You are not in the voice channel this bot is currently in.'
      );
    }

    voice.kill();
    return await ctx.reply('Gone.');
  }
}
