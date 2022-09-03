import { BaseSlashCommand, InteractionContextExtended } from '../../base';
import { VoiceStore } from '../../../stores';

export default class JoinCommand extends BaseSlashCommand {
  public name = 'leave';
  public description = 'Leaves the connected voice channel.';

  public async run(ctx: InteractionContextExtended) {
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