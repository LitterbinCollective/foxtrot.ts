import { Context, ParsedArgs } from 'detritus-client/lib/command';

import { BaseCommand } from '../base';

export class BaseVoiceCommand extends BaseCommand {
  public async onBeforeRun(ctx: Context, _: ParsedArgs) {
    if (!ctx.guild || !ctx.member) return false;

    const voice = this.commandClient.application.newvoices.get(ctx.guild.id);
    if (!voice) {
      await ctx.reply('Not in the voice channel.');
      return false;
    }
    if (!voice.initialized) {
      await ctx.reply('Voice not yet initialized!');
      return false;
    }
    if (!voice.canExecuteVoiceCommands(ctx.member)) {
      await ctx.reply(
        'You are not in the voice channel this bot is currently in.'
      );
      return false;
    }

    return true;
  }
}
