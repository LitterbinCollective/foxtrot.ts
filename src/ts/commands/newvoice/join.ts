import { Context } from 'detritus-client/lib/command';

import { CatvoxCommandClient } from '../../Application';
import { BaseCommand } from '../base';
import NewVoice from '../../voice/new';

export default class NJoinCommand extends BaseCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'join',
      aliases: ['connect', 'j'],
    });
  }

  public async run(ctx: Context) {
    if (!ctx.member || !ctx.guild || !ctx.channel) return;
    if (!ctx.member.voiceChannel)
      return ctx.reply(
        'You are not connected to any voice channel on this server.'
      );
    try {
      this.commandClient.application.newvoices.create(
        ctx.member.voiceChannel,
        ctx.channel
      );
    } catch (err: any) {
      if (err instanceof Error) return ctx.reply(err.message);
      else throw err;
    }
    return await ctx.reply(Math.random() > 0.95 ? 'Oh hi Mark.' : 'Hi.');
  }
}
