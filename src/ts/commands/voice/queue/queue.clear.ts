import { Context } from 'detritus-client/lib/command';

import { CatvoxCommandClient } from '../../../application';
import { VoiceStore } from '../../../stores';
import { BaseVoiceCommand } from '../base';

export default class QueueClearCommand extends BaseVoiceCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'queue clear',
      aliases: ['q clear', 'queue clr', 'q clr']
    });
  }

  public async run(ctx: Context) {
    if (!ctx.guild) return;

    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    voice.queue.clear();
    ctx.reply('Cleared queue.');
  }
}
