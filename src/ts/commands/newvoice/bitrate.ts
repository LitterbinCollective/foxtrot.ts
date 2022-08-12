import { Context } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';

import { CatvoxCommandClient } from '../../Application';
import { BaseVoiceCommand } from './base';

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

    const voice = this.commandClient.application.newvoices.get(ctx.guild.id);
    if (!voice) return;

    voice.bitrate = bitrate;
  }
}
