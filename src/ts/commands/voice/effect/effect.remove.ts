import { Context } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { CatvoxCommandClient } from '../../../application';
import { EMOJIS } from '../../../constants';
import { BaseVoiceCommand } from '../base';
import { VoiceStore } from '../../../stores';
import { listEffects } from '../../../utils';

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
    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    voice.effects.removeEffect(effect);
    const embed = listEffects(voice.effects.list, voice.effects.STACK_LIMIT);
    embed.setTitle(
      EMOJIS.MINUS + ' Removed effect ' + Markup.codestring(effect.toString())
    );
    ctx.reply({ embed });
  }
}
