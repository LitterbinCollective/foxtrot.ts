import { Constants as DetritusConstants, CommandClient, Utils } from 'detritus-client';

import { listEffects } from '@cluster/utils';

import { BaseVoiceCommand, VoiceContext } from '../base';

export default class EffectListCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'e list',
      aliases: ['effect list', 'e ls', 'effect ls'],
      args: [
        {
          label: 'spec',
          name: 'spec',
          aliases: ['s', 'code', 'c'],
          type: DetritusConstants.CommandArgumentTypes.BOOL,
          default: false,
        }
      ]
    });
  }

  public async run(ctx: VoiceContext, { spec }: { spec: boolean }) {
    if (!ctx.guild) return;

    if (spec) {
      const spec = ctx.voice.effects.generateEffectSpecString();
      return await ctx.reply(Utils.Markup.codestring(spec));
    }

    const embed = await listEffects(
      ctx.guild,
      ctx.voice.effects.list
    );
    return await ctx.reply({ embed });
  }
}
