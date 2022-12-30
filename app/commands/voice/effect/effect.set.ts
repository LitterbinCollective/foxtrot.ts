import {
  CommandClient,
  Constants as DetritusConstants,
  Utils,
} from 'detritus-client';

import { Constants, listOptions } from '@/modules/utils';

import { BaseVoiceCommand, VoiceContext } from '../base';

export const COMMAND_NAME = 'e set';

export default class EffectSetCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: COMMAND_NAME,
      aliases: ['effect set'],
      type: [
        {
          name: 'effect',
          type: DetritusConstants.CommandArgumentTypes.NUMBER,
          required: true,
        },
        {
          name: 'key',
          type: DetritusConstants.CommandArgumentTypes.STRING,
          required: true,
        },
        {
          name: 'value',
          type: DetritusConstants.CommandArgumentTypes.STRING,
          required: true,
        },
      ],
    });
  }

  public run(
    ctx: VoiceContext,
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
    ctx.reply({ embed });
  }
}
