import { Context } from 'detritus-client/lib/command';

import { CatvoxCommandClient } from '../../Application';
import { BaseVoiceCommand } from './base';

export default class SkipCommand extends BaseVoiceCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'skip',
      aliases: ['s'],
    });
  }

  public async run(ctx: Context) {
    if (!ctx.member || !ctx.guild) return;

    const voice = this.commandClient.application.newvoices.get(ctx.guild.id);
    if (!voice) return;

    voice.skip();
  }
}
