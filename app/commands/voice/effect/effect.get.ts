import { CommandClient, Constants } from 'detritus-client';

import { BaseVoiceCommand, VoiceContext } from '../base';

export const COMMAND_NAME = 'e get';

export default class EffectGetCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: COMMAND_NAME,
      aliases: ['effect get'],
      type: [
        {
          name: 'effect',
          type: Constants.CommandArgumentTypes.NUMBER,
          required: true,
        },
        {
          name: 'key',
          type: Constants.CommandArgumentTypes.STRING,
          required: true,
        },
      ],
    });
  }

  public run(
    ctx: VoiceContext,
    { effect, key }: { effect: number; key: string }
  ) {
    const value = ctx.voice.effects.getValue(effect, key);
    ctx.reply(value.toString());
  }
}
