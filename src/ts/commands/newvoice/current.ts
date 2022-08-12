import { Context } from 'detritus-client/lib/command';

import { CatvoxCommandClient } from '../../Application';
import { BaseVoiceCommand } from './base';

export default class SkipCommand extends BaseVoiceCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'current',
      aliases: ['c', 'curplay'],
    });
  }

  public async run(ctx: Context) {
    if (!ctx.guild) return;
    const voice = this.commandClient.application.newvoices.get(ctx.guild.id);
    if (!voice) return;

    if (voice.isPlaying) voice.queue.announcer.play();
    else ctx.reply('Nothing is playing right now.');
  }
}
