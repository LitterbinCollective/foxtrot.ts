import { Context } from 'detritus-client/lib/command';

import { GMCommandClient } from '../../Application';
import { BaseCommand } from '../../BaseCommand';
import NewVoice from '../../voice/new';

export default class NJoinCommand extends BaseCommand {
  constructor(commandClient: GMCommandClient) {
    super(commandClient, {
      name: 'njoin',
      aliases: ['nconnect', 'nj'],
    });
  }

  public async run(ctx: Context) {
    if (!ctx.member || !ctx.guild || !ctx.channel) return;
    if (!ctx.member.voiceChannel) {
      return await ctx.reply('You are not in the voice channel.');
    }

    if (this.commandClient.application.newvoices.has(ctx.guild.id)) {
      return await ctx.reply('Already in a voice channel on this server.');
    }

    new NewVoice(
      this.commandClient.application,
      ctx.member.voiceChannel,
      ctx.channel
    );
    return await ctx.reply(Math.random() > 0.95 ? 'Oh hi Mark.' : 'Hi.');
  }
}
