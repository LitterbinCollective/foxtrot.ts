import { Context } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';

import { CatvoxCommandClient } from '../../application';
import { BaseVoiceCommand } from './base';
import { VoiceStore } from '../../stores';

export default class SkipCommand extends BaseVoiceCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'bitrate',
      aliases: ['br', 'b'],
      label: 'bitrate',
      required: true,
      type: CommandArgumentTypes.NUMBER,
    });
  }

  public async run(ctx: Context, { bitrate }: { bitrate: number }) {
    if (!ctx.guild) return;

    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    voice.bitrate = bitrate;
  }
}
