import { Constants as DetritusConstants, Utils } from 'detritus-client';

import { Constants, listEffects } from '@/modules/utils';

import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';

export class EffectRemoveCommand extends BaseVoiceCommandOption {
  public name = 'remove';
  public description = 'Remove the specified effect from the effect stack.';

  constructor() {
    super({
      options: [
        {
          name: 'effect',
          description: '# of the effect',
          type: DetritusConstants.ApplicationCommandOptionTypes.INTEGER,
          required: true,
        },
      ],
    });
  }

  public run(ctx: VoiceInteractionContext, { effect }: { effect: number }) {
    ctx.voice.effects.removeEffect(effect);
    const embed = listEffects(ctx.voice.effects.list, ctx.voice.effects.STACK_LIMIT);
    embed.setTitle(
      Constants.EMOJIS.MINUS + ' Removed effect ' + Utils.Markup.codestring(effect.toString())
    );
    ctx.editOrRespond({ embed });
  }
}
