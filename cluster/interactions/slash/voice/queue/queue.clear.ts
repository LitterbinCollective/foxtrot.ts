import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';

export class QueueClearCommand extends BaseVoiceCommandOption {
  public name = 'clear';
  public description = 'clear the queue';

  public async run(ctx: VoiceInteractionContext) {
    if (!ctx.guild) return;

    ctx.voice.queue.clear();
    ctx.editOrRespond(await this.t(ctx, 'commands.queue.clear'));
  }
}
