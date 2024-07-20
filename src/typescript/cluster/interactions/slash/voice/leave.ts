import { Interaction } from 'detritus-client';

import { VoiceStore } from '@cluster/stores';

import { BaseSlashCommand } from '../../base';
import { VoiceInteractionContext } from './base';

export default class LeaveCommand extends BaseSlashCommand {
  public name = 'leave';
  public description = 'leaves the connected voice channel';

  public async onBeforeRun(
    ctx: Interaction.InteractionContext
  ): Promise<boolean> {
    if (!ctx.member || !ctx.guild) return false;

    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) {
      await ctx.editOrRespond(
        await this.t(ctx, 'voice-check.bot-not-in-voice')
      );
      return false;
    }

    if (!voice.canLeave(ctx.member)) {
      await ctx.editOrRespond(
        await this.t(ctx, 'voice-check.member-not-in-voice')
      );
      return false;
    }

    (ctx as VoiceInteractionContext).voice = voice;

    return true;
  }

  public async run(ctx: VoiceInteractionContext) {
    ctx.voice.kill();
    return await ctx.editOrRespond(await this.t(ctx, 'commands.voice-leave'));
  }
}
