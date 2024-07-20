import { Interaction } from 'detritus-client';

import { VoiceStore } from '@cluster/stores';
import { UserError } from '@cluster/utils';

import { BaseSlashCommand } from '../../base';

export default class JoinCommand extends BaseSlashCommand {
  public name = 'join';
  public description = 'connects to a voice channel';

  public async run(ctx: Interaction.InteractionContext) {
    if (!ctx.member || !ctx.guild || !ctx.channel) return;
    if (!ctx.member.voiceChannel)
      throw new UserError('voice-check.member-not-in-voice');

    await VoiceStore.create(ctx.member.voiceChannel, ctx.channel);
    return await ctx.editOrRespond(await this.t(ctx, 'commands.join-msg'));
  }
}
