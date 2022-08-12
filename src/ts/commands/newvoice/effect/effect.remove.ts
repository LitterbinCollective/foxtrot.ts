import { Context } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { CatvoxCommandClient } from '../../../Application';
import { EMOJIS } from '../../../constants';
import { BaseVoiceCommand } from '../base';
import { listEffects } from './effect';

export default class EffectRemoveCommand extends BaseVoiceCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'e remove',
      aliases: ['effect remove', 'e rm', 'effect rm'],
      type: [
        { name: 'effect', type: CommandArgumentTypes.NUMBER, required: true },
      ],
    });
  }

  public run(ctx: Context, { effect }: { effect: number }) {
    if (!ctx.guild) return;
    const voice = this.commandClient.application.newvoices.get(ctx.guild.id);
    if (!voice) return;

    voice.effects.removeEffect(effect);
    const embed = listEffects(voice.effects.list, voice.effects.STACK_LIMIT);
    embed.title =
      EMOJIS.MINUS + ' Removed effect ' + Markup.codestring(effect.toString());
    ctx.reply({ embed });
  }
}
