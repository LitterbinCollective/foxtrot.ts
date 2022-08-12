import { Context } from 'detritus-client/lib/command';

import { CatvoxCommandClient } from '../../../Application';
import { BaseVoiceCommand } from '../base';
import { listEffects } from './effect';

export default class EffectListCommand extends BaseVoiceCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'e list',
      aliases: ['effect list', 'e ls', 'effect ls'],
    });
  }

  public run(ctx: Context) {
    if (!ctx.guild) return;
    const voice = this.commandClient.application.newvoices.get(ctx.guild.id);
    if (!voice) return;

    const embed = listEffects(voice.effects.list, voice.effects.STACK_LIMIT);
    ctx.reply({ embed });
  }
}
