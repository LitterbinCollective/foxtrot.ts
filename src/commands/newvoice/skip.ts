import { Context } from 'detritus-client/lib/command';

import { GMCommandClient } from '../../Application';
import { BaseCommand } from '../../BaseCommand';

export default class SkipCommand extends BaseCommand {
  constructor(commandClient: GMCommandClient) {
    super(commandClient, {
      name: 'nskip',
      aliases: ['ns'],
    });
  }

  public async run(ctx: Context) {
    if (!ctx.member || !ctx.guild) return;
    const voice = this.commandClient.application.newvoices.get(ctx.guild.id);
    if (!voice)
      return await ctx.reply('Not in the voice channel.');
    if (!voice.canExecuteVoiceCommands(ctx.member))
      return await ctx.reply(
        'You are not in the voice channel this bot is currently in.'
      );
    if (!voice.initialized)
      return await ctx.reply('Voice not yet initialized!');

    voice.skip();
  }
}
