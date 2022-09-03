import { Context } from 'detritus-client/lib/command';

import { CatvoxCommandClient } from '../../../application';
import { BaseVoiceCommand } from '../base';
import { VoiceStore } from '../../../stores';
import { listEffects } from '../../../utils';

export default class EffectListCommand extends BaseVoiceCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'e list',
      aliases: ['effect list', 'e ls', 'effect ls'],
    });
  }

  public run(ctx: Context) {
    if (!ctx.guild) return;
    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    const embed = listEffects(voice.effects.list, voice.effects.STACK_LIMIT);
    ctx.reply({ embed });
  }
}
