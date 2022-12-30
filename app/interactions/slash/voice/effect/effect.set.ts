import { Constants as DetritusConstants, Utils } from 'detritus-client';

import { Constants, listOptions } from '@/modules/utils';

import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';

export class EffectSetCommand extends BaseVoiceCommandOption {
  public name = 'set';
  public description = 'Set value of the specified effect option.';

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
          description: 'Option key',
          type: DetritusConstants.ApplicationCommandOptionTypes.STRING,
          required: true,
        },
        {
          name: 'value',
          description: 'Option value',
          type: DetritusConstants.ApplicationCommandOptionTypes.STRING,
          required: true,
        },
      ],
    });
  }

  public run(
    ctx: VoiceInteractionContext,
    { effect, key, value }: { effect: number; key: string; value: string }
  ) {
    ctx.voice.effects.setValue(effect, key, value);

    const { name, options, optionsRange } =
      ctx.voice.effects.getEffectInfo(effect);
    const embed = listOptions(name, options, optionsRange);
    embed.setTitle(
      Constants.EMOJIS.CHECK +
        ' Set ' +
        Utils.Markup.codestring(key) +
        ' to ' +
        Utils.Markup.codestring(value)
    );
    embed.setFooter('Effect ID: ' + effect + ' (' + name + ')');
    ctx.editOrRespond({ embed });
  }
}
