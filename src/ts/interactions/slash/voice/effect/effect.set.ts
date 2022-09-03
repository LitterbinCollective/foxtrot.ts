import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { BaseCommandOption, InteractionContextExtended } from '../../../base';
import { VoiceStore } from '../../../../stores';
import { listOptions } from '../../../../utils';
import { EMOJIS } from '../../../../constants';

export class EffectSetCommand extends BaseCommandOption {
  public name = 'set';
  public description = 'Set value of the specified effect option.';

  constructor() {
    super({
      options: [
        {
          name: 'effect',
          description: '# of the effect',
          type: ApplicationCommandOptionTypes.INTEGER,
          required: true
        },
        {
          name: 'key',
          description: 'Option key',
          type: ApplicationCommandOptionTypes.STRING,
          required: true
        },
        {
          name: 'value',
          description: 'Option value',
          type: ApplicationCommandOptionTypes.STRING,
          required: true
        }
      ]
    })
  }

  public run(
    ctx: InteractionContextExtended,
    { effect, key, value }: { effect: number; key: string; value: string }
  ) {
    if (!ctx.guild) return;
    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    voice.effects.setValue(effect, key, value);

    const { name, options, optionsRange } = voice.effects.getEffectInfo(effect);
    const embed = listOptions(name, options, optionsRange);
    embed.setTitle(
      EMOJIS.CHECK +
      ' Set ' +
      Markup.codestring(key) +
      ' to ' +
      Markup.codestring(value)
    );
    embed.setFooter('Effect ID: ' + effect + ' (' + name + ')');
    ctx.editOrRespond({ embed });
  }
}