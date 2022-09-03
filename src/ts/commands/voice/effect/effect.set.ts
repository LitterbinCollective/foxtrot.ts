import { Context } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { CatvoxCommandClient } from '../../../application';
import { EMOJIS } from '../../../constants';
import { BaseVoiceCommand } from '../base';
import { VoiceStore } from '../../../stores';
import { listOptions } from '../../../utils';

export const COMMAND_NAME = 'e set';

export default class EffectSetCommand extends BaseVoiceCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: COMMAND_NAME,
      aliases: ['effect set'],
      type: [
        { name: 'effect', type: CommandArgumentTypes.NUMBER, required: true },
        { name: 'key', type: CommandArgumentTypes.STRING, required: true },
        { name: 'value', type: CommandArgumentTypes.STRING, required: true },
      ],
    });
  }

  public run(
    ctx: Context,
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
    ctx.reply({ embed });
  }
}
