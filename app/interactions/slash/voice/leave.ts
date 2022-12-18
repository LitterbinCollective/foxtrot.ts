import { Interaction } from 'detritus-client';

import { VoiceStore } from '@/modules/stores';

import { BaseSlashCommand } from '../../base';

export default class LeaveCommand extends BaseSlashCommand {
  public name = 'leave';
  public description = 'Leaves the connected voice channel.';

  public async run(ctx: Interaction.InteractionContext) {
    if (!ctx.member || !ctx.guild) return;

    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return await ctx.editOrRespond('Already gone.');
    if (!voice.canLeave(ctx.member))
      return await ctx.editOrRespond(
        'You are not in the voice channel this bot is currently in.'
      );

    voice.kill();
    return await ctx.editOrRespond('Gone.');
  }
}
