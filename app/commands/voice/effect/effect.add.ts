import {
  CommandClient,
  Constants as DetritusConstants,
  Utils,
} from 'detritus-client';

import { Constants, listEffects } from '@/modules/utils';

import { BaseVoiceCommand, VoiceContext } from '../base';
import { COMMAND_NAME as COMMAND_NAME_GET } from './effect.get';
import { COMMAND_NAME as COMMAND_NAME_OPTIONS } from './effect.options';
import { COMMAND_NAME as COMMAND_NAME_SET } from './effect.set';

export default class EffectAddCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'e add',
      aliases: ['effect add'],
      type: [
        {
          name: 'effect',
          type: DetritusConstants.CommandArgumentTypes.STRING,
          required: true,
        },
      ],
    });
  }

  public run(ctx: VoiceContext, { effect }: { effect: string }) {
    const id = ctx.voice.effects.addEffect(effect);
    const embed = listEffects(
      ctx.voice.effects.list,
      ctx.voice.effects.STACK_LIMIT
    );

    embed.setTitle(
      Constants.EMOJIS.PLUS + ' Added effect ' + Utils.Markup.codestring(effect)
    );

    // tips
    const { name, options } = ctx.voice.effects.getEffectInfo(id);
    const optionsKeys = Object.keys(options);
    const key = optionsKeys[(optionsKeys.length * Math.random()) << 0];
    const prefix = this.commandClient.prefixes.custom.first();
    embed.addField(
      'List options',
      Utils.Markup.codestring(`${prefix}${COMMAND_NAME_OPTIONS} ${id}`),
      true
    );
    embed.addField(
      'Set option',
      Utils.Markup.codestring(
        `${prefix}${COMMAND_NAME_SET} ${id} ${key} ${options[key]}`
      ),
      true
    );
    embed.addField(
      'Get option',
      Utils.Markup.codestring(`${prefix}${COMMAND_NAME_GET} ${id} ${key}`),
      true
    );

    embed.setFooter('Effect ID: ' + id + ' (' + name + ')');
    ctx.reply({ embed });
  }
}
