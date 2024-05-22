import { CommandClient, Constants } from 'detritus-client';

import { Functions } from '@clu/utils';

import { BaseVoiceCommand, VoiceContext } from '../base';

export const COMMAND_NAME = 'e options';

export default class EffectOptionsCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: COMMAND_NAME,
      aliases: [
        'effect options',

        'e opts',
        'effect opts',

        'e settings',
        'effect settings',
      ],
      type: [
        {
          name: 'effect',
          type: Constants.CommandArgumentTypes.NUMBER,
          required: true,
        },
      ],
    });
  }

  public async run(ctx: VoiceContext, { effect }: { effect: number }) {
    if (!ctx.guild) return;
    const { name, options, optionsRange } =
      ctx.voice.effects.getEffectInfo(effect);
    const embed = await Functions.listOptions(ctx.guild, name, options, optionsRange);
    ctx.reply({ embed });
  }
}
