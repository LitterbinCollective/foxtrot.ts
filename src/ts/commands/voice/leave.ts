import { Context } from 'detritus-client/lib/command';

import { CatvoxCommandClient } from '../../application';
import { BaseCommand } from '../base';
import { VoiceStore } from '../../stores';

export default class NLeaveCommand extends BaseCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'leave',
      aliases: ['l', 'gtfo', 'stop'],
    });
  }

  public async run(ctx: Context) {
    if (!ctx.member || !ctx.guild) return;
    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return await ctx.reply('Already gone.');
    if (!voice.canLeave(ctx.member))
      return await ctx.reply(
        'You are not in the voice channel this bot is currently in.'
      );

    voice.kill();
    return await ctx.reply('Gone.');
  }
}
