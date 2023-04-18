import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';

export class BitrateGetCommand extends BaseVoiceCommandOption {
  public name = 'get';
  public description = 'get opus encoder bitrate (in bps)';

  public async run(ctx: VoiceInteractionContext) {
    if (!ctx.guild) return;

    ctx.editOrRespond(
      await this.t(ctx, 'commands.bitrate.current', ctx.voice.bitrate)
    );
  }
}
