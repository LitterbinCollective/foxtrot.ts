import { Context } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';

import { CatvoxCommandClient } from '../../../Application';
import { BaseVoiceCommand } from '../base';
import { listOptions } from './effect';

export const COMMAND_NAME = 'e options';

export default class EffectOptionsCommand extends BaseVoiceCommand {
  constructor(commandClient: CatvoxCommandClient) {
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
        { name: 'effect', type: CommandArgumentTypes.NUMBER, required: true },
      ],
    });
  }

  public run(ctx: Context, { effect }: { effect: number }) {
    if (!ctx.guild) return;
    const voice = this.commandClient.application.newvoices.get(ctx.guild.id);
    if (!voice) return;

    const { name, options, optionsRange } = voice.effects.getEffectInfo(effect);
    const embed = listOptions(name, options, optionsRange);
    ctx.reply({ embed });
  }
}
