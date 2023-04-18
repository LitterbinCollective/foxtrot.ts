import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { listOptions } from '@/modules/utils';

import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';

export class EffectOptionsCommand extends BaseVoiceCommandOption {
  public name = 'options';
  public description = 'get all options of a specified effect';

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

  public async run(
    ctx: VoiceInteractionContext,
    { effect }: { effect: number }
  ) {
    if (!ctx.guild) return;
    const { name, options, optionsRange } =
      ctx.voice.effects.getEffectInfo(effect);
    const embed = await listOptions(ctx.guild, name, options, optionsRange);
    ctx.editOrRespond({ embed });
  }
}
