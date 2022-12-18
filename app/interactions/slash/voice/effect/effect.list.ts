import { listEffects } from '@/modules/utils';

import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';

export class EffectListCommand extends BaseVoiceCommandOption {
  public name = 'list';
  public description = 'List effects.';

  public async run(ctx: VoiceInteractionContext) {
    const embed = listEffects(ctx.voice.effects.list, ctx.voice.effects.STACK_LIMIT);
    ctx.editOrRespond({ embed });
  }
}
