import {
  CommandClient,
  Constants as DetritusConstants,
  Utils,
} from 'detritus-client';

import { Constants } from '@clu/utils';
import { Functions } from '@clu/utils';

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

  public async run(ctx: VoiceContext, { effect }: { effect: string }) {
    if (!ctx.guild) return;
    const id = ctx.voice.effects.addEffect(effect);
    const embed = await Functions.listEffects(
      ctx.guild,
      ctx.voice.effects.list
    );

    embed.setTitle(
      Constants.EMOJIS.PLUS +
        ' ' +
        (await this.t(ctx, 'commands.effect.add', effect))
    );

    // tips
    const { name, options } = ctx.voice.effects.getEffectInfo(id);
    const optionsKeys = Object.keys(options);
    const key = optionsKeys[(optionsKeys.length * Math.random()) << 0];
    const prefix = this.commandClient.prefixes.custom.first();
    embed.addField(
      await this.t(ctx, 'commands.effect.list-options'),
      Utils.Markup.codestring(`${prefix}${COMMAND_NAME_OPTIONS} ${id}`),
      true
    );
    embed.addField(
      await this.t(ctx, 'commands.effect.set-option'),
      Utils.Markup.codestring(
        `${prefix}${COMMAND_NAME_SET} ${id} ${key} ${options[key]}`
      ),
      true
    );
    embed.addField(
      await this.t(ctx, 'commands.effect.get-option'),
      Utils.Markup.codestring(`${prefix}${COMMAND_NAME_GET} ${id} ${key}`),
      true
    );

    embed.setFooter(await this.t(ctx, 'commands.effect.effect-id', id, effect));
    ctx.reply({ embed });
  }
}
