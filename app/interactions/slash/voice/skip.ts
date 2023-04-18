import { BaseVoiceSlashCommand, VoiceInteractionContext } from './base';

export default class SkipCommand extends BaseVoiceSlashCommand {
  public name = 'skip';
  public description = 'skip currently playing media';

  public async run(ctx: VoiceInteractionContext) {
    ctx.voice.skip();
    ctx.editOrRespond(await this.t(ctx, 'commands.skipped'));
  }
}
