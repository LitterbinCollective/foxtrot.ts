import { Context } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { CatvoxCommandClient } from '../../../application';
import { EMOJIS } from '../../../constants';
import { BaseVoiceCommand } from '../base';
import { COMMAND_NAME as COMMAND_NAME_GET } from './effect.get';
import { COMMAND_NAME as COMMAND_NAME_OPTIONS } from './effect.options';
import { COMMAND_NAME as COMMAND_NAME_SET } from './effect.set';
import { VoiceStore } from '../../../stores';
import { listEffects } from '../../../utils';

export default class EffectAddCommand extends BaseVoiceCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'e add',
      aliases: ['effect add'],
      type: [
        { name: 'effect', type: CommandArgumentTypes.STRING, required: true },
      ],
    });
  }

  public run(ctx: Context, { effect }: { effect: string }) {
    if (!ctx.guild) return;
    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    const id = voice.effects.addEffect(effect);
    const embed = listEffects(voice.effects.list, voice.effects.STACK_LIMIT);

    embed.setTitle(EMOJIS.PLUS + ' Added effect ' + Markup.codestring(effect));

    // tips
    const { name, options } = voice.effects.getEffectInfo(id);
    const optionsKeys = Object.keys(options);
    const key = optionsKeys[(optionsKeys.length * Math.random()) << 0];
    const prefix = this.commandClient.prefixes.custom.first();
    embed.addField(
      'List options',
      Markup.codestring(`${prefix}${COMMAND_NAME_OPTIONS} ${id}`),
      true
    );
    embed.addField(
      'Set option',
      Markup.codestring(
        `${prefix}${COMMAND_NAME_SET} ${id} ${key} ${options[key]}`
      ),
      true
    );
    embed.addField(
      'Get option',
      Markup.codestring(`${prefix}${COMMAND_NAME_GET} ${id} ${key}`),
      true
    );

    embed.setFooter('Effect ID: ' + effect + ' (' + name + ')');
    ctx.reply({ embed });
  }
}
