import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { listOptions } from '@/modules/utils';

import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';

export class EffectOptionsCommand extends BaseVoiceCommandOption {
  public name = 'options';
  public description = 'Get all options of a specified effect.';

  constructor() {
    super({
      options: [
        {
          name: 'effect',
          description: '# of the effect',
          type: ApplicationCommandOptionTypes.INTEGER,
          required: true,
        },
      ],
    });
  }

  public run(ctx: VoiceInteractionContext, { effect }: { effect: number }) {
    const { name, options, optionsRange } =
      ctx.voice.effects.getEffectInfo(effect);
    const embed = listOptions(name, options, optionsRange);
    ctx.editOrRespond({ embed });
  }
}
