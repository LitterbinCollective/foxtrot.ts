import { Context } from 'detritus-client/lib/command';

import { GMCommandClient } from '../../Application';
import { BaseCommand } from '../../BaseCommand';

export default class SkipCommand extends BaseCommand {
  constructor(commandClient: GMCommandClient) {
    super(commandClient, {
      name: 'ncurrent',
      aliases: ['nc', 'ncurplay'],
    });
  }

  public async run(ctx: Context) {
    const voice = this.commandClient.application.newvoices.get(ctx.guild.id);
    if (!voice) {
      return await ctx.reply('Not in the voice channel.');
    }
    if (!voice.initialized)
      return await ctx.reply('Voice not yet initialized!');

    if (voice.isPlaying) voice.queue.announcer.play();
    else ctx.reply('Nothing is playing right now.');
  }
}
