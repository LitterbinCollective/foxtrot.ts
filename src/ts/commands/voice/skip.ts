import { Context } from 'detritus-client/lib/command';

import { CatvoxCommandClient } from '../../application';
import { BaseVoiceCommand } from './base';
import { VoiceStore } from '../../stores';

export default class SkipCommand extends BaseVoiceCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'skip',
      aliases: ['s', 'next'],
    });
  }

  public async run(ctx: Context) {
    if (!ctx.member || !ctx.guild) return;

    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    voice.skip();
  }
}
