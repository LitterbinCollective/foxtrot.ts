import { Context } from 'detritus-client/lib/command';

import { CatvoxCommandClient } from '../../../Application';
import { BaseVoiceCommand } from '../base';

export default class EffectClearCommand extends BaseVoiceCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'e clear',
      aliases: ['effect clear', 'e clr', 'effect clr'],
    });
  }

  public run(ctx: Context) {
    if (!ctx.guild) return;
    const voice = this.commandClient.application.newvoices.get(ctx.guild.id);
    if (!voice) return;

    voice.effects.clearEffects();
    ctx.reply('Effects cleared.');
  }
}
