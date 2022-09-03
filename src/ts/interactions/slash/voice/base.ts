import { ParsedArgs } from 'detritus-client/lib/interaction';

import { BaseSlashCommand, InteractionContextExtended } from '../../base';
import { VoiceStore } from '../../../stores';

export class BaseVoiceCommand extends BaseSlashCommand {
  public async onBeforeRun(ctx: InteractionContextExtended, _: ParsedArgs) {
    if (!ctx.guild || !ctx.member) return false;

    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) {
      await ctx.editOrRespond('Not in the voice channel.');
      return false;
    }
    if (!voice.initialized) {
      await ctx.editOrRespond('Voice not yet initialized!');
      return false;
    }
    if (!voice.canExecuteVoiceCommands(ctx.member)) {
      await ctx.editOrRespond(
        'You are not in the voice channel this bot is currently in.'
      );
      return false;
    }

    return true;
  }
}