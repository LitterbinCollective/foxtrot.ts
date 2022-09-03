import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { BaseCommandOption, InteractionContextExtended } from '../../../base';
import { VoiceStore } from '../../../../stores';
import { listOptions } from '../../../../utils';

export class EffectOptionsCommand extends BaseCommandOption {
  public name = 'options';
  public description = 'Get all options of a specified effect.';

  constructor() {
    super({
      options: [
        {
          name: 'effect',
          description: '# of the effect',
          type: ApplicationCommandOptionTypes.INTEGER,
          required: true
        }
      ]
    })
  }

  public run(ctx: InteractionContextExtended, { effect }: { effect: number }) {
    if (!ctx.guild) return;
    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    const { name, options, optionsRange } = voice.effects.getEffectInfo(effect);
    const embed = listOptions(name, options, optionsRange);
    ctx.editOrRespond({ embed });
  }
}