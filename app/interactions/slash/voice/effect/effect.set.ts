import { Constants as DetritusConstants, Utils } from 'detritus-client';

import { Constants } from '@/modules/utils';
import { listOptions } from '@/modules/utils/shard-specific';

import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';

export class EffectSetCommand extends BaseVoiceCommandOption {
  public name = 'set';
  public description = 'set value of the specified effect option';

  constructor() {
    super({
      options: [
        {
          name: 'effect',
          description: '# of the effect',
          type: DetritusConstants.ApplicationCommandOptionTypes.INTEGER,
          required: true,
        },
        {
          name: 'key',
          description: 'option key',
          type: DetritusConstants.ApplicationCommandOptionTypes.STRING,
          required: true,
        },
        {
          name: 'value',
          description: 'option value',
          type: DetritusConstants.ApplicationCommandOptionTypes.STRING,
          required: true,
        },
      ],
    });
  }

  public async run(
    ctx: VoiceInteractionContext,
    { effect, key, value }: { effect: number; key: string; value: string }
  ) {
    if (!ctx.guild) return;
    ctx.voice.effects.setValue(effect, key, value);

    const { name, options, optionsRange } =
      ctx.voice.effects.getEffectInfo(effect);
    const embed = await listOptions(ctx.guild, name, options, optionsRange);
    embed.setTitle(
      Constants.EMOJIS.CHECK +
        ' ' +
        (await this.t(ctx, 'commands.effect.set', key, value))
    );
    embed.setFooter(
      await this.t(ctx, 'commands.effect.effect-id', effect, name)
    );
    ctx.editOrRespond({ embed });
  }
}
