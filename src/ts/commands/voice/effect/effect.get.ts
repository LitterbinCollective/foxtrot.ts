import { Context } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';

import { CatvoxCommandClient } from '../../../application';
import { BaseVoiceCommand } from '../base';
import { VoiceStore } from '../../../stores';

export const COMMAND_NAME = 'e get';

export default class EffectGetCommand extends BaseVoiceCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: COMMAND_NAME,
      aliases: ['effect get'],
      type: [
        { name: 'effect', type: CommandArgumentTypes.NUMBER, required: true },
        { name: 'key', type: CommandArgumentTypes.STRING, required: true },
      ],
    });
  }

  public run(ctx: Context, { effect, key }: { effect: number; key: string }) {
    if (!ctx.guild) return;
    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    const value = voice.effects.getValue(effect, key);
    ctx.reply(value.toString());
  }
}
