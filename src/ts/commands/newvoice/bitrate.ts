import { Context } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';

import { GMCommandClient } from '../../Application';
import { BaseCommand } from '../../BaseCommand';

export default class SkipCommand extends BaseCommand {
  constructor(commandClient: GMCommandClient) {
    super(commandClient, {
      name: 'bitrate',
      aliases: ['br', 'b'],
      label: 'bitrate',
      required: true,
      type: CommandArgumentTypes.NUMBER
    });
  }

  public async run(ctx: Context, { bitrate }: { bitrate: number }) {
    if (!ctx.guild) return;
    const voice = this.commandClient.application.newvoices.get(ctx.guild.id);
    if (!voice)
      return await ctx.reply('Not in the voice channel.');
    if (!voice.initialized)
      return await ctx.reply('Voice not yet initialized!');

   voice.bitrate = bitrate;
  }
}
