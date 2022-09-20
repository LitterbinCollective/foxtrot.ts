import { Context } from 'detritus-client/lib/command';

import { CatvoxCommandClient } from '../../application';
import { BaseVoiceCommand } from './base';
import { VoiceStore } from '../../stores';

export default class CurrentlyPlayingCommand extends BaseVoiceCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'current',
      aliases: ['c', 'curplay', 'nowplaying', 'np'],
    });
  }

  public async run(ctx: Context) {
    if (!ctx.guild) return;
    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    if (voice.isPlaying) voice.queue.announcer.play();
    else ctx.reply('Nothing is playing right now.');
  }
}
