import { Interaction } from 'detritus-client';

import { VoiceStore } from '@/modules/stores';

import { BaseSlashCommand } from '../../base';

export default class JoinCommand extends BaseSlashCommand {
  public name = 'join';
  public description = 'Connects to a voice channel.';

  public async run(ctx: Interaction.InteractionContext) {
    if (!ctx.member || !ctx.guild || !ctx.channel) return;
    if (!ctx.member.voiceChannel)
      return ctx.editOrRespond(
        'You are not connected to any voice channel on this server.'
      );

    VoiceStore.create(ctx.member.voiceChannel, ctx.channel);

    return await ctx.editOrRespond('Hello.');
  }
}
