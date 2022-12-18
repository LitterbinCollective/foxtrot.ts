import { CommandClient, Constants } from 'detritus-client';

import { listOptions } from '@/modules/utils';

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
        { name: 'effect', type: Constants.CommandArgumentTypes.NUMBER, required: true },
      ],
    });
  }

  public run(ctx: VoiceContext, { effect }: { effect: number }) {
    const { name, options, optionsRange } = ctx.voice.effects.getEffectInfo(effect);
    const embed = listOptions(name, options, optionsRange);
    ctx.reply({ embed });
  }
}