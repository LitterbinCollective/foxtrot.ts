import { Context } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';

import { CatvoxCommandClient } from '../../application';
import { BaseVoiceCommand } from './base';
import { VoiceStore } from '../../stores';

export default class SkipCommand extends BaseVoiceCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'volume',
      aliases: ['v'],
      label: 'volume',
      required: true,
      type: CommandArgumentTypes.NUMBER,
    });
  }

  public async run(ctx: Context, { volume }: { volume: number }) {
    if (!ctx.guild) return;
    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    voice.volume = volume / 100;
  }
}
