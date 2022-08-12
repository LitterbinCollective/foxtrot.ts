import { Context } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';

import { CatvoxCommandClient } from '../../Application';
import { BaseVoiceCommand } from './base';

export default class SkipCommand extends BaseVoiceCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'volume',
      aliases: ['v'],
      label: 'volume',
      required: true,
      type: CommandArgumentTypes.FLOAT,
    });
  }

  public async run(ctx: Context, { volume }: { volume: number }) {
    if (!ctx.guild) return;
    const voice = this.commandClient.application.newvoices.get(ctx.guild.id);
    if (!voice) return;

    voice.volume = volume;
  }
}
