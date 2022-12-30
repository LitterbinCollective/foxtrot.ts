import { Utils } from 'detritus-client';

import { VoiceEffectManager } from '@/modules/voice/managers';
import { Constants, listEffects } from '@/modules/utils';

import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';

export class EffectAddCommand extends BaseVoiceCommandOption {
  public name = 'add';
  public description = 'Add an effect to the effect stack.';

  constructor() {
    super({
      options: [
        {
          name: 'effect',
          description: 'Effect to add',
          choices: VoiceEffectManager.getArgumentType(),
          required: true,
        },
      ],
    });
  }

  public run(ctx: VoiceInteractionContext, { effect }: { effect: string }) {
    if (!ctx.guild) return;

    const id = ctx.voice.effects.addEffect(effect);
    const embed = listEffects(
      ctx.voice.effects.list,
      ctx.voice.effects.STACK_LIMIT
    );
    const { name } = ctx.voice.effects.getEffectInfo(id);
    embed.setTitle(
      Constants.EMOJIS.PLUS + ' Added effect ' + Utils.Markup.codestring(effect)
    );
    embed.setFooter('Effect ID: ' + id + ' (' + name + ')');
    ctx.editOrRespond({ embed });
  }
}
